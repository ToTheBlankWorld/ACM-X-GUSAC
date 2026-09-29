# 🎤 NovaCart Presentation Guide — SQL Injection & Cross-Site Scripting

A click-by-click script for the WebShield Lab presentation. The console is `start.py`; the stage is
the normal NovaCart shopping website. The arc of the whole talk:

> **SAME WEBSITE · SAME USER INPUT**
> **VULNERABLE CONFIGURATION → the attack SUCCEEDS**
> **SECURE CONFIGURATION → the SAME attack FAILS**

Start with:

```bash
cd webshield-lab
python start.py     # → 1 (Start NovaCart) → open http://127.0.0.1:5173
```

Before the audience arrives: run option `6` and confirm **SQL Injection: SECURE** and
**Cross-Site Scripting: SECURE**. You enable vulnerabilities live, deliberately, and say why.

---

## 0 · Introduction (~1 min)

**Do:** Show the NovaCart homepage. Let the design speak — hero, categories, products, cart.

**Say:** *"This is NovaCart, an ordinary e-commerce store — catalog, cart, sign-in, product reviews.
It runs entirely on this laptop with fictional data. We're going to attack it two ways — SQL Injection
and Cross-Site Scripting — from a security console called WebShield. Then we'll fix each vulnerability
and run the exact same attack again. Same site, same input — different configuration, different outcome."*

Show the console once (option `6`) so the audience sees `SECURE` everywhere.

---

## 1 · SQL Injection (~4 min)

### What it is
SQL Injection (SQLi) is an attack where user input is interpreted as **part of the SQL query** instead
of as data. The database can't tell code from data inside a string-built query, so the attacker changes
the query's *structure* — its logic — without ever touching the database server.

**Where it occurs:** anywhere input is concatenated into SQL — login forms, search boxes, filters.

### What to click
1. On the website: **Sign in**. Show the demo accounts box; sign in normally as `sarah_chen`
   (`use` button → Sign in). Show the account page, then sign out. *"A normal login — remember this
   page, you'll see it again."*
2. In the console: **`2` — Enable SQL Injection Vulnerability.** It prints the controlled input:
   `' OR '1'='1' --`
3. Back on the website: the **same sign-in page**. Username: `' OR '1'='1' --`, password: anything.
   **Sign in.**

### What the audience should observe
- You are signed in as **Nova Sentinel — ADMINISTRATOR** without knowing any password
  (the account page shows the role badge).
- Log analysis (optional, in the console event log): `WARNING — SQL injection demonstration triggered`.

### Why it worked
The vulnerable login builds SQL as a string. The payload's leading quote closes the username string,
`OR '1'='1'` adds a condition that is always true, and `--` comments out the password check:

```sql
SELECT * FROM users WHERE username = '' OR '1'='1' --' AND password_hash = '…'
                                   \_____always TRUE_____/ \___commented out___/
```

The database returned the first account as "the logged-in user". Password hashing didn't help —
the check was never evaluated. Impact: authentication bypass, data theft (UNION/boolean/error
techniques), data tampering, downtime.

### Protect and repeat
4. In the console: **`3` — Secure Against SQL Injection.**
5. On the website: the **exact same page**, the **exact same input**. **Sign in.**

**What the audience observes:** *"That username and password don't match our records."* The payload
is now just a weird username string compared as **data** — the query uses bound parameters
(`WHERE username = ? AND password_hash = ?`), so input can never change the query's structure.

### Prevention (say while showing the page)
- **Prepared statements / parameterized queries** — the primary fix; data travels separately from code.
- **Input validation where appropriate** — allowlists as defense in depth, never the only fix.
- **Least-privilege database accounts** — the app's DB user only reaches what it needs.
- **Safe error handling** — generic messages to users; the app never leaked SQL errors even when vulnerable.
- **Security testing** — the console event log recorded the attack attempt automatically.

---

## 2 · Cross-Site Scripting (~4 min)

### What it is
XSS is an attack where application-supplied content reaches the browser as **active content**
(HTML/JavaScript) instead of plain text — and the browser, trusting the application, executes it.
The bug is in the application's **output**; the execution happens in the **victim's browser**.

**Three categories:** **Stored** (payload persists, e.g. a review — today's demo), **Reflected**
(payload arrives via a crafted link and is echoed back), **DOM-based** (unsafe JavaScript sinks like
`innerHTML` write untrusted data into the page — the sink our demo exploits).

### What to click
1. On the website: open a product (e.g. **Quantum K8 Mechanical Keyboard**) and scroll to
   **Customer reviews**. Post a normal review as a customer would. It renders as plain text.
2. In the console: **`4` — Enable XSS Vulnerability.** It prints the controlled payload (a small
   `<img src=x onerror=…>` snippet) and the expected proof text.
3. On the website: **Write a review** — paste the controlled payload into the review box, name it
   whatever you like, **Post Review**.

### What the audience should observe
- A red banner appears at the top of the page: **"XSS EXECUTED — LOCAL EDUCATIONAL DEMO"**.
- Everything else is unchanged — the store looks normal. Emphasize: *"the payload only changed
  text on this local page. No cookies, no storage, no network requests — the lab's input filter
  rejects any review that references URLs, cookies, or external calls."*

### Why it worked
The vulnerable configuration delivered the review as **raw HTML**, and the page rendered it through
an HTML sink (`innerHTML`). The browser had to interpret `<img src=x onerror=…>`: the broken image
fired `onerror`, executing the JavaScript. In a real application the same bug lets an attacker run
*arbitrary* script in victims' browsers — session theft, fake login forms, keylogging, defacement,
worms. Here it is confined to changing one visible element.

### Protect and repeat
4. In the console: **`5` — Secure Against XSS.**
5. On the website: **reload the product page** — the same stored review is now displayed as
   **literal text** (`&lt;img src=x onerror=…&gt;`). No execution. The browser rendered it as *data*.

### Prevention (say while showing the page)
- **Contextual output encoding** — encode for the exact sink (HTML text, attributes, JS, URLs).
- **Safe templating / frameworks** — React escapes interpolated values by default (that is the fix you just saw).
- **Safe DOM APIs** — prefer `textContent`/`setAttribute` over `innerHTML`/`document.write`.
- **Avoid unsafe HTML insertion** — treat `dangerouslySetInnerHTML` & friends as last resorts.
- **Sanitize when HTML is intended** — allowlist sanitizer (e.g. DOMPurify) server-side.
- **Content-Security-Policy** — a strict CSP blocks inline injection as a second layer.
- **HttpOnly cookies** — defense in depth: scripts can't read session cookies.

---

## 3 · Comparison & lessons (~1–2 min)

**The two trust boundaries:**

| | Boundary | What crossed it | Control |
|---|---|---|---|
| **SQL Injection** | Application ↔ **Database** | Input became SQL *code* | Parameterized queries |
| **XSS** | Application ↔ **Browser** | Data was delivered as HTML *code* | Contextual output encoding |

Same root cause: **untrusted input crossed a boundary where data and commands share one channel.**

**Five lessons to close:**
1. Never trust user input.
2. Keep data separate from commands.
3. Encode output correctly for its context.
4. Use defense in depth — no single wall.
5. Test security continuously — the console log caught both attacks on its own.

End on the console (option `6`) with both modules **SECURE**.

---

## Recommended 10-minute structure

| # | Segment | Time | Where |
|---|---|---|---|
| 1 | Introduction + console overview (SECURE state) | 1 min | Website home + console |
| 2 | Normal login (baseline) | 0.5 min | Sign-in page |
| 3 | Enable SQLi (`2`) → attack → admin account | 1.5 min | Console + sign-in page |
| 4 | Why it worked + impact | 1 min | Talk over the account page |
| 5 | Secure SQLi (`3`) → same input fails | 1 min | Console + sign-in page |
| 6 | Normal review (baseline) → enable XSS (`4`) → attack → proof | 2 min | Console + product page |
| 7 | Why it worked | 0.5 min | Talk over the banner |
| 8 | Secure XSS (`5`) → same review as text | 1 min | Console + product page |
| 9 | Comparison + five lessons | 1.5 min | Console status |

Trim segments 4/7 to land at ~8 minutes.

## Presenter checklist

- [ ] `python start.py` → `1` → open http://127.0.0.1:5173
- [ ] Option `6`: both modules **SECURE**, application **RUNNING**
- [ ] Optional clean-up: stop app, delete `server/data/`, start again (fresh fictional data)
- [ ] Console window on second screen (or split screen: console left, browser right)
- [ ] Payloads are printed by the console when you enable a module — no memorizing

## Likely questions

- **"Is the SQL real?"** — Yes: a real SQLite database with fictional rows; the concatenation bug is real, the data isn't.
- **"Could the XSS demo send my data anywhere?"** — No: the payload only creates a banner on the local page, and the input filter rejects any review referencing URLs, cookies, storage, or network calls (verified by the test suite).
- **"Why hash passwords if SQLi bypasses them?"** — Hashing protects data at rest; injection bypasses the check entirely. You need *both*.
- **"What's the single takeaway?"** — Keep data separate from commands: bind SQL parameters, encode output.
