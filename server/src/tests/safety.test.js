// Safety and hardening tests — no external targets, no filesystem access,
// no secrets exposed, always-secure storefront surfaces.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './helpers.js';

let ctx;
let address;

before(async () => {
  ctx = await boot();
  address = ctx.server.address();
});
after(async () => { ctx.close(); });

describe('server binding', () => {
  test('listens on loopback only (127.0.0.1)', () => {
    assert.equal(address.address, '127.0.0.1');
  });
});

describe('no external targets accepted', () => {
  test('request bodies naming a target are rejected', async () => {
    for (const body of [
      { target: '10.0.0.5' },
      { host: 'victim.example' },
      { connectionString: 'mysql://user:pass@remote-db.example/app' },
      { dsn: 'postgres://remote.example/app' },
      { endpoint: 'https://third-party.example/api' },
      { nested: { url: 'http://external.example' } },
    ]) {
      const { status, data } = await ctx.api('/store/login', { method: 'POST', body });
      assert.equal(status, 400, JSON.stringify(body));
      assert.equal(data.error, 'external_target_rejected');
    }
  });

  test('the security console API rejects invalid input', async () => {
    const { status } = await ctx.api('/security/sqli', { method: 'POST', body: { state: 'nuke' } });
    assert.equal(status, 400);
  });
});

describe('no real system files accessible', () => {
  test('no file endpoints exist', async () => {
    const direct = await fetch(`${ctx.base}/api/file?path=C:\\Windows\\win.ini`);
    assert.equal(direct.status, 404);
    const traversal = await ctx.api('/store/products/..%2f..%2f..%2fWindows%2fwin.ini');
    assert.notEqual(traversal.status, 200);
    const shell = await ctx.api('/exec', { method: 'POST', body: { cmd: 'dir' } });
    assert.equal(shell.status, 404);
  });

  test('unknown API routes return JSON 404 without tool execution', async () => {
    const { status, data } = await ctx.api('/does/not/exist');
    assert.equal(status, 404);
    assert.equal(data.error, 'not_found');
  });
});

describe('no secrets exposed', () => {
  test('health and status responses leak no credentials', async () => {
    const health = await ctx.api('/health');
    assert.equal(health.status, 200);
    assert.ok(!/[a-f0-9]{64}/i.test(JSON.stringify(health.data)));
    const status = await ctx.api('/security/status');
    assert.ok(!/[a-f0-9]{64}/i.test(JSON.stringify(status.data)));
  });
});

describe('storefront surfaces that must stay secure', () => {
  test('catalog search is parameterized in both configurations', async () => {
    await ctx.api('/security/sqli', { method: 'POST', body: { state: 'vulnerable' } });
    const injected = await ctx.api('/store/products?q=x%25%27%20OR%201%3D1%20--');
    assert.equal(injected.status, 200);
    assert.equal(injected.data.products.length, 0, 'payload is treated as search text');
    const normal = await ctx.api('/store/products?q=keyboard');
    assert.equal(normal.data.products.length, 1);
    await ctx.api('/security/sqli', { method: 'POST', body: { state: 'secure' } });
  });
});
