const { AppError } = require('./error.middleware');
const config = require('../config/env.config');

module.exports = function pagination(req, res, next) {
  const pageValue = req.sanitizedQuery.page ?? '1';
  const page = Number(pageValue);

  if (!/^[1-9]\d*$/.test(String(pageValue)) || !Number.isSafeInteger(page)) {
    return next(new AppError(400, 'INVALID_PAGE', 'page must be a positive safe integer'));
  }

  const offset = (page - 1) * config.paginationLimit;
  if (!Number.isSafeInteger(offset)) {
    return next(new AppError(400, 'INVALID_PAGE', 'page is too large'));
  }

  req.pagination = { page, limit: config.paginationLimit, offset };
  return next();
};
