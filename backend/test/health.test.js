import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV ||= 'test';
process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/buypal_test';

const { app } = await import('../src/app.js');

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const address = server.address();
  baseUrl = \`http://127.0.0.1:\${address.port}\`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

test('GET /health returns service status without requiring a database connection', async () => {
  const response = await fetch(\`\${baseUrl}/health\`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok', service: 'buypal-api' });
});
