// ============================================================
// WebShield Lab — Express server entry point.
//
// INTENTIONALLY VULNERABLE — EDUCATIONAL LOCAL LAB
//
// Safety properties:
//  • Binds to 127.0.0.1 ONLY — unreachable from other machines.
//  • Accepts no external targets (antiTargetGuard rejects them).
//  • Serves only fictional NovaCart data from a local SQLite file.
//  • Exposes no filesystem, shell, or network-scanning endpoints.
//  • Never returns or logs password hashes / secrets.
//
// NovaCart is ONE application. Its SQLi and XSS demonstration
// surfaces follow the security configuration controlled by the
// start.py operator console (see src/labState.js).
// ============================================================
import express from 'express';
import { pathToFileURL } from 'node:url';
import { securityHeaders, antiTargetGuard, notFoundJson } from './middleware/guards.js';
import securityRoutes from './routes/security.js';
import storeRoutes from './routes/store.js';
import { getDb, useMemoryDatabase } from './db.js';
import { getSecurityConfig } from './labState.js';
import { logEvent } from './logger.js';

const PORT = Number(process.env.PORT || 4000);

export const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '64kb' }));
app.use(securityHeaders);

// Safety guard on every API call: no request may name an external target.
app.use('/api', antiTargetGuard);

app.get('/api/health', (_req, res) => {
  getDb(); // ensure schema exists
  res.json({ ok: true, service: 'novacart', config: getSecurityConfig() });
});

app.use('/api/security', securityRoutes);
app.use('/api/store', storeRoutes);

// Unknown API routes → JSON 404 (no filesystem or tool endpoints exist).
app.use('/api', notFoundJson);

// Central error handler — no stack traces leak to clients.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[SERVER ERROR]', err && err.stack ? err.stack : err); // server-side only, never sent to clients
  logEvent('WARNING', 'Request error', { type: err?.type || err?.name || 'Error' });
  res.status(err?.type === 'entity.parse.failed' ? 400 : 500).json({
    error: 'request_failed',
    message: err?.type === 'entity.parse.failed' ? 'Malformed JSON body.' : 'Something went wrong handling that request.',
  });
});

export function startTestServer() {
  // Isolated in-memory database: the suite never writes to server/data/novacart.db.
  useMemoryDatabase();
  return app.listen(0, '127.0.0.1');
}

// Auto-start only when index.js is the entry module (not under node --test).
const isEntry = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntry) {
  getDb();
  app.listen(PORT, '127.0.0.1', () => {
    console.log('');
    console.log('  ┌─────────────────────────────────────────────────────┐');
    console.log('  │  NovaCart API — WebShield Lab                       │');
    console.log('  │  INTENTIONALLY VULNERABLE — EDUCATIONAL LOCAL LAB   │');
    console.log('  ├─────────────────────────────────────────────────────┤');
    console.log(`  │  API     : http://127.0.0.1:${String(PORT).padEnd(21)}│`);
    console.log('  │  Scope   : localhost only — no external targets     │');
    console.log('  │  Data    : fictional dataset (local SQLite)         │');
    console.log('  └─────────────────────────────────────────────────────┘');
    console.log('');
    logEvent('INFO', 'NovaCart server started', { port: PORT });
  });
}
