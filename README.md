# NovaCart — WebShield Lab

> **INTENTIONALLY VULNERABLE — EDUCATIONAL LOCAL LAB**
>
> One believable e-commerce storefront (**NovaCart**), two demonstration surfaces
> (**SQL Injection** on the sign-in page, **Cross-Site Scripting** on product reviews),
> and one external operator console (**start.py**) that switches each surface between
> its vulnerable and secure configurations.
>
> **Same website · Same input · Vulnerable config → attack succeeds · Secure config → attack fails.**

Built for a college cybersecurity presentation. Everything runs on `127.0.0.1` with fictional
data. The application rejects any attempt to name an external target — there is no scanning,
no exfiltration, no credential theft, and no functionality beyond the two controlled demonstrations.

---

## The two experiences

| | What it is | Security wording? |
|---|---|---|
| **A. NovaCart website** (`http://127.0.0.1:5173`) | A real-looking shopping site: home, catalog, product pages, cart, sign-in, reviews, account. | None — customers see a store. |
| **B. start.py console** | The security operator CLI that starts/stops the app and flips SQLi / XSS between `SECURE` and `VULNERABLE`. | All of it lives here. |

```
                 start.py  (operator console)
                        │  security configuration
             ┌──────────┴──────────┐
        SQLi: secure/vulnerable   XSS: secure/vulnerable      (persisted in SQLite, default SECURE)
             └──────────┬──────────┘
                        ▼
                     NovaCart  (ONE application — same pages in both states)
                 ┌─────────┴──────────┐
             Database               Browser
                 ▲                    ▲
          sign-in page           product reviews
              (SQLi)                 (XSS)
```

**Demonstration surfaces (the only code paths that switch):**

| Surface | Module | Vulnerable behavior | Secure behavior |
|---|---|---|---|
| `POST /api/store/login` (sign-in page) | SQL Injection | Input is concatenated into SQL → `' OR '1'='1' --` signs the attacker in as the administrator | Parameterized query → the same input fails like any wrong password |
| `GET/POST /api/store/products/:id/reviews` (product page) | XSS | Reviews delivered as raw HTML → the harmless payload executes in the browser and shows **"XSS EXECUTED — LOCAL EDUCATIONAL DEMO"** | Reviews delivered as encoded text → the browser renders the payload as inert characters |

Everything else — catalog, search, product lookup, static pages — is **always parameterized/secure**,
in both configurations, and serves as the control group.

---

## Quick start

Requirements: **Node.js 20+** and **Python 3.9+** (standard library only — no `pip install`).

```bash
cd webshield-lab
python start.py
```

Then choose **`1` — Start NovaCart** and open **http://127.0.0.1:5173**.

The console (option `6`) shows the security state at all times:

```
  NovaCart Security Control Console   Application: NovaCart   Environment: Local   Target: 127.0.0.1

  1  Start NovaCart
  2  Enable SQL Injection Vulnerability
  3  Secure Against SQL Injection
  4  Enable XSS Vulnerability
  5  Secure Against XSS
  6  Show Security Status
  7  Stop NovaCart
  0  Exit
```

Every enable action prints the controlled demonstration input for that module. Configuration changes
take effect immediately — just refresh the browser page. No rebuilds, no file editing, no restarts.

**Demo accounts** (fictional, shown on the sign-in page): `sarah_chen / Sunshine#88`,
`mike_torres / Turbo#5512`, `nova_admin / Admin#2024`.

### Stop / reset

- Option `7` stops both local processes (works across console restarts — spawned PIDs are tracked
  in `.cli-logs/pids.json`).
- Option `0` offers to stop the app before exiting; leaving it running is safe.
- To fully reset: stop the app and delete `server/data/` — it re-seeds with fictional data on next start.

### Tests (no app restart needed)

```bash
npm test        # 35 backend tests (isolated in-memory DB — never touches server/data)
npm run build   # production frontend build
```

---

## Architecture

```
webshield-lab/
├── start.py                    # security operator console (Python stdlib only)
├── README.md · PRESENTATION_GUIDE.md
├── server/                     # Express + better-sqlite3 (binds 127.0.0.1 ONLY)
│   ├── data/novacart.db        # fictional dataset (auto-created)
│   └── src/
│       ├── index.js            # app entry — loopback binding, guards, routes
│       ├── labState.js         # security configuration source of truth (sqli/xss, fail-safe SECURE)
│       ├── db.js               # schema, migrations, fictional seed data
│       ├── logger.js           # security event log (secret-scrubbing)
│       ├── middleware/guards.js     # anti-target guard, headers, JSON 404s
│       ├── routes/
│       │   ├── store.js        # NovaCart storefront API (login + reviews are mode-aware)
│       │   └── security.js     # status / sqli / xss / logs — used by start.py
│       ├── vuln/
│       │   ├── sqli.js         # ⚠ vulnerable (string-built) + secure (parameterized) login
│       │   └── xss.js          # ⚠ vulnerable (raw HTML) + secure (encoded) reviews + payload guard
│       └── tests/              # 35 automated tests
└── client/                     # React 18 + Vite 5 + Tailwind CSS 3
    └── src/
        ├── context/            # StoreContext (cart/user), ToastContext
        ├── components/         # Navbar, ProductCard, CartDrawer, Rating, ReviewForm, …
        ├── lib/format.js
        └── pages/              # Home, Shop, ProductDetail, Cart, Login, Account, 404
```

Fonts (Inter, Fraunces) are bundled locally via `@fontsource` — the app never contacts a CDN.
Motion uses `framer-motion` and honors `prefers-reduced-motion`.

## Security configuration

- **Source of truth:** the backend (`server/src/labState.js`), persisted in the SQLite `settings`
  table (`sqli_state`, `xss_state`). Frontend state is never involved.
- **Default & fail-safe:** missing or invalid values always fall back to `SECURE`. The vulnerable
  configuration exists only after an explicit operator action.
- **Independent modules:** SQLi and XSS are switched separately — you can present one while the
  other stays protected.
- **Change mechanism:** `start.py` → `POST /api/security/sqli|xss {"state": …}` on the loopback API.

## Safety restrictions (enforced, not just promised)

1. **Loopback only** — the API listens on `127.0.0.1` (asserted by tests); Vite binds `127.0.0.1` too.
2. **No external targets** — any request body naming a `target`, `host`, `ip`, `connectionString`,
   `dsn`, `endpoint`, `url`, … is rejected with HTTP 400 (`external_target_rejected`). The CLI offers
   no target selection; both demonstrations are hard-wired to the local fictional database.
3. **XSS demo is local and harmless** — the sanctioned payload only displays
   **“XSS EXECUTED — LOCAL EDUCATIONAL DEMO”** as a banner on the local page. The server **rejects**
   any review referencing external URLs, `fetch`/`XMLHttpRequest`/`WebSocket`/`sendBeacon`, cookies,
   web storage, `eval`, or redirects.
4. **No secrets leave the server** — login responses look identical for bypass and normal sign-in
   (user object only); password hashes are never returned; the event log scrubs
   `password/token/secret/cookie/…` keys (asserted by tests).
5. **No filesystem, shell, or scanning endpoints** — unknown `/api/*` routes return JSON 404 (tested).
6. **Storefront stays secure** — catalog search is parameterized in both configurations (tested);
   only the two dedicated surfaces switch.

> Use this project only where deliberately vulnerable software is authorized — it is designed for
> classroom demonstration on your own machine.

## Troubleshooting

| Symptom | Fix |
|---|---|
| CLI says Node/npm missing | Install Node.js 20+, reopen the terminal. |
| First start offers `npm install` | Accept — it installs workspaces and approves native build scripts. |
| Port 4000/5173 busy | Another process owns the port; stop it or change `PORT` in `server/src/index.js`. |
| Config change seems ignored | Refresh the browser page — changes are live immediately after the CLI confirms. |
| Want a clean slate | Option `7`, delete `server/data/`, option `1`. |

## The presentation

**[PRESENTATION_GUIDE.md](./PRESENTATION_GUIDE.md)** has the click-by-click script, what the audience
should observe, why each attack works, prevention talking points, and a timed 10-minute plan.
