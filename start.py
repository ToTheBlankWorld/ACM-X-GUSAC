#!/usr/bin/env python3
"""
WebShield Lab — NovaCart Security Control Console.

INTENTIONALLY VULNERABLE — EDUCATIONAL LOCAL LAB

This console is the security operator interface for the local NovaCart
training application. It starts/stops the app and switches the two
demonstration surfaces (SQL Injection, Cross-Site Scripting) between
their vulnerable and secure configurations.

Scope: 127.0.0.1 only. Fictional data only. No external targets.

Standard library only — no pip installs required.
"""

import json
import os
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
API = "http://127.0.0.1:4000/api"
WEB_URL = "http://127.0.0.1:5173"
SERVER_ENTRY = os.path.join(ROOT, "server", "src", "index.js")
SERVER_CWD = os.path.join(ROOT, "server")
CLIENT_CWD = os.path.join(ROOT, "client")
VITE_ENTRY = os.path.join(ROOT, "node_modules", "vite", "bin", "vite.js")
LOG_DIR = os.path.join(ROOT, ".cli-logs")

# ---------------------------------------------------------------- console
_IS_WINDOWS = os.name == "nt"
_COLOR = sys.stdout.isatty() and os.environ.get("NO_COLOR") is None

if _IS_WINDOWS:
    os.system("")  # enable ANSI escape processing in classic consoles


def _c(text, code):
    return f"\033[{code}m{text}\033[0m" if _COLOR else str(text)


def bold(t):    return _c(t, "1")
def dim(t):     return _c(t, "2")
def green(t):   return _c(t, "32")
def yellow(t):  return _c(t, "33")
def red(t):     return _c(t, "31;1")
def cyan(t):    return _c(t, "36")
def gray(t):    return _c(t, "90")


def state_label(state):
    return red("VULNERABLE") if state == "vulnerable" else green("SECURE")


def app_label(running):
    return green("RUNNING") if running else gray("STOPPED")


def safe_input(prompt=""):
    """input() that behaves when stdin is closed (piped runs, some IDEs).
    Returns None on EOF, '' on an empty line."""
    try:
        return input(prompt)
    except EOFError:
        return None


def pause():
    safe_input(dim("\n  Press ENTER to return to the menu..."))


def line(char="-", width=62):
    print(char * width)


# ---------------------------------------------------------------- HTTP
def http_json(path, payload=None, timeout=4):
    """GET/POST JSON against the local API. Returns (status, data) or (0, None)."""
    url = f"{API}{path}"
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(
        url, data=data, method="POST" if payload is not None else "GET",
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return res.status, json.loads(res.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode() or "{}")
        except Exception:
            return e.code, {}
    except (urllib.error.URLError, TimeoutError, ConnectionError, OSError):
        return 0, None


def app_running():
    status, data = http_json("/health", timeout=2)
    return status == 200 and bool(data.get("ok"))


# ---------------------------------------------------------------- processes
# Spawned PIDs are persisted so `Stop NovaCart` works even if this console
# was closed and reopened between actions.
_procs = {"server": None, "client": None}  # in-memory Popen handles (this run)
PID_FILE = os.path.join(LOG_DIR, "pids.json")


def _remember_pids():
    os.makedirs(LOG_DIR, exist_ok=True)
    pids = {
        "server": _procs["server"].pid if _procs["server"] else None,
        "client": _procs["client"].pid if _procs["client"] else None,
    }
    with open(PID_FILE, "w", encoding="utf-8") as f:
        json.dump(pids, f)


def _forget_pids():
    try:
        os.remove(PID_FILE)
    except OSError:
        pass


def _load_pids():
    try:
        with open(PID_FILE, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {}


def _spawn(name, args, cwd):
    os.makedirs(LOG_DIR, exist_ok=True)
    log = open(os.path.join(LOG_DIR, f"{name}.log"), "w", encoding="utf-8")
    kwargs = {}
    if _IS_WINDOWS:
        kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW
    else:
        kwargs["start_new_session"] = True
    return subprocess.Popen(
        args, cwd=cwd, stdout=log, stderr=subprocess.STDOUT, **kwargs
    )


def _kill_pid(pid):
    if not pid:
        return
    try:
        if _IS_WINDOWS:
            subprocess.run(
                ["taskkill", "/T", "/F", "/PID", str(pid)],
                capture_output=True, check=False,
            )
        else:
            import signal
            os.killpg(os.getpgid(pid), signal.SIGTERM)
    except Exception:
        pass


def node_available():
    return shutil.which("node") is not None


def deps_installed():
    return os.path.isdir(os.path.join(ROOT, "node_modules", "vite"))


def install_deps():
    print(dim("  Installing dependencies (first run, this can take a minute)..."))
    npm = shutil.which("npm") or shutil.which("npm.cmd")
    if not npm:
        print(red("  npm was not found. Install Node.js 20+ and try again."))
        return False
    result = subprocess.run([npm, "install"], cwd=ROOT, capture_output=True, text=True)
    if result.returncode != 0:
        print(red("  npm install failed — run it manually in the project folder."))
        print(dim("".join(result.stderr.splitlines(True)[-5:])))
        return False
    # npm 11+ may hold back native build scripts; approve and rebuild if supported.
    subprocess.run([npm, "approve-scripts", "better-sqlite3", "esbuild"],
                   cwd=ROOT, capture_output=True, text=True)
    subprocess.run([npm, "rebuild", "better-sqlite3", "esbuild"],
                   cwd=ROOT, capture_output=True, text=True)
    return deps_installed()


def wait_until_running(timeout_s=45):
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        if app_running():
            return True
        time.sleep(0.5)
    return False


# ---------------------------------------------------------------- actions
def start_novacart():
    print()
    if app_running():
        print(f"  NovaCart is already {bold('RUNNING')}: {cyan(WEB_URL)}")
        print(dim("  (Started outside this console — it will not be stopped by option 7.)"))
        return

    if not node_available():
        print(red("  Node.js was not found on PATH. Install Node.js 20+ first."))
        return
    if not deps_installed():
        print(dim("  Dependencies are missing."))
        if safe_input("  Run 'npm install' now? [Y/n]: ").strip().lower() in ("", "y", "yes"):
            if not install_deps():
                return
        else:
            print(dim("  Skipped. Run 'npm install' in the project folder, then try again."))
            return
    if not os.path.isfile(SERVER_ENTRY):
        print(red(f"  Server entry not found: {SERVER_ENTRY}"))
        return
    if not os.path.isfile(VITE_ENTRY):
        print(red(f"  Vite entry not found: {VITE_ENTRY}"))
        return

    node = shutil.which("node")
    print(dim("  Starting API server and web client..."))
    _procs["server"] = _spawn("server", [node, SERVER_ENTRY], SERVER_CWD)
    _procs["client"] = _spawn("client", [node, VITE_ENTRY], CLIENT_CWD)
    _remember_pids()

    if wait_until_running():
        print(f"\n  NovaCart is {bold(green('RUNNING'))}")
        print(f"  Website : {cyan(WEB_URL)}")
        print(f"  API     : {cyan('http://127.0.0.1:4000')}  {dim('(local only)')}")
        print(dim(f"  Logs    : {os.path.relpath(LOG_DIR, ROOT)}"))
        print(dim("  Sign in with the demo account sarah_chen to browse as a customer."))
    else:
        print(red("  The application did not come up in time."))
        print(dim(f"  Check {os.path.relpath(LOG_DIR, ROOT)} for details, then try again."))
        _kill_pid(_procs["server"].pid if _procs["server"] else None)
        _kill_pid(_procs["client"].pid if _procs["client"] else None)
        _procs["server"] = _procs["client"] = None
        _forget_pids()


def set_module_state(module, state):
    title = "SQL Injection" if module == "sqli" else "Cross-Site Scripting"
    action = "enabled" if state == "vulnerable" else "secured"
    print()
    if not app_running():
        print(red(f"  NovaCart is not running. Start it first (option 1)."))
        return
    status, data = http_json(f"/security/{module}", {"state": state})
    if status == 200:
        print(f"  {title} {bold(state_label(data['state']))} — vulnerability {action}.")
        _, info = http_json("/security/status")
        demo = info.get("demoInputs", {}).get(module, {})
        if state == "vulnerable":
            print(dim(f"  Controlled input ({demo.get('field', 'the demonstration field')}):"))
            print(f"    {yellow(demo.get('payload', ''))}")
            if module == "xss":
                print(dim(f"    Harmless proof shown locally: “{demo.get('proof', '')}”"))
        print(dim(f"  The change is live immediately — just refresh the browser page."))
    else:
        msg = (data or {}).get("message", "Unexpected API response.")
        print(red(f"  Could not change the configuration (HTTP {status})."))
        print(dim(f"  {msg}"))


def show_status():
    print()
    line()
    print(bold("  NOVACART SECURITY STATUS"))
    line()
    running = app_running()
    print(f"  Application")
    print(f"      Status : {app_label(running)}")
    if running:
        print(f"      Website: {cyan(WEB_URL)}")
        print(f"      Host   : 127.0.0.1  {dim('(local only)')}")
    print()
    if running:
        _, cfg = http_json("/security/status")
        if cfg:
            print(f"  SQL Injection")
            print(f"      Status : {state_label(cfg.get('sqli', 'secure'))}")
            print()
            print(f"  Cross-Site Scripting")
            print(f"      Status : {state_label(cfg.get('xss', 'secure'))}")
            print()
            _, logs = http_json("/security/logs?limit=4")
            entries = (logs or {}).get("logs", [])
            if entries:
                print(dim("  Recent security events (local only, secrets never logged):"))
                for e in entries:
                    color = yellow if e["level"] == "WARNING" else gray
                    print(dim(f"      [{e['created_at'][11:19]}] ") + color(f"{e['level']:<7} ") + dim(e["event"]))
        else:
            print(red("  Could not read the security configuration."))
    else:
        print(dim("  Start NovaCart (option 1) to view the security configuration."))
    line()


def stop_novacart():
    print()
    running = app_running()
    pids = _load_pids()
    known_pids = [p for p in (pids.get("server"), pids.get("client")) if p]
    if not running and not known_pids:
        print(f"  NovaCart is {bold('STOPPED')}.")
        return
    if not known_pids:
        print(dim("  NovaCart is running, but it was started outside this console"))
        print(dim("  (for example with 'npm run dev'). Stop it in that terminal (Ctrl+C)."))
        return
    print(dim("  Stopping NovaCart..."))
    for pid in known_pids:
        _kill_pid(pid)
    _procs["server"] = _procs["client"] = None
    _forget_pids()
    time.sleep(1.0)
    if app_running():
        print(red("  Some processes are still shutting down — give them a moment."))
    else:
        print(f"  NovaCart is {bold('STOPPED')}. All local processes terminated.")


# ---------------------------------------------------------------- menu
MENU = """
  {app}   Application: {appname}   Environment: {env}   Target: {target}

  {n1}  Start NovaCart
  {n2}  Enable SQL Injection Vulnerability
  {n3}  Secure Against SQL Injection
  {n4}  Enable XSS Vulnerability
  {n5}  Secure Against XSS
  {n6}  Show Security Status
  {n7}  Stop NovaCart
  {n0}  Exit
""".format(
    app=bold("NovaCart Security Control Console"),
    appname=bold("NovaCart"),
    env=dim("Local"),
    target=cyan("127.0.0.1"),
    n1=bold("1"), n2=bold("2"), n3=bold("3"), n4=bold("4"),
    n5=bold("5"), n6=bold("6"), n7=bold("7"), n0=bold("0"),
)


def banner():
    print()
    line("=")
    print(bold("                          WEBSHIELD LAB").center(0))
    print(bold("                       NOVACART SECURITY").center(0))
    line("=")


def choose(choice):
    if choice == "1":
        start_novacart()
    elif choice == "2":
        set_module_state("sqli", "vulnerable")
    elif choice == "3":
        set_module_state("sqli", "secure")
    elif choice == "4":
        set_module_state("xss", "vulnerable")
    elif choice == "5":
        set_module_state("xss", "secure")
    elif choice == "6":
        show_status()
    elif choice == "7":
        stop_novacart()
    elif choice == "0":
        if app_running():
            answer = safe_input("  Stop NovaCart before exiting? [y/N]: ").strip().lower()
            if answer in ("y", "yes"):
                stop_novacart()
            else:
                print(dim("  Leaving NovaCart running."))
        print(dim("  Goodbye."))
        return False
    else:
        print(red("  Unknown option — enter a number from the menu (0-7)."))
    return True


def main():
    banner()
    while True:
        print(MENU)
        choice = safe_input("  Select an option: ")
        if choice is None:
            # stdin closed (piped/EOF run): exit cleanly, leave state untouched.
            print(dim("\n  Input closed — NovaCart keeps running in the background."))
            break
        choice = choice.strip()
        if choice == "":
            continue
        if not choose(choice):
            break
        pause()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print()
        print(dim("  Interrupted. NovaCart processes keep running; use option 7 or taskkill to stop them."))
        sys.exit(0)
    except Exception as exc:  # never scare the audience with a traceback
        print(red(f"  Unexpected error: {exc}"))
        sys.exit(1)
