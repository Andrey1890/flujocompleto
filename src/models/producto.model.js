const PRODUCT_FIELDS = Object.freeze({
  idProducto: 'idproducto',
  proNombre: 'pronombre',
  proCategoria: 'procategoria',
  proPvp: 'propvp'
});

function toProduct(row) {
  if (!row) return null;
  return {
    idProducto: row.idProducto,
    proNombre: row.proNombre,
    proCategoria: row.proCategoria,
    proPvp: row.proPvp == null ? null : Number(row.proPvp)
  };
}

module.exports = Object.freeze({ PRODUCT_FIELDS, toProduct });
