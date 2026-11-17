const repository = require('../models/producto.repository');
const { AppError } = require('../middlewares/error.middleware');

async function getAll(req, res) {
  const { page, limit, offset } = req.pagination;
  const result = await repository.findPage(limit, offset);
  return res.json({ total: result.total, page, limit, data: result.data });
}

async function getById(req, res) {
  const product = await repository.findById(req.params.id);
  if (!product) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
  return res.json({ data: product });
}

async function create(req, res) {
  const product = await repository.create(req.body);
  res.location(`${req.baseUrl}/${encodeURIComponent(product.idProducto)}`);
  return res.status(201).json({ data: product });
}

async function update(req, res) {
  if (req.body.idProducto !== req.params.id) {
    throw new AppError(400, 'PRODUCT_ID_MISMATCH', 'idProducto must match the id in the URL');
  }
  const product = await repository.update(req.params.id, req.body);
  if (!product) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
  return res.json({ data: product });
}

async function patch(req, res) {
  const product = await repository.patch(req.params.id, req.body);
  if (!product) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
  return res.json({ data: product });
}

async function remove(req, res) {
  const deleted = await repository.delete(req.params.id);
  if (!deleted) throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found');
  return res.status(204).end();
}

module.exports = { getAll, getById, create, update, patch, remove };
