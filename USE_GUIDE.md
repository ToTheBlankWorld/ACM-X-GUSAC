# 📘 USE_GUIDE.md — The Junior's Guide to WebShield Lab (NovaCart)

> **Zero experience needed.** If you can open a terminal and type, you can run this project.
> Read top to bottom the first time (~15 minutes). After that, just jump to the sections you need.

---

## Table of contents

1. [What is this project?](#1-what-is-this-project)
2. [What do I need on my computer?](#2-what-do-i-need-on-my-computer)
3. [First-time setup (do this once)](#3-first-time-setup-do-this-once)
4. [Starting the project (every time)](#4-starting-the-project-every-time)
5. [The menu, explained one key at a time](#5-the-menu-explained-one-key-at-a-time)
6. [Demo 1: SQL Injection — full walkthrough](#6-demo-1-sql-injection--full-walkthrough)
7. [Demo 2: XSS — full walkthrough](#7-demo-2-xss--full-walkthrough)
8. [The demo accounts](#8-the-demo-accounts)
9. [What does each file do?](#9-what-does-each-file-do)
10. [Tests, build, and reset](#10-tests-build-and-reset)
11. [Troubleshooting (things that go wrong)](#11-troubleshooting-things-that-go-wrong)
12. [Words you may not know (glossary)](#12-words-you-may-not-know-glossary)
13. [Safety rules of this lab](#13-safety-rules-of-this-lab)

---

## 1. What is this project?

Imagine a small online shop called **NovaCart** (it sells fictional products — nothing is real).

This project has **two parts**:

| Part | What it looks like | What it's for |
|---|---|---|
| **The website** | A normal-looking shop at `http://127.0.0.1:5173` | The thing your audience sees and clicks around in |
| **The CLI console** (`start.py`) | A black terminal with a numbered menu | The "control room" where **you** turn security bugs on and off |

The cool trick: **the website never changes** — same pages, same input boxes.
You just flip a switch in the terminal, and the *same* attack either **works** or **fails**.

```
  YOU (terminal)  ──flip switch──▶  SERVER  ──serves──▶  WEBSITE (browser)
   start.py                         :4000                :5173
```

**Two attacks are demonstrated:**

1. **SQL Injection (SQLi)** — hacking a *sign-in box* so any password works
2. **Cross-Site Scripting (XSS)** — hiding harmless JavaScript inside a *product review*

⚠️ **This app is INTENTIONALLY vulnerable.** That's the whole point — it's a classroom
teaching tool that only ever runs on **your own computer** (`127.0.0.1` = your machine, never the internet).

---

## 2. What do I need on my computer?

Only two things:

| Tool | Version | How to check | Where to get it |
|---|---|---|---|
| **Node.js** | 20 or newer | open terminal → type `node -v` | https://nodejs.org |
| **Python** | 3.9 or newer | open terminal → type `python --version` | https://python.org (usually pre-installed) |

You do **NOT** need:
- ❌ `pip install` anything (Python part uses only built-in tools)
- ❌ A database server (SQLite is built in)
- ❌ Any API keys, accounts, or internet connection (after setup)

> **How to open a terminal**
> *Windows:* press `Win + R`, type `cmd`, press Enter — or use PowerShell.
> *Mac:* open **Terminal** from Applications.

---

## 3. First-time setup (do this once)

Open your terminal and run these **two** commands:

```bash
cd "D:\My Projects\ACM CLUB DEMO\webshield-lab"
npm install
```

**What just happened?**
- `cd ...` = "go into the project folder"
- `npm install` = "download all the JavaScript code this project needs"
  (it creates a `node_modules` folder — never delete it, never edit it)

✅ You'll know it worked if you now see a `node_modules` folder in the project.

> **Shortcut:** the first time you press `1` in the menu, the app will *offer* to run
> `npm install` for you automatically. You can just say `Y` and skip this step.

---

## 4. Starting the project (every time)

```bash
cd "D:\My Projects\ACM CLUB DEMO\webshield-lab"
python start.py
```

> ⚠️ On some Windows computers the command is `py start.py` instead of `python start.py`.
> If `python` gives an error, try `py`.

You'll see a banner and this menu:

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

  Select an option:
```

**Now type a number and press Enter.** That's the whole interaction model.

---

## 5. The menu, explained one key at a time

| Key | What you type | What it does in plain words | What you'll see |
|---|---|---|---|
| **1** | `1` | Boots up the website + API (two background programs) | `NovaCart is RUNNING` + the website link |
| **2** | `2` | Makes the sign-in page **hacked** (SQLi on) | Red `VULNERABLE` + the magic password text |
| **3** | `3` | **Fixes** the sign-in page (SQLi off) | Green `SECURE` |
| **4** | `4` | Makes reviews **dangerous** (XSS on) | Red `VULNERABLE` + the payload text |
| **5** | `5` | **Fixes** reviews (XSS off) | Green `SECURE` |
| **6** | `6` | Shows the current status of everything + recent security events | A status box |
| **7** | `7` | Shuts everything down cleanly | `NovaCart is STOPPED` |
| **0** | `0` | Leaves the menu (asks if you want to stop the app first) | `Goodbye.` |

**Rules of the road:**

- 🔁 **Press `1` first.** Options 2–6 need the app running, or they reply
  *"NovaCart is not running. Start it first (option 1)."*
- ⚡ **Changes are instant.** After pressing 2/3/4/5, just **refresh the browser page**
  (F5). No restart, no rebuild, no editing files.
- ⏸️ After every action it says `Press ENTER to return to the menu...` — press Enter.
- 🟢 **Default is SECURE.** A fresh start is always secure; the bug exists only
  *after* you explicitly press 2 or 4.
- 🔀 The two switches are **independent** — you can have SQLi hacked while XSS stays fixed.

---

## 6. Demo 1: SQL Injection — full walkthrough

**The story you tell:** *"Same login page, same input. Watch it fail when the app is secure,
and succeed when it's vulnerable — I didn't touch the website, only my control console."*

### Step 1 — Start everything
```
  Select an option: 1
```
Open **http://127.0.0.1:5173** in your browser → click **Sign in** (top right).

### Step 2 — Show it SECURE first (this is the default)
```
  Select an option: 3
```
In the browser, on the sign-in page:
- **Username:** `' OR '1'='1' --`
- **Password:** anything, e.g. `whatever`

Click sign in → you get:
> **"That username and password don't match our records."** ❌ (attack failed — good!)

### Step 3 — Turn the vulnerability ON
```
  Select an option: 2
```
The CLI prints the controlled input for you:
```
  Controlled input (Username field on the NovaCart sign-in page):
    ' OR '1'='1' --
```

### Step 4 — Run the exact same attack
Refresh the browser page (F5), type the **same** payload in the **same** box:
- **Username:** `' OR '1'='1' --`
- **Password:** anything

Click sign in → you are now signed in as the **administrator** ✅ (attack succeeded!)

### Step 5 — Explain *why* it worked (one sentence each)
- **Secure:** the app uses a *parameterized query* — your text is treated as **data**, like a
  value to compare. It can never become part of the SQL command.
- **Vulnerable:** your text was **pasted into the SQL command** itself. The payload closed the
  quote, added "always true", and commented out the password check:
  ```sql
  WHERE username = '' OR '1'='1' --' AND password_hash = '...'
  ```

### Step 6 — Fix it live (optional, for impact)
```
  Select an option: 3
```
Refresh, run the payload again → **fails again**. The hole is closed mid-sentence.

> 📄 The actual code for both versions: `server/src/vuln/sqli.js`
> (`vulnerableLogin()` vs `secureLogin()`). Details in **[SECURE_CHANGES.md](./SECURE_CHANGES.md)**.

---

## 7. Demo 2: XSS — full walkthrough

**The story you tell:** *"A customer posts a product review. When the app is secure you see
harmless text. When it's vulnerable, that text runs as code — and this is a real website
vulnerability called Cross-Site Scripting."*

### Step 1 — Start + open a product
```
  Select an option: 1
```
Browser → **http://127.0.0.1:5173** → click any product → scroll down to **Reviews**.

### Step 2 — Show it SECURE first (default)
```
  Select an option: 5
```
In the review box, paste the demo payload (press `4` first if you want the CLI to print it —
it's long, so copy it from the CLI output or from `SECURE_CHANGES.md`):

```html
<img src=x onerror="var b=document.createElement('div');b.textContent='XSS EXECUTED — LOCAL EDUCATIONAL DEMO';b.style.cssText='position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:2147483647;background:#b91c1c;color:#fff;padding:10px 16px;border-radius:10px;font:600 14px system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25)';document.body.appendChild(b);">
```
Post it → the review shows the **code as plain text** (you can read the `<img ...>` characters).
Nothing happens. ✅ (secure — the browser treats it as data)

### Step 3 — Turn the vulnerability ON
```
  Select an option: 4
```
CLI prints the payload + `Harmless proof shown locally: "XSS EXECUTED — LOCAL EDUCATIONAL DEMO"`

### Step 4 — Post the same review again
Refresh the product page, paste the **same** payload, post it →
a red banner appears at the top of the page:

> **XSS EXECUTED — LOCAL EDUCATIONAL DEMO** ✅

That banner was created *by the review text itself*. A real attacker could have put
something nastier there — which is exactly why this matters.

### Step 5 — Explain *why* (one sentence each)
- **Vulnerable:** the server sent your review as **raw HTML**, and the page inserted it with
  `dangerouslySetInnerHTML` — so the browser **executed** it.
- **Secure:** the server **escaped** it (`<` becomes `&lt;`) and sent it as **text** — so the
  browser **displays** it.

### Step 6 — Fix it live
```
  Select an option: 5
```
Refresh → even the review you posted earlier now shows as harmless text.

> 📄 The actual code: `server/src/vuln/xss.js` (`renderVulnerable()` vs `renderSecure()`
> + `escapeHtml()`) and `client/src/components/ReviewCard.jsx`.
> Details in **[SECURE_CHANGES.md](./SECURE_CHANGES.md)**.

---

## 8. The demo accounts

Shown on the sign-in page too. All fictional.

| Username | Password | Role |
|---|---|---|
| `sarah_chen` | `Sunshine#88` | Customer (good for browsing) |
| `mike_torres` | `Turbo#5512` | Customer |
| `nova_admin` | `Admin#2024` | Administrator |

> 💡 For the SQLi demo you **don't need any password** — the payload is the point.

---

## 9. What does each file do?

You don't need to read code to use this. But if someone asks "what's this file?", here:

```
webshield-lab/
│
├── start.py                     🎛️  THE CLI — the numbered menu you type into
├── USE_GUIDE.md                 📘  This file (start here)
├── SECURE_CHANGES.md            🔐  Which files/code change when you press 3 or 5
├── README.md                    📄  Project overview (for reviewers)
├── PRESENTATION_GUIDE.md        🎤  Click-by-click speech script for your talk
├── requirements.txt             📦  Python requirements (empty = nothing to install)
│
├── server/                      🖥️  The BACKEND ("the brain" — runs on port 4000)
│   ├── data/novacart.db         💾  The database (auto-created, fictional data)
│   └── src/
│       ├── index.js             ▶️  Starts the server, binds to 127.0.0.1 ONLY
│       ├── labState.js          🔘  THE SWITCH — stores secure/vulnerable (default secure)
│       ├── db.js                🗃️  Creates tables + fills them with fake shop data
│       ├── logger.js            📝  Security event log (never records passwords)
│       ├── middleware/guards.js 🛡️  Safety rails (blocks external targets, etc.)
│       ├── routes/store.js      🛒  Shop API: products, reviews, login
│       ├── routes/security.js   🎛️  API the CLI talks to (change status, read logs)
│       ├── vuln/sqli.js         ⚠️/✅ BOTH login versions (vulnerable + secure)
│       ├── vuln/xss.js          ⚠️/✅ BOTH review versions (vulnerable + secure)
│       └── tests/               🧪  35 automated tests (run with `npm test`)
│
└── client/                      🌐  The FRONTEND ("the face" — runs on port 5173)
    └── src/
        ├── pages/               📄  Home, Shop, Product, Cart, Login, Account, 404
        ├── components/          🧩  Navbar, ProductCard, ReviewCard, CartDrawer, ...
        └── context/             🧠  Remembers your cart + who's signed in
```

**The 4 files that matter most:**

| File | Why |
|---|---|
| `start.py` | Everything you type goes through here |
| `server/src/labState.js` | The actual secure/vulnerable switch |
| `server/src/vuln/sqli.js` | Both login implementations side by side |
| `server/src/vuln/xss.js` | Both review implementations side by side |

---

## 10. Tests, build, and reset

Run these in the terminal **from the project folder** (the app can stay running):

| Command | What it does | Expect |
|---|---|---|
| `npm test` | Runs all 35 backend tests (uses an isolated in-memory database — it will **not** touch your shop data) | `# pass 35` ✅ |
| `npm run build` | Builds the website for production into `client/dist/` | no errors ✅ |

**Full reset** (wipe the shop back to brand new):
1. Option `7` in the CLI (stop the app)
2. Delete the `server/data/` folder
3. Option `1` (start again) — it recreates everything with fresh fictional data,
   and both switches go back to **SECURE**

---

## 11. Troubleshooting (things that go wrong)

| Symptom | Fix |
|---|---|
| `'python' is not recognized` | Try `py start.py`. On Mac/Linux try `python3 start.py`. |
| `'node' is not recognized` | Install Node.js 20+ from nodejs.org, then **close and reopen** the terminal. |
| `NovaCart is not running. Start it first (option 1).` | Press `1` first — options 2–6 need the app up. |
| Menu says dependencies are missing → offers `npm install` | Type `Y` and wait ~1 minute. |
| Website won't open / keeps loading | Wait for `NovaCart is RUNNING` in the CLI, then refresh. Check `.cli-logs/server.log`. |
| `Port 4000 already in use` / `Port 5173 busy` | Some other program owns that port. Close it, or stop the app with option `7` and start again. |
| Changed a setting but the site didn't change | **Refresh the browser (F5).** The change is live instantly — but the page must reload. |
| I pressed `Ctrl+C` and got confused | The app may still be running. Run `python start.py` again and press `7`, then `1`. |
| Everything is messed up | Option `7` → delete `server/data/` → option `1`. Clean slate. |
| Wrong colors / weird symbols in the CLI | Harmless. Set `NO_COLOR=1` before starting if it bothers you. |

**Where to look when something breaks:**
- `.cli-logs/server.log` — backend messages
- `.cli-logs/client.log` — website/dev-server messages
- Option `6` in the menu — recent security events (passwords are never shown)

---

## 12. Words you may not know (glossary)

| Word | Plain-English meaning |
|---|---|
| **CLI** | Command Line Interface — the text menu you type numbers into (`start.py`) |
| **Backend / server** | The program that stores data and answers questions. Port **4000** |
| **Frontend / client** | The program that draws the page in your browser. Port **5173** |
| **SQL** | The language databases understand (e.g. `SELECT * FROM users`) |
| **SQL Injection (SQLi)** | Trick: typing database code into a normal text box so the app runs *your* SQL instead of its own |
| **Parameterized query** | The fix: send your text as a *value* (`?`) that the database treats as data, never as code |
| **XSS (Cross-Site Scripting)** | Trick: getting your JavaScript saved on a page so it runs in *other* visitors' browsers |
| **Output encoding / escaping** | The fix: turn `<` into `&lt;` so the browser shows text instead of running it |
| **`127.0.0.1` / localhost** | Your own computer. Nothing outside your machine can reach this app |
| **Port** | A door number for programs (this app uses doors 4000 and 5173) |
| **SQLite** | A database that's just one file — no server to install |
| **`npm install`** | "Download the JavaScript packages this project needs" |
| **Refresh (F5)** | Reload the page so it fetches the current state from the server |
| **Payload** | The exact text you paste in to trigger the demonstration |
| **Secure / Vulnerable** | Green = the fix is active. Red = the classroom bug is active |

---

## 13. Safety rules of this lab

These are **built in**, not just promises:

1. **Local only** — the server listens on `127.0.0.1`. Other machines on your network
   cannot reach it at all.
2. **No external targets** — if a request tries to name another host/IP/URL, the server
   rejects it with HTTP 400.
3. **Harmless XSS demo** — the only payload allowed displays the words
   *"XSS EXECUTED — LOCAL EDUCATIONAL DEMO"*. Anything that could touch cookies,
   storage, or the network is blocked by an input filter.
4. **No secrets leak** — password hashes are never sent to the browser or written to logs.
5. **Fictional data only** — fake products, fake people, one local database file.

> 🎓 Use this only where deliberately vulnerable software is authorized:
> your own machine, your own classroom demo.

---

## Quick cheat-sheet (print / screenshot this)

```
START      python start.py          (in the project folder)
MENU 1     start the app            → http://127.0.0.1:5173
MENU 3     SECURE the login         → payload fails
MENU 2     HACK the login           → payload:   ' OR '1'='1' --
MENU 5     SECURE the reviews       → payload shows as text
MENU 4     HACK the reviews         → red banner appears
MENU 6     show status + logs
MENU 7     stop everything
MENU 0     exit
AFTER ANY CHANGE: refresh the browser (F5)
TESTS      npm test
RESET      menu 7 → delete server/data/ → menu 1
```

**Related docs:** [README.md](./README.md) (overview) ·
[SECURE_CHANGES.md](./SECURE_CHANGES.md) (code behind options 3 & 5) ·
[PRESENTATION_GUIDE.md](./PRESENTATION_GUIDE.md) (your speech script)
