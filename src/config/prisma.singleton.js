const config = require('./env.config');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../../generated/prisma');

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: config.database.maxPool,
  idleTimeoutMillis: config.database.idleTimeout
});
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
