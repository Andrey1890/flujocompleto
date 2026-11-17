function sanitizeValue(value) {
  if (typeof value === 'string') {
    return value.replace(/\0/g, '').trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    const sanitized = Object.create(null);
    for (const [key, nestedValue] of Object.entries(value)) {
      if (key !== '__proto__' && key !== 'prototype' && key !== 'constructor') {
        sanitized[key] = sanitizeValue(nestedValue);
      }
    }
    return sanitized;
  }
  return value;
}

module.exports = function sanitize(req, res, next) {
  req.body = sanitizeValue(req.body);
  req.sanitizedQuery = sanitizeValue(req.query);
  req.params = sanitizeValue(req.params);
  next();
};
