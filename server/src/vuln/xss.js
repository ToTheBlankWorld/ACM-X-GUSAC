// ============================================================
// XSS MODULE — WebShield Lab (fictional product reviews only)
// Two rendering contracts for the same review data:
//   A) vulnerable: raw HTML handed to the browser sink (innerHTML /
//      dangerouslySetInnerHTML) → the browser interprets active content.
//   B) secure: output encoding / plain text → the browser renders it as data.
// Which contract is used is decided ONLY by the security configuration
// (server/src/labState.js, controlled by start.py).
//
// The only sanctioned demonstration payload changes text on the LOCAL
// page. Payloads that could contact external targets, read cookies or
// storage are rejected by the guard below — nothing leaves the machine.
// ============================================================
import { getSecurityConfig, STATES } from '../labState.js';

// Harmless, LOCAL-ONLY demonstration payload. When the browser executes it
// (via the unsafe HTML sink in vulnerable configuration), it shows a small
// banner on the LOCAL page: "XSS EXECUTED — LOCAL EDUCATIONAL DEMO".
// No network calls, no cookies, no storage, no exfiltration — it creates a
// single element and appends it to the local document.
export const DEMO_XSS_PAYLOAD =
  '<img src=x onerror="var b=document.createElement(\'div\');b.textContent=\'XSS EXECUTED — LOCAL EDUCATIONAL DEMO\';b.style.cssText=\'position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#b91c1c;color:#fff;padding:10px 16px;border-radius:10px;font:600 14px system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25)\';document.body.appendChild(b);">';

export const XSS_PROOF_TEXT = 'XSS EXECUTED — LOCAL EDUCATIONAL DEMO';

const EXTERNAL_PATTERNS = [
  { re: /fetch\s*\(/i, why: 'fetch() call' },
  { re: /XMLHttpRequest/i, why: 'XMLHttpRequest' },
  { re: /WebSocket/i, why: 'WebSocket' },
  { re: /sendBeacon/i, why: 'navigator.sendBeacon' },
  { re: /document\s*\.\s*cookie/i, why: 'cookie access' },
  { re: /localStorage|sessionStorage/i, why: 'web storage access' },
  { re: /https?:\/\//i, why: 'external URL reference' },
  { re: /\blocation\s*(=|\.href|\.assign|\.replace)/i, why: 'navigation/redirect' },
  { re: /import\s*\(|require\s*\(/i, why: 'dynamic module load' },
  { re: /\beval\s*\(/i, why: 'eval()' },
];

export function guardPayload(content = '') {
  const text = String(content);
  for (const { re, why } of EXTERNAL_PATTERNS) {
    if (re.test(text)) {
      return {
        allowed: false,
        reason: `Blocked by the application's input filter (${why}). Only the harmless local demonstration content is permitted — nothing may reference external targets, storage, or cookies.`,
      };
    }
  }
  return { allowed: true, reason: null };
}

// Server-side output encoding — the secure rendering primitive.
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

// A) Vulnerable rendering contract: raw review content passed through
// as HTML. The CLIENT puts this into an HTML sink (innerHTML /
// dangerouslySetInnerHTML), where the browser executes active content.
export function renderVulnerable(review) {
  return {
    ...review,
    html: review.content, // ⚠ intentionally unencoded (educational)
    rendering: 'raw-html',
  };
}

// B) Secure rendering contract: content is delivered as DATA.
// The client renders it as a plain text node (React escapes text
// children); escapeHtml is provided for server-side templates.
export function renderSecure(review) {
  return {
    ...review,
    html: null,
    text: escapeHtml(review.content),
    rendering: 'encoded-text',
  };
}

// Which contract applies is a configuration decision, not a UI decision.
export function renderReviews(reviews) {
  const { xss } = getSecurityConfig();
  const vulnerable = xss === STATES.VULNERABLE;
  return {
    rendering: vulnerable ? 'raw-html' : 'encoded-text',
    reviews: reviews.map((r) => (vulnerable ? renderVulnerable(r) : renderSecure(r))),
  };
}

export function isDemoPayload(content = '') {
  return String(content).trim() === DEMO_XSS_PAYLOAD;
}
