import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './db/connection.js';

let server;

async function start() {
  await connectDatabase();
  server = app.listen(env.port, () => {
    console.log('BuyPal API listening on port ' + env.port);
  });
}

async function shutdown(signal) {
  console.log(signal + ' received; shutting down BuyPal API.');
  if (server) await new Promise(resolve => server.close(resolve));
  await disconnectDatabase();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start().catch(error => {
  console.error('Could not start BuyPal API:', error.message);
  process.exit(1);
});
