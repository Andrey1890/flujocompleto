const app = require('./app');
const prisma = require('./config/prisma.singleton');
const config = require('./config/env.config');

async function start() {
  await prisma.$connect();
  const server = app.listen(config.port, () => {
    console.log(`Server listening on http://localhost:${config.port}`);
  });

  server.on('error', async (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${config.port} is already in use`);
      process.exitCode = 1;
      await prisma.$disconnect();
      return;
    }
    console.error('HTTP server failed:', error);
    process.exitCode = 1;
    await prisma.$disconnect();
  });

  const shutdown = () => {
    server.close(async (error) => {
      if (error) {
        console.error('HTTP server shutdown failed:', error);
        process.exitCode = 1;
      }
      await prisma.$disconnect();
    });
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

start().catch(async (error) => {
  console.error('Could not start Server2:', error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
