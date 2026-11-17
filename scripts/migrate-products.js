const { Client } = require('pg');
const config = require('../src/config/env.config');

async function migrateProducts() {
  const targetConnectionString = process.env.RENDER_DATABASE_URL;
  if (!targetConnectionString) {
    throw new Error('Set RENDER_DATABASE_URL to the new Render PostgreSQL external connection string');
  }
  const sourceUrl = new URL('postgresql://localhost');
  sourceUrl.hostname = config.database.host;
  sourceUrl.port = String(config.database.port);
  sourceUrl.username = config.database.user;
  sourceUrl.password = config.database.password;
  sourceUrl.pathname = `/${encodeURIComponent(config.database.name)}`;
  sourceUrl.searchParams.set('schema', 'public');

  if (targetConnectionString === sourceUrl.toString()) {
    throw new Error('Source and target database URLs must be different');
  }

  const source = new Client({ connectionString: sourceUrl.toString() });
  const target = new Client({ connectionString: targetConnectionString });
  let transactionStarted = false;

  try {
    await source.connect();
    await target.connect();

    const sourceResult = await source.query(
      `SELECT idproducto AS "idProducto",
              pronombre AS "proNombre",
              procategoria AS "proCategoria",
              propvp AS "proPvp"
       FROM public.productos
       ORDER BY idproducto`
    );
    const targetCount = await target.query('SELECT COUNT(*) AS total FROM public.productos');
    if (Number(targetCount.rows[0].total) !== 0) {
      throw new Error('The Render productos table is not empty; migration stopped without changing it');
    }

    await target.query('BEGIN');
    transactionStarted = true;

    const batchSize = 250;
    for (let start = 0; start < sourceResult.rows.length; start += batchSize) {
      const batch = sourceResult.rows.slice(start, start + batchSize);
      const values = [];
      const placeholders = batch.map((product, index) => {
        const parameter = index * 4;
        values.push(
          product.idProducto,
          product.proNombre,
          product.proCategoria,
          product.proPvp
        );
        return `($${parameter + 1}, $${parameter + 2}, $${parameter + 3}, $${parameter + 4})`;
      });

      await target.query(
        `INSERT INTO public.productos (idproducto, pronombre, procategoria, propvp)
         VALUES ${placeholders.join(', ')}`,
        values
      );
    }

    const migratedCount = await target.query('SELECT COUNT(*) AS total FROM public.productos');
    if (Number(migratedCount.rows[0].total) !== sourceResult.rows.length) {
      throw new Error('Source and destination product counts do not match; migration was rolled back');
    }

    await target.query('COMMIT');
    transactionStarted = false;
    console.log(`Migrated ${sourceResult.rows.length} products to Render PostgreSQL.`);
  } catch (error) {
    if (transactionStarted) {
      await target.query('ROLLBACK');
    }
    throw error;
  } finally {
    await Promise.all([source.end(), target.end()]);
  }
}

migrateProducts().catch((error) => {
  console.error('Product migration failed:', error.message);
  process.exitCode = 1;
});
