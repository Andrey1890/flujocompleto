class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function notFound(req, res, next) {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const status = Number.isInteger(error.status) ? error.status : mapDatabaseError(error);
  const code = databaseErrorCode(error) || error.code || 'INTERNAL_SERVER_ERROR';
  const message = status >= 500 ? 'An unexpected error occurred' : error.message;

  if (status >= 500) {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, error);
  }

  return res.status(status).json({ error: { code, message } });
}

function databaseErrorCode(error) {
  if (error.code === '23505' || error.code === 'P2002') return 'DUPLICATE_PRODUCT';
  if (error.code === '23503' || error.code === 'P2003') return 'PRODUCT_CONSTRAINT_VIOLATION';
  if (error.code === '42P01' || error.code === '42703') return 'DATABASE_SCHEMA_ERROR';
  return null;
}

function mapDatabaseError(error) {
  if (error.code === '23505' || error.code === 'P2002') return 409;
  if (error.code === '23503' || error.code === 'P2003') return 409;
  return 500;
}

module.exports = { AppError, notFound, errorHandler };
