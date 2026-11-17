const { createHmac } = require('node:crypto');
const config = require('../config/env.config');

module.exports = function productHash(req, res, next) {
  const payload = JSON.stringify(req.body);
  const digest = createHmac('sha256', config.hashSecretSalt).update(payload).digest('hex');
  res.setHeader('X-Product-Integrity', digest);
  next();
};
