// Security configuration — the single source of truth for the two
// independent vulnerability states. The start.py operator console changes
// these through the local API; NovaCart's behavior follows this config.
//
// States: 'secure' (default) | 'vulnerable'
// Persisted in the local SQLite settings table so state survives restarts.
// Missing or invalid values ALWAYS fall back to 'secure' (fail-safe).
import { getDb } from './db.js';

export const STATES = { SECURE: 'secure', VULNERABLE: 'vulnerable' };
const KEYS = { sqli: 'sqli_state', xss: 'xss_state' };

function normalize(value) {
  return value === STATES.VULNERABLE ? STATES.VULNERABLE : STATES.SECURE;
}

function readState(module) {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(KEYS[module]);
  return normalize(row?.value); // missing/invalid → secure (fail-safe)
}

export function getSecurityConfig() {
  return { sqli: readState('sqli'), xss: readState('xss') };
}

export function setSecurityState(module, state) {
  if (!Object.keys(KEYS).includes(module)) {
    throw new Error(`Unknown security module "${module}".`);
  }
  if (state !== STATES.SECURE && state !== STATES.VULNERABLE) {
    throw new Error(`Invalid state "${state}" — only 'secure' or 'vulnerable' are allowed.`);
  }
  const db = getDb();
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(KEYS[module], state);
  return readState(module);
}
