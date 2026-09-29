// ============================================================
// SQL INJECTION MODULE — WebShield Lab (fictional SQLite only)
// Two implementations of the same NovaCart login feature:
//   A) vulnerable: user input is concatenated straight into SQL
//   B) secure: parameterized query (data can never become code)
// Which one runs is decided ONLY by the security configuration
// (server/src/labState.js, controlled by start.py). This module
// ONLY ever queries this application's own local fictional SQLite
// database. It accepts no hosts, no DSNs, no external targets.
// ============================================================
import { getDb, hashPassword } from '../db.js';
import { getSecurityConfig, STATES } from '../labState.js';
import { logEvent } from '../logger.js';

const PUBLIC_USER_COLUMNS = 'id, username, email, full_name, role';

// Heuristic used only to label the demo attempt in the log.
export function looksLikeInjection(input = '') {
  return /('|--|;|\bor\b\s+\b1\s*=\s*1\b|\bunion\b\s+\bselect\b|\bdrop\b\s+\btable\b)/i.test(String(input));
}

// Never let a password hash leave the server in a display/log string.
const maskHashes = (text) => String(text).replace(/[a-f0-9]{64}/gi, '<sha256-masked>');

// ------------------------------------------------------------
// A) VULNERABLE LOGIN — string-built SQL (the classic mistake)
// user input → unsafe SQL construction → database → unexpected result
// The payload ' OR '1'='1' -- closes the username string, adds a
// condition that is always true, and comments out the password check.
// ------------------------------------------------------------
export function vulnerableLogin({ username = '', password = '' }) {
  const db = getDb();
  // ⚠ INTENTIONALLY VULNERABLE (educational): direct interpolation.
  const sql = `SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE username = '${username}' AND password_hash = '${hashPassword(password)}'`;

  try {
    const rows = db.prepare(sql).all();
    const bypassed = rows.length > 0 && looksLikeInjection(username);
    if (bypassed) {
      logEvent('WARNING', 'SQL injection demonstration triggered', { module: 'sqli', behavior: 'auth_bypass' });
    }
    return {
      ok: rows.length > 0,
      behavior: bypassed ? 'auth_bypass' : 'normal_login',
      state: STATES.VULNERABLE,
      rowsMatched: rows.length,
      user: rows[0] || null, // first matching row — this is how the bypass "logs in" as admin
    };
  } catch (err) {
    // Raw database errors are logged server-side, never returned to the client.
    logEvent('WARNING', 'SQL error in vulnerable login path', { module: 'sqli', type: err.name });
    return {
      ok: false,
      behavior: 'error',
      state: STATES.VULNERABLE,
      rowsMatched: 0,
      user: null,
    };
  }
}

// ------------------------------------------------------------
// B) SECURE LOGIN — parameterized query (data ≠ code)
// user input → parameterized query → database → safe result
// ------------------------------------------------------------
export function secureLogin({ username = '', password = '' }) {
  const db = getDb();
  const sql = `SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE username = ? AND password_hash = ?`;
  const params = [String(username), hashPassword(password)];

  const rows = db.prepare(sql).all(...params);
  const rejected = rows.length === 0 && looksLikeInjection(username);
  if (rejected) {
    logEvent('WARNING', 'SQL injection attempt rejected by parameterized query', { module: 'sqli', behavior: 'rejected' });
  }
  return {
    ok: rows.length > 0,
    behavior: rows.length > 0 ? 'normal_login' : 'rejected',
    state: STATES.SECURE,
    rowsMatched: rows.length,
    user: rows[0] || null,
  };
}

// Dispatcher used by the NovaCart login route — the SAME endpoint serves
// the SAME login form in both configurations. Only backend behavior changes.
export function loginDispatcher(body) {
  const { sqli } = getSecurityConfig();
  const clean = {
    username: String(body?.username ?? '').slice(0, 200),
    password: String(body?.password ?? '').slice(0, 200),
  };
  const result = sqli === STATES.VULNERABLE ? vulnerableLogin(clean) : secureLogin(clean);

  if (!looksLikeInjection(clean.username)) {
    logEvent('INFO', 'NovaCart login request', { module: 'sqli', state: sqli, success: result.ok });
  }
  // The client only ever learns: signed in, or invalid credentials.
  return { ok: result.ok, user: result.user };
}
