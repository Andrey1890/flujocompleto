const cors = require('cors');
const config = require('../config/env.config');

module.exports = cors({
  origin(origin, callback) {
    callback(null, !origin || config.corsOrigins.includes(origin));
  },
  methods: config.corsMethods,
  exposedHeaders: ['X-Product-Integrity'],
  optionsSuccessStatus: 204
});
