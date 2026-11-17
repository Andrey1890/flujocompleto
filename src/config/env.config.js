const dotenv = require('dotenv');
const path = require('node:path');

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function integer(name, fallback, minimum = 1) {
  const value = Number(required(name, fallback));
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new Error(`${name} must be an integer greater than or equal to ${minimum}`);
  }
  return value;
}

const corsOrigins = required(
  'CORS_ORIGIN',
  'http://localhost:3000,http://127.0.0.1:5500'
).split(',').map((origin) => {
  const value = origin.trim();
  if (!value) return null;
  const parsed = new URL(value.includes('://') ? value : `https://${value}`);
  return parsed.origin;
}).filter(Boolean);
const corsMethods = required('CORS_METHODS', 'GET,POST,PUT,PATCH,DELETE')
  .split(',')
  .map((method) => method.trim().toUpperCase())
  .filter(Boolean);
const apiPrefix = required('API_PREFIX', '/api/v1');
const databaseUrl = process.env.DATABASE_URL
  ? new URL(process.env.DATABASE_URL)
  : new URL('postgresql://localhost');

if (!['postgres:', 'postgresql:'].includes(databaseUrl.protocol)) {
  throw new Error('DATABASE_URL must use the PostgreSQL protocol');
}
if (!process.env.DATABASE_URL) {
  databaseUrl.hostname = required('DB_HOST', 'localhost');
  databaseUrl.port = String(integer('DB_PORT', '5432'));
  databaseUrl.username = required('DB_USER', 'postgres');
  databaseUrl.password = required('DB_PASSWORD');
  databaseUrl.pathname = `/${encodeURIComponent(required('DB_NAME', 'BDDProductos'))}`;
}
if (!databaseUrl.searchParams.has('schema')) {
  databaseUrl.searchParams.set('schema', 'public');
}
process.env.DATABASE_URL = databaseUrl.toString();

const database = Object.freeze({
  host: decodeURIComponent(databaseUrl.hostname),
  port: integer('DB_PORT', databaseUrl.port || '5432'),
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
  name: decodeURIComponent(databaseUrl.pathname.slice(1)),
  maxPool: integer('DB_MAX_POOL', '10'),
  idleTimeout: integer('DB_IDLE_TIMEOUT', '30000')
});

if (!apiPrefix.startsWith('/') || apiPrefix.endsWith('/')) {
  throw new Error('API_PREFIX must start with "/" and must not end with "/"');
}
if (integer('PAGINATION_LIMIT', '1000') !== 1000) {
  throw new Error('PAGINATION_LIMIT is fixed at 1000');
}

module.exports = Object.freeze({
  nodeEnv: required('NODE_ENV', 'development'),
  port: integer('PORT', '5051'),
  database,
  corsOrigins: Object.freeze(corsOrigins),
  corsMethods: Object.freeze(corsMethods),
  paginationLimit: 1000,
  hashSecretSalt: required('HASH_SECRET_SALT'),
  apiPrefix
});
