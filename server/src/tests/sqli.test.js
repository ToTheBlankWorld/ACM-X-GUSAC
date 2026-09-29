// SQL Injection module tests — the SAME NovaCart login endpoint must
// succeed with the controlled payload when the vulnerability is enabled
// and reject the SAME payload when secured.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { boot, SQLI_PAYLOAD } from './helpers.js';

let ctx;

before(async () => { ctx = await boot(); });
after(async () => { ctx.close(); });

async function setSqli(state) {
  const r = await ctx.api('/security/sqli', { method: 'POST', body: { state } });
  assert.equal(r.status, 200);
}

describe('SQL Injection — vulnerable configuration', () => {
  before(async () => { await setSqli('vulnerable'); });

  test('controlled payload bypasses the NovaCart login (by design)', async () => {
    const { status, data } = await ctx.api('/store/login', {
      method: 'POST',
      body: { username: SQLI_PAYLOAD, password: 'anything' },
    });
    assert.equal(status, 200);
    assert.equal(data.user.username, 'nova_admin', 'bypass signs in as the first fictional account');
    assert.equal(data.user.role, 'administrator');
    // The response must look like a normal login response — no SQL, no internals.
    assert.ok(!JSON.stringify(data).includes('SELECT'));
    assert.ok(!('behavior' in data));
  });

  test('legitimate fictional login still works', async () => {
    const { status, data } = await ctx.api('/store/login', {
      method: 'POST',
      body: { username: 'sarah_chen', password: 'Sunshine#88' },
    });
    assert.equal(status, 200);
    assert.equal(data.user.username, 'sarah_chen');
  });

  test('password hashes never leave the server', async () => {
    const { data } = await ctx.api('/store/login', {
      method: 'POST',
      body: { username: SQLI_PAYLOAD, password: 'x' },
    });
    assert.ok(!('password_hash' in (data.user || {})));
    assert.ok(!/[a-f0-9]{64}/i.test(JSON.stringify(data)), 'no hash value leaked');
  });
});

describe('SQL Injection — secure configuration', () => {
  before(async () => { await setSqli('secure'); });

  test('the exact same controlled payload now fails like bad credentials', async () => {
    const { status, data } = await ctx.api('/store/login', {
      method: 'POST',
      body: { username: SQLI_PAYLOAD, password: 'anything' },
    });
    assert.equal(status, 401);
    assert.equal(data.error, 'invalid_credentials');
    assert.equal(data.user, undefined);
  });

  test('legitimate login still works and uses bound parameters', async () => {
    const { status, data } = await ctx.api('/store/login', {
      method: 'POST',
      body: { username: 'sarah_chen', password: 'Sunshine#88' },
    });
    assert.equal(status, 200);
    assert.equal(data.user.username, 'sarah_chen');
  });

  test('drop-table style payload is inert and leaves the catalog intact', async () => {
    await ctx.api('/store/login', {
      method: 'POST',
      body: { username: "admin'; DROP TABLE users; --", password: 'x' },
    });
    const catalog = await ctx.api('/store/products');
    assert.equal(catalog.status, 200);
    assert.equal(catalog.data.products.length, 10, 'catalog untouched');
  });
});
