const prisma = require('../config/prisma.singleton');
const { toProduct } = require('./producto.model');

class ProductoRepository {
  async findPage(limit, offset) {
    const [total, products] = await Promise.all([
      prisma.producto.count(),
      prisma.producto.findMany({
        orderBy: { idProducto: 'asc' },
        skip: offset,
        take: limit
      })
    ]);

    return { total, data: products.map(toProduct) };
  }

  async findById(idProducto) {
    const product = await prisma.producto.findUnique({ where: { idProducto } });
    return toProduct(product);
  }

  async create(product) {
    const created = await prisma.producto.create({ data: product });
    return toProduct(created);
  }

  async update(idProducto, product) {
    try {
      const updated = await prisma.producto.update({
        where: { idProducto },
        data: {
          proNombre: product.proNombre,
          proCategoria: product.proCategoria,
          proPvp: product.proPvp
        }
      });
      return toProduct(updated);
    } catch (error) {
      if (error.code === 'P2025') return null;
      throw error;
    }
  }

  async patch(idProducto, changes) {
    try {
      const updated = await prisma.producto.update({
        where: { idProducto },
        data: changes
      });
      return toProduct(updated);
    } catch (error) {
      if (error.code === 'P2025') return null;
      throw error;
    }
  }

  async delete(idProducto) {
    const result = await prisma.producto.deleteMany({ where: { idProducto } });
    return result.count > 0;
  }
}

module.exports = new ProductoRepository();
