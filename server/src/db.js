// WebShield Lab — SQLite database (fictional data only).
// The database file lives inside the project (server/data/novacart.db).
// Tests use an in-memory database. No real credentials or secrets exist here.
import Database from 'better-sqlite3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// `node --test` sets NODE_TEST_CONTEXT in each child process. Honouring it means
// the suite can never open (or pollute) the presenter's on-disk lab database,
// regardless of how npm/NODE_ENV is configured on the host.
const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.NODE_TEST_CONTEXT);

const SEED_VERSION = 2;

// Demo-only password hashing (fictional accounts). The SQLi demo works even
// against hashed passwords because the payload makes the WHERE clause always true.
export function hashPassword(password) {
  return crypto.createHash('sha256').update(`novacart-lab::${password}`).digest('hex');
}

let db = null;
let useMemory = isTest;

export function getDb() {
  if (db) return db;
  if (useMemory) {
    db = new Database(':memory:');
  } else {
    const dataDir = path.join(__dirname, '..', 'data');
    fs.mkdirSync(dataDir, { recursive: true });
    db = new Database(path.join(dataDir, 'novacart.db'));
  }
  db.pragma('journal_mode = WAL');
  migrate(db);
  seed(db);
  return db;
}

// Force an isolated in-memory database. Called by the test server so the
// suite is deterministic and can never touch server/data/novacart.db.
export function useMemoryDatabase() {
  if (db && useMemory) return db;
  if (db) {
    try { db.close(); } catch { /* already closed */ }
    db = null;
  }
  useMemory = true;
  return getDb();
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      tint TEXT NOT NULL DEFAULT 'from-teal-100 to-cyan-100',
      rating REAL NOT NULL DEFAULT 4.5,
      reviews_count INTEGER NOT NULL DEFAULT 0,
      compare_at REAL,
      tagline TEXT NOT NULL DEFAULT '',
      stock INTEGER NOT NULL DEFAULT 25
    );
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL DEFAULT 1,
      author TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS security_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL,
      event TEXT NOT NULL,
      detail TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Lightweight upgrades for databases created by older versions.
  const commentCols = db.pragma('table_info(comments)').map((c) => c.name);
  if (!commentCols.includes('rating')) {
    db.exec('ALTER TABLE comments ADD COLUMN rating INTEGER NOT NULL DEFAULT 5');
  }
  const productCols = db.pragma('table_info(products)').map((c) => c.name);
  for (const [name, ddl] of [
    ['tint', "ALTER TABLE products ADD COLUMN tint TEXT NOT NULL DEFAULT 'from-teal-100 to-cyan-100'"],
    ['rating', 'ALTER TABLE products ADD COLUMN rating REAL NOT NULL DEFAULT 4.5'],
    ['reviews_count', 'ALTER TABLE products ADD COLUMN reviews_count INTEGER NOT NULL DEFAULT 0'],
    ['compare_at', 'ALTER TABLE products ADD COLUMN compare_at REAL'],
    ['tagline', "ALTER TABLE products ADD COLUMN tagline TEXT NOT NULL DEFAULT ''"],
    ['stock', 'ALTER TABLE products ADD COLUMN stock INTEGER NOT NULL DEFAULT 25'],
  ]) {
    if (!productCols.includes(name)) db.exec(ddl);
  }
}

const PRODUCTS = [
  ['Quantum K8 Mechanical Keyboard', 'Peripherals', 129.99, null, 'Hot-swappable switches, per-key RGB and an aluminum frame. Built for long days and long sessions.', '⌨️', 'from-teal-100 to-cyan-100', 4.8, 214, 'The desk upgrade everyone notices'],
  ['NebulaWire Pro Earbuds', 'Audio', 89.5, 109.0, 'Active noise cancelling, 32-hour battery with the case, and spatial audio that actually helps you focus.', '🎧', 'from-violet-100 to-fuchsia-100', 4.7, 186, 'Silence, on demand'],
  ['Photon 4K Stream Webcam', 'Cameras', 149.0, null, 'A 4K30 sensor with auto-framing and a real privacy shutter. Looks natural in bad lighting.', '📷', 'from-rose-100 to-orange-100', 4.6, 132, 'Look sharp on every call'],
  ['Aegis Titan 20K Power Bank', 'Power', 59.95, 74.0, '20,000 mAh with 65W USB-C PD — charges a laptop, a phone, and still has something left.', '🔋', 'from-emerald-100 to-lime-100', 4.9, 301, 'Power for the whole bag'],
  ['HyperDrive 7-in-1 USB-C Hub', 'Accessories', 44.25, null, 'HDMI 4K60, gigabit ethernet, SD and microSD, plus 100W passthrough in an aluminum shell.', '🔌', 'from-sky-100 to-blue-100', 4.5, 98, 'One port, seven jobs'],
  ['Vega 27" QHD Monitor', 'Displays', 289.0, 329.0, '2560x1440 IPS at 165 Hz with factory-calibrated color. Thin bezels, sturdy stand.', '🖥️', 'from-cyan-100 to-teal-100', 4.7, 167, 'Room to think'],
  ['Comet Silent Wireless Mouse', 'Peripherals', 34.99, null, 'Whisper-quiet clicks, eight buttons and a 4000 DPI sensor that tracks on anything.', '🖱️', 'from-indigo-100 to-violet-100', 4.4, 143, 'Quiet by design'],
  ['Orbit Lap Desk Pro', 'Accessories', 52.4, null, 'Cushioned bamboo lap desk with a device ledge and a full-size mouse pad surface.', '💻', 'from-amber-100 to-orange-100', 4.3, 76, 'Work from anywhere'],
  ['Pulsar RGB Desk Mat', 'Accessories', 24.99, 29.99, 'XL micro-weave mat with an edge-lit diffused glow strip and a stitched anti-fray border.', '🌈', 'from-pink-100 to-rose-100', 4.6, 89, 'Set the mood'],
  ['Titan Shield Laptop Stand', 'Accessories', 64.0, null, 'Aircraft-grade aluminum, six height settings and silicone grip pads that hold without scratching.', '🛡️', 'from-lime-100 to-green-100', 4.8, 122, 'Posture, solved'],
];

const REVIEWS = [
  [1, 'Sarah Chen', 5, 'Excellent keyboard. The switches feel great out of the box and the build quality is genuinely premium.', '2026-09-12 10:24:00'],
  [1, 'Mike Torres', 4, 'Types beautifully. Wish it came with a wrist rest, but that is my only complaint.', '2026-09-08 18:41:00'],
  [1, 'Elena Rodriguez', 5, 'Replaced two boards on my desk with this one. The RGB is tasteful, not flashy.', '2026-08-30 09:12:00'],
  [2, 'David Kim', 5, 'ANC is surprisingly good for the price. Battery easily lasts my whole week.', '2026-09-15 14:03:00'],
  [2, 'Priya Nair', 4, 'Comfortable for long calls. Touch controls took a day to get used to.', '2026-09-02 11:55:00'],
  [3, 'Marcus Webb', 5, 'The auto-framing is the killer feature — I move around a lot and it keeps up.', '2026-09-10 16:20:00'],
  [4, 'Josh Alvarez', 5, 'Charged my laptop and phone on a flight and still had juice left.', '2026-09-18 08:47:00'],
  [5, 'Lena Fischer', 4, 'Solid hub, runs cool. The ethernet port is faster than my Wi-Fi ever was.', '2026-09-05 13:29:00'],
  [6, 'Tom Bradley', 5, 'Colors look calibrated out of the box. Text is crisp and the stand is sturdy.', '2026-09-14 19:36:00'],
  [7, 'Ana Souza', 4, 'Genuinely silent clicks — my open-plan office thanks me daily.', '2026-09-01 10:11:00'],
  [9, 'Rachel Owens', 5, 'Big enough for keyboard and mouse, and the glow is subtle enough for the living room.', '2026-09-16 21:08:00'],
  [10, 'Ben Carter', 5, 'Sturdy, no wobble, and it saved my neck. Assembly took thirty seconds.', '2026-09-11 07:53:00'],
];

const USERS = [
  ['nova_admin', 'admin@novacart.example', 'Nova Sentinel', 'administrator', 'Admin#2024'],
  ['sarah_chen', 'sarah@novacart.example', 'Sarah Chen', 'customer', 'Sunshine#88'],
  ['mike_torres', 'mike@novacart.example', 'Mike Torres', 'customer', 'Turbo#5512'],
  ['elena_rodriguez', 'elena@novacart.example', 'Elena Rodriguez', 'customer', 'Aurora#777'],
];

function seedProducts(db) {
  const insert = db.prepare(`
    INSERT INTO products (name, category, price, compare_at, description, icon, tint, rating, reviews_count, tagline, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const [name, cat, price, compareAt, desc, icon, tint, rating, reviews, tagline] of PRODUCTS) {
    insert.run(name, cat, price, compareAt, desc, icon, tint, rating, reviews, tagline, 20 + ((reviews * 7) % 40));
  }
}

function seedReviews(db) {
  const insert = db.prepare(
    "INSERT INTO comments (product_id, author, content, rating, created_at) VALUES (?, ?, ?, ?, ?)"
  );
  for (const [pid, author, rating, content, at] of REVIEWS) insert.run(pid, author, content, rating, at);
}

function seedUsers(db) {
  const insert = db.prepare('INSERT INTO users (username, email, full_name, role, password_hash) VALUES (?, ?, ?, ?, ?)');
  for (const [u, e, f, r, p] of USERS) insert.run(u, e, f, r, hashPassword(p));
}

function seed(db) {
  const version = Number(db.prepare("SELECT value FROM settings WHERE key = 'seed_version'").get()?.value ?? 0);
  if (version >= SEED_VERSION) return;

  // Security states always reset to SECURE on seed/upgrade — the vulnerable
  // configuration is only ever enabled explicitly via the security API.
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('sqli_state', 'secure')").run();
  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('xss_state', 'secure')").run();

  const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (userCount === 0) {
    seedUsers(db);
    db.prepare("INSERT INTO security_logs (level, event, detail) VALUES ('INFO', 'NovaCart initialized', 'Fictional dataset seeded. Local-only environment ready.')").run();
  }

  // Catalog and reviews are refreshed to the current dataset on upgrade.
  db.exec('DELETE FROM products');
  db.exec('DELETE FROM comments');
  seedProducts(db);
  seedReviews(db);

  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('seed_version', ?)").run(String(SEED_VERSION));
}
