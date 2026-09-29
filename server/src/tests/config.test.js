// Security configuration tests — independent modules, secure defaults,
// fail-safe behavior, and operator-console input validation.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { boot } from './helpers.js';

let ctx;

before(async () => { ctx = await boot(); });
after(async () => { ctx.close(); });

describe('security configuration', () => {
  test('defaults to SECURE for both modules on a fresh database', async () => {
    const { status, data } = await ctx.api('/security/status');
    assert.equal(status, 200);
    assert.equal(data.sqli, 'secure');
    assert.equal(data.xss, 'secure');
    assert.deepEqual(data.defaults, { sqli: 'secure', xss: 'secure' });
  });

  test('modules are independent — SQLi vulnerable while XSS stays secure', async () => {
    await ctx.api('/security/sqli', { method: 'POST', body: { state: 'vulnerable' } });
    const { data } = await ctx.api('/security/status');
    assert.equal(data.sqli, 'vulnerable');
    assert.equal(data.xss, 'secure');

    await ctx.api('/security/xss', { method: 'POST', body: { state: 'vulnerable' } });
    const both = await ctx.api('/security/status');
    assert.equal(both.data.sqli, 'vulnerable');
    assert.equal(both.data.xss, 'vulnerable');

    await ctx.api('/security/xss', { method: 'POST', body: { state: 'secure' } });
    const mixed = await ctx.api('/security/status');
    assert.equal(mixed.data.sqli, 'vulnerable');
    assert.equal(mixed.data.xss, 'secure');

    await ctx.api('/security/sqli', { method: 'POST', body: { state: 'secure' } });
  });

  test('invalid states are rejected and never applied', async () => {
    for (const state of ['attacker', 'on', true, null]) {
      const r = await ctx.api('/security/sqli', { method: 'POST', body: { state } });
      assert.equal(r.status, 400);
      const x = await ctx.api('/security/xss', { method: 'POST', body: { state } });
      assert.equal(x.status, 400);
    }
    const { data } = await ctx.api('/security/status');
    assert.equal(data.sqli, 'secure');
    assert.equal(data.xss, 'secure');
  });

  test('status exposes the controlled demonstration inputs for the operator', async () => {
    const { data } = await ctx.api('/security/status');
    assert.ok(data.demoInputs.sqli.payload.includes("' OR '1'='1'"));
    assert.ok(data.demoInputs.xss.payload.includes('XSS EXECUTED'));
  });

  test('security state persists across reads', async () => {
    await ctx.api('/security/xss', { method: 'POST', body: { state: 'vulnerable' } });
    let s = await ctx.api('/security/status');
    assert.equal(s.data.xss, 'vulnerable');
    s = await ctx.api('/security/status');
    assert.equal(s.data.xss, 'vulnerable');
    await ctx.api('/security/xss', { method: 'POST', body: { state: 'secure' } });
  });
});

describe('security event log', () => {
  test('records configuration changes and demonstration events without secrets', async () => {
    await ctx.api('/security/sqli', { method: 'POST', body: { state: 'vulnerable' } });
    await ctx.api('/store/login', { method: 'POST', body: { username: "' OR '1'='1' --", password: 'SECRET-VALUE-123' } });
    await ctx.api('/security/sqli', { method: 'POST', body: { state: 'secure' } });

    const { data } = await ctx.api('/security/logs?limit=100');
    const text = JSON.stringify(data.logs);
    assert.ok(text.includes('SQL Injection vulnerability ENABLED'), 'config change is logged');
    assert.ok(!text.includes('SECRET-VALUE-123'), 'credentials never logged');
    for (const e of data.logs) {
      assert.ok(['INFO', 'WARNING'].includes(e.level));
    }
  });

  test('log can be cleared for a clean presentation', async () => {
    const cleared = await ctx.api('/security/logs/clear', { method: 'POST' });
    assert.equal(cleared.status, 200);
    const { data } = await ctx.api('/security/logs');
    assert.ok(!JSON.stringify(data.logs).includes('ENABLED'));
  });
});
