const express = require('express');
const helmet = require('helmet');
const config = require('./config/env.config');
const logger = require('./middlewares/logger.middleware');
const corsMiddleware = require('./middlewares/cors.middleware');
const productosRoutes = require('./routes/productos.routes');
const { notFound, errorHandler } = require('./middlewares/error.middleware');

const app = express();

app.disable('x-powered-by');
app.use(logger);
app.use(helmet());
app.use(corsMiddleware);
app.use(express.json({ limit: '100kb' }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use(`${config.apiPrefix}/productos`, productosRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
