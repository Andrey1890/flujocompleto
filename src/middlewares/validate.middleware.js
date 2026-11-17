const { AppError } = require('./error.middleware');

const fields = new Set(['idProducto', 'proNombre', 'proCategoria', 'proPvp']);
const patchFields = new Set(['proNombre', 'proCategoria', 'proPvp']);

function validateId(req, res, next) {
  const id = req.params.id;
  if (typeof id !== 'string' || id.length < 1 || id.length > 11) {
    return next(new AppError(400, 'INVALID_PRODUCT_ID', 'id must contain between 1 and 11 characters'));
  }
  return next();
}

function validateProductBody({ partial = false } = {}) {
  return (req, res, next) => {
    const product = req.body;
    if (!product || typeof product !== 'object' || Array.isArray(product)) {
      return next(new AppError(400, 'INVALID_BODY', 'Request body must be a JSON object'));
    }

    const allowed = partial ? patchFields : fields;
    const unknownFields = Object.keys(product).filter((key) => !allowed.has(key));
    if (unknownFields.length) {
      return next(new AppError(400, 'UNKNOWN_FIELDS', `Unsupported fields: ${unknownFields.join(', ')}`));
    }

    if (partial && Object.keys(product).length === 0) {
      return next(new AppError(400, 'EMPTY_PATCH', 'At least one product field is required'));
    }

    if (!partial) {
      const missingFields = [...fields].filter((key) => !Object.hasOwn(product, key));
      if (missingFields.length) {
        return next(new AppError(400, 'MISSING_FIELDS', `Required fields: ${missingFields.join(', ')}`));
      }
    }

    const candidateFields = partial ? patchFields : fields;
    for (const key of candidateFields) {
      if (!Object.hasOwn(product, key)) continue;
      const value = product[key];
      if (key === 'idProducto') {
        if (typeof value !== 'string' || value.length < 1 || value.length > 11) {
          return next(new AppError(400, 'INVALID_PRODUCT_ID', 'idProducto must contain 1 to 11 characters'));
        }
      } else if (key === 'proNombre') {
        if (typeof value !== 'string' || value.length < 1 || value.length > 35) {
          return next(new AppError(400, 'INVALID_PRODUCT_NAME', 'proNombre must contain 1 to 35 characters'));
        }
      } else if (key === 'proCategoria') {
        if (typeof value !== 'string' || value.length < 1 || value.length > 12) {
          return next(new AppError(400, 'INVALID_PRODUCT_CATEGORY', 'proCategoria must contain 1 to 12 characters'));
        }
      } else if (key === 'proPvp') {
        if (
          typeof value !== 'number' ||
          !Number.isFinite(value) ||
          value <= 0 ||
          value > 99999.99 ||
          Math.abs(value - Number(value.toFixed(2))) > 1e-9
        ) {
          return next(new AppError(400, 'INVALID_PRODUCT_PRICE', 'proPvp must be positive with at most two decimals'));
        }
      }
    }

    return next();
  };
}

module.exports = { validateId, validateProductBody };
