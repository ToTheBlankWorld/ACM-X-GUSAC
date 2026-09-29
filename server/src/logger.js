// WebShield Lab — local security event logger.
// Logs are stored in the local SQLite file. Secrets are never logged:
// any detail object containing sensitive keys is scrubbed before writing.
import { getDb } from './db.js';

const SENSITIVE_KEY = /password|passphrase|token|secret|cookie|authorization|session|hash/i;
const MAX_DETAIL = 300;
const MAX_DEPTH = 4;

// Recursive scrub so a sensitive key hidden inside a nested object is still
// redacted — a flat top-level-only check would leak { meta: { token } }.
function scrubValue(value, depth) {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'object') return String(value).slice(0, 120);
  if (depth <= 0) return '{…}';
  const parts = [];
  for (const [key, nested] of Object.entries(value)) {
    parts.push(`${key}=${SENSITIVE_KEY.test(key) ? '[redacted]' : scrubValue(nested, depth - 1)}`);
  }
  return `{${parts.join(', ')}}`.slice(0, 120);
}

function scrubDetail(detail) {
  if (detail == null) return '';
  if (typeof detail !== 'object') return String(detail).slice(0, MAX_DETAIL);
  const parts = [];
  for (const [key, value] of Object.entries(detail)) {
    parts.push(`${key}=${SENSITIVE_KEY.test(key) ? '[redacted]' : scrubValue(value, MAX_DEPTH)}`);
  }
  return parts.join(' | ').slice(0, MAX_DETAIL);
}

export function logEvent(level, event, detail = '') {
  const db = getDb();
  const clean = scrubDetail(detail);
  db.prepare('INSERT INTO security_logs (level, event, detail) VALUES (?, ?, ?)').run(level, event, clean);
  // Console echo for the presenter, no secrets included.
  console.log(`[SECURITY][${level}] ${event}${clean ? ' — ' + clean : ''}`);
}

export function getLogs(limit = 100) {
  const db = getDb();
  const rows = db
    .prepare('SELECT id, level, event, detail, created_at FROM security_logs ORDER BY id DESC LIMIT ?')
    .all(Math.min(Math.max(1, Number(limit) || 100), 500));
  return rows;
}

export function clearLogs() {
  const db = getDb();
  db.prepare("DELETE FROM security_logs WHERE event != 'Lab initialized'").run();
  logEvent('INFO', 'Security event log cleared', 'Presenter reset the local log view.');
}
