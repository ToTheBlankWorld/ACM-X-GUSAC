# SECURE_CHANGES.md — What the "Secure" options actually change

> **Read this when you press option `3` (Secure Against SQL Injection) or option `5` (Secure Against XSS)
> in `start.py` and want to know *exactly* which files and code are involved.**

---

## 0. The big idea (read this first)

**No file on your disk is edited when you press a button.** Nothing is rewritten, nothing is recompiled.

Both versions of the code — the **vulnerable** one and the **secure** one — **already exist side by side**
in the same files. Choosing an option only flips a **switch** (a value in the SQLite `settings` table),
and the app reads that switch on every single request to decide which of the two code paths to run.

```
  You press a menu key in start.py
              │
              ▼
  start.py sends  POST /api/security/sqli  (or /xss)   {"state": "secure"}
              │            ← only reaches 127.0.0.1:4000, nowhere else
              ▼
  server/src/routes/security.js   validates + saves the value
              │
              ▼
  server/src/labState.js          writes it in SQLite  (settings table)
              │
              ▼
  server/src/vuln/sqli.js  or  server/src/vuln/xss.js
        reads the switch and calls EITHER the vulnerable function
        OR the secure function for that request
              │
              ▼
  Refresh the browser page → you see the new behavior immediately
```

**Files that are always involved in every switch:**

| # | File | Role |
|---|---|---|
| 1 | `start.py` | The CLI menu you type into. Options 1–7. |
| 2 | `server/src/routes/security.js` | The API endpoint the CLI talks to. Validates the value, logs the event. |
| 3 | `server/src/labState.js` | **The switch itself.** Saves/reads `sqli_state` and `xss_state` in SQLite. Fail-safe: missing/invalid = `secure`. |
| 4 | `server/src/vuln/sqli.js` or `server/src/vuln/xss.js` | Contains **both** implementations and picks one per request. |

---

## 1. Option `3` — Secure Against SQL Injection

### What you do
```
  Select an option: 3
```

### What happens, step by step
1. `start.py` → `set_module_state("sqli", "secure")` (start.py:251)
2. `POST http://127.0.0.1:4000/api/security/sqli` with body `{"state": "secure"}`
3. `routes/security.js` checks the value is exactly `secure` or `vulnerable`, then calls `setSecurityState('sqli', 'secure')` (security.js:35-50)
4. `labState.js` runs: `INSERT OR REPLACE INTO settings (key, value) VALUES ('sqli_state', 'secure')` (labState.js:35)
5. The login route (`POST /api/store/login`) now calls `secureLogin()` on every sign-in
6. CLI prints: `SQL Injection SECURE — vulnerability secured.` + *"The change is live immediately — just refresh the browser page."*

### The two code paths (both live in `server/src/vuln/sqli.js`)

**❌ VULNERABLE path — `vulnerableLogin()` (sqli.js:31-60) — runs when state = `vulnerable`**
```js
// user input is pasted straight into the SQL string
const sql = `SELECT ${PUBLIC_USER_COLUMNS} FROM users
             WHERE username = '${username}'
               AND password_hash = '${hashPassword(password)}'`;
const rows = db.prepare(sql).all();
```
Why it breaks: typing `' OR '1'='1' --` into the username box produces
```sql
... WHERE username = '' OR '1'='1' --' AND password_hash = '...'
```
`'1'='1'` is always true and `--` comments out the password check → **any password logs you in**
(the first row in the table, which is the administrator).

**✅ SECURE path — `secureLogin()` (sqli.js:66-83) — runs when state = `secure`**
```js
// placeholders only — the input is DATA, never part of the SQL command
const sql = `SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE username = ? AND password_hash = ?`;
const params = [String(username), hashPassword(password)];

const rows = db.prepare(sql).all(...params);
```
Why it holds: the database is told *"this text is a value to compare, not SQL to execute."*
The payload `' OR '1'='1' --` is now just a weird-looking username that matches nobody →
HTTP 401 `invalid_credentials` → **"That username and password don't match our records."**

### The picker that chooses between them (`sqli.js:87-100`)
```js
export function loginDispatcher(body) {
  const { sqli } = getSecurityConfig();                 // ← reads the switch
  const result = sqli === STATES.VULNERABLE
    ? vulnerableLogin(clean)   // option 2 was pressed
    : secureLogin(clean);      // option 3 was pressed (or nothing — default)
  ...
}
```

### The route that calls it (`routes/store.js:121-129`)
```js
router.post('/login', (req, res) => {
  const result = loginDispatcher(req.body);
  if (!result.ok) {
    return res.status(401).json({ error: 'invalid_credentials', message: "That username and password don't match our records." });
  }
  res.json({ user: publicUser(result.user) });
});
```
Note: the success/failure response looks **identical** in both modes. The difference is only
*whether the payload succeeds* — and password hashes never leave the server.

---

## 2. Option `5` — Secure Against XSS  ← the one you asked about

### What you do
```
  Select an option: 5
```

### What happens, step by step
1. `start.py` → `set_module_state("xss", "secure")` (start.py:251)
2. `POST http://127.0.0.1:4000/api/security/xss` with body `{"state": "secure"}`
3. `routes/security.js` validates + saves (security.js:52-67)
4. `labState.js` writes `xss_state = 'secure'` in the SQLite `settings` table
5. Every review read/write now goes through `renderSecure()` instead of `renderVulnerable()`
6. CLI prints: `Cross-Site Scripting SECURE — vulnerability secured.`

### The files this touches

| File | What the secure mode uses |
|---|---|
| `server/src/vuln/xss.js` | `renderSecure()` + `escapeHtml()` (the actual fix) |
| `server/src/routes/store.js` | `renderReviews(rows)` on GET/POST reviews (store.js:75, 116) |
| `server/src/routes/security.js` | Receives the CLI's `{"state":"secure"}` |
| `server/src/labState.js` | Persists `xss_state` |
| `client/src/components/ReviewCard.jsx` | Renders `review.text` as plain text instead of `review.html` as HTML |
| `start.py` | Option `5` in the menu |

### The two rendering contracts (both live in `server/src/vuln/xss.js`)

**❌ VULNERABLE contract — `renderVulnerable()` (xss.js:66-72) — runs when state = `vulnerable`**
```js
export function renderVulnerable(review) {
  return {
    ...review,
    html: review.content,   // ⚠ raw review text handed over as HTML
    rendering: 'raw-html',
  };
}
```
The browser then executes it, because the client uses an **HTML sink** (`ReviewCard.jsx:26-28`):
```jsx
{review.html != null ? (
  <div className="..." dangerouslySetInnerHTML={{ __html: review.html }} />
) : ( ... )}
```
So a review containing `<img src=x onerror="...">` **runs that JavaScript** on your page.

**✅ SECURE contract — `renderSecure()` (xss.js:77-84) — runs when state = `secure`**
```js
export function renderSecure(review) {
  return {
    ...review,
    html: null,                    // ← no HTML is sent at all, so the sink above never fires
    text: escapeHtml(review.content),  // ← content becomes safe text
    rendering: 'encoded-text',
  };
}
```

**The actual encoding function — `escapeHtml()` (xss.js:53-61):**
```js
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}
```
Turning `<img src=x onerror=...>` into `&lt;img src=x onerror=...&gt;` means the browser
**displays the characters** instead of treating them as a tag. Nothing executes.

**The client side of the fix (`ReviewCard.jsx:29-33`):**
```jsx
) : (
  /* Plain text node — the browser renders this as data. */
  <p className="mt-3 text-sm text-stone-600 leading-relaxed whitespace-pre-wrap break-words">
    {review.text ?? review.content}
  </p>
)}
```
React escapes text children automatically, so this branch is safe even without `escapeHtml`.

### The picker (`xss.js:87-94`)
```js
export function renderReviews(reviews) {
  const { xss } = getSecurityConfig();                 // ← reads the switch
  const vulnerable = xss === STATES.VULNERABLE;
  return {
    rendering: vulnerable ? 'raw-html' : 'encoded-text',
    reviews: reviews.map((r) => (vulnerable ? renderVulnerable(r) : renderSecure(r))),
  };
}
```

### What you see in the browser after option `5`
* The same review that showed the red **"XSS EXECUTED — LOCAL EDUCATIONAL DEMO"** banner
  now displays as literal text `<img src=x onerror=...>` — inert characters, nothing runs.
* Same page, same input box, same review. Only the delivery format changed.

---

## 3. The full option → file → change map

| CLI option | Line in `start.py` | API call | Saved key | Code that runs when **VULNERABLE** | Code that runs when **SECURE** |
|---|---|---|---|---|---|
| `2` Enable SQL Injection | `choose("2")` → `set_module_state("sqli","vulnerable")` | `POST /api/security/sqli` | `sqli_state` | `vulnerableLogin()` — string-built SQL | — |
| `3` Secure SQL Injection | `choose("3")` → `set_module_state("sqli","secure")` | `POST /api/security/sqli` | `sqli_state` | — | `secureLogin()` — parameterized `?` query |
| `4` Enable XSS | `choose("4")` → `set_module_state("xss","vulnerable")` | `POST /api/security/xss` | `xss_state` | `renderVulnerable()` → client `dangerouslySetInnerHTML` | — |
| `5` Secure XSS | `choose("5")` → `set_module_state("xss","secure")` | `POST /api/security/xss` | `xss_state` | — | `renderSecure()` + `escapeHtml()` → client plain-text node |
| `6` Show status | `show_status()` | `GET /api/security/status` + `/logs` | — | reads only | reads only |
| `1` / `7` | start/stop the two local processes | `GET /api/health` | — | — | — |

Options are **independent**: you can run SQLi vulnerable + XSS secure at the same time
(one module shown, the other still protected).

---

## 4. Defaults and fail-safe

* **Default = `SECURE`** for both modules. A brand-new install (or a deleted `server/data/`
  folder) comes up secure — the vulnerable state exists **only after you press 2 or 4**.
* `labState.js:13-15` — anything that isn't exactly `'vulnerable'` normalizes to `'secure'`:
  ```js
  function normalize(value) {
    return value === STATES.VULNERABLE ? STATES.VULNERABLE : STATES.SECURE;
  }
  ```
* The state survives restarts (it's in SQLite), but a fresh database resets it to secure.

---

## 5. How to verify the secure mode yourself

**A. Through the CLI**
```
  Select an option: 6      → shows  SQL Injection: SECURE / Cross-Site Scripting: SECURE
```

**B. With curl (app must be running, option 1)**
```bash
# flip XSS to secure
curl -X POST http://127.0.0.1:4000/api/security/xss -H "Content-Type: application/json" -d "{\"state\":\"secure\"}"

# read the switch back
curl http://127.0.0.1:4000/api/security/status

# check what a review now looks like (note: html = null, text = encoded)
curl http://127.0.0.1:4000/api/store/products/1/reviews
```

**C. With the automated tests (35 of them)**
```bash
npm test
```
The suite asserts the secure behaviors: parameterized queries, HTML encoding, payload guard,
loopback-only binding, JSON 404s, and that secrets are never logged.

---

## 6. Safety rails that are NOT switched off

These are **always on**, in every configuration — they are not part of the two switches:

| Guard | File | What it does |
|---|---|---|
| Loopback binding | `server/src/index.js:68` | `app.listen(PORT, '127.0.0.1')` — unreachable from other machines |
| Anti-target guard | `middleware/guards.js` | Rejects any body naming `target`, `host`, `ip`, `dsn`, `url`, … (HTTP 400) |
| XSS payload guard | `vuln/xss.js:39-50` | Blocks `fetch`, cookies, `localStorage`, `eval`, external URLs in reviews — in **both** modes |
| Secret scrubbing | `logger.js` | Never logs `password`/`token`/`secret`/`cookie` values |
| JSON 404 | `middleware/guards.js` | Unknown `/api/*` → JSON, no filesystem/shell endpoints exist |

**Net effect:** the "vulnerable" modes are vulnerable to exactly the two textbook classroom
attacks and to nothing else. Use only on your own machine.
