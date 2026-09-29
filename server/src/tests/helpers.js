// Test helpers — boots the Express app on an ephemeral loopback port
// with an isolated in-memory SQLite database (never the on-disk lab DB).
import { startTestServer } from '../index.js';
import { DEMO_XSS_PAYLOAD } from '../vuln/xss.js';

export { DEMO_XSS_PAYLOAD };
export const SQLI_PAYLOAD = "' OR '1'='1' --";

export async function boot() {
  const server = startTestServer();
  await new Promise((resolve) => server.once('listening', resolve));
  const { port, address } = server.address();
  const base = `http://${address}:${port}`;

  async function api(path, { method = 'GET', body } = {}) {
    const res = await fetch(`${base}/api${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let data = {};
    try { data = await res.json(); } catch { /* non-JSON */ }
    return { status: res.status, data };
  }

  return {
    server,
    base,
    api,
    // undici keep-alive sockets would keep server.close() waiting forever.
    close: () => new Promise((r) => { server.closeAllConnections(); server.close(r); }),
  };
}
