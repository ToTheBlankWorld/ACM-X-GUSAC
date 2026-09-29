// Unit tests for the pure security primitives.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, guardPayload, DEMO_XSS_PAYLOAD, renderSecure, renderVulnerable, isDemoPayload } from '../vuln/xss.js';
import { looksLikeInjection } from '../vuln/sqli.js';

describe('escapeHtml (contextual output encoding)', () => {
  test('escapes all HTML-significant characters', () => {
    assert.equal(escapeHtml('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
    assert.equal(escapeHtml('a & b'), 'a &amp; b');
    assert.equal(escapeHtml('"quoted"'), '&quot;quoted&quot;');
    assert.equal(escapeHtml("it's"), 'it&#39;s');
  });

  test('escaping the demo payload yields inert data', () => {
    const encoded = escapeHtml(DEMO_XSS_PAYLOAD);
    assert.ok(!encoded.includes('<'), 'no raw angle brackets remain');
  });

  test('renderSecure always returns encoded text and null html', () => {
    const out = renderSecure({ id: 1, author: 'a', content: DEMO_XSS_PAYLOAD, rating: 5, created_at: 'now' });
    assert.equal(out.html, null);
    assert.ok(out.text.includes('&lt;img'));
  });

  test('renderVulnerable passes raw content through (educational design)', () => {
    const out = renderVulnerable({ id: 1, author: 'a', content: '<b>hi</b>', rating: 5, created_at: 'now' });
    assert.equal(out.html, '<b>hi</b>');
  });

  test('isDemoPayload matches only the sanctioned demonstration input', () => {
    assert.equal(isDemoPayload(DEMO_XSS_PAYLOAD), true);
    assert.equal(isDemoPayload('great product'), false);
  });
});

describe('safety guard', () => {
  test('sanctioned local payload is allowed', () => {
    assert.equal(guardPayload(DEMO_XSS_PAYLOAD).allowed, true);
  });
  test('anything reaching an external URL is blocked', () => {
    for (const p of ['<a href="https://x.example">x</a>', '<img src=http://x.example/1.png>', 'fetch("http://x")']) {
      assert.equal(guardPayload(p).allowed, false, p);
    }
  });
});

describe('injection heuristic', () => {
  test('flags classic payloads', () => {
    for (const p of ["' OR '1'='1' --", "x%' OR 1=1 --", "'; DROP TABLE users; --", "' UNION SELECT 1,2,3 --"]) {
      assert.equal(looksLikeInjection(p), true, p);
    }
  });
  test('ignores ordinary text', () => {
    for (const p of ['keyboard', 'sarah_chen', 'mechanical keyboard pro']) {
      assert.equal(looksLikeInjection(p), false, p);
    }
  });
});
