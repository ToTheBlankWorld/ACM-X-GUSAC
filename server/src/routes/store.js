// NovaCart storefront API — a believable shopping application.
//
// Two carefully scoped surfaces follow the security configuration
// (controlled by start.py); everything else is ALWAYS secure:
//   • POST /login               → SQL Injection module (loginDispatcher)
//   • GET/POST …/reviews        → XSS module (renderReviews contract)
// The catalog, search, and product lookup are always parameterized.
// The client UI never learns which configuration is active — it only
// receives data (and, in the vulnerable XSS contract, raw HTML).
import { Router } from 'express';
import { getDb } from '../db.js';
import { logEvent } from '../logger.js';
import { loginDispatcher } from '../vuln/sqli.js';
import { renderReviews, guardPayload, isDemoPayload } from '../vuln/xss.js';

const router = Router();

function publicUser(row) {
  return row ? { id: row.id, username: row.username, email: row.email, full_name: row.full_name, role: row.role } : null;
}

// ------------------------------------------------------------ catalog
router.get('/products', (req, res) => {
  const db = getDb();
  const q = String(req.query.q || '').slice(0, 100);
  const category = String(req.query.category || '').slice(0, 60);
  const deals = req.query.deals === '1';

  let sql = 'SELECT id, name, category, price, compare_at, icon, tint, rating, reviews_count, tagline FROM products WHERE 1=1';
  const params = [];
  if (q) {
    sql += " AND (name LIKE '%' || ? || '%' OR category LIKE '%' || ? || '%' OR description LIKE '%' || ? || '%')";
    params.push(q, q, q);
  }
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (deals) {
    sql += ' AND compare_at IS NOT NULL';
  }
  const sort = String(req.query.sort || 'featured');
  if (sort === 'price-asc') sql += ' ORDER BY price ASC';
  else if (sort === 'price-desc') sql += ' ORDER BY price DESC';
  else if (sort === 'rating') sql += ' ORDER BY rating DESC';
  else if (sort === 'new') sql += ' ORDER BY id DESC';
  else sql += ' ORDER BY reviews_count DESC';

  res.json({ products: db.prepare(sql).all(...params) });
});

router.get('/products/:id', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1 || id > 100000) {
    return res.status(400).json({ error: 'invalid_id', message: 'Invalid product id.' });
  }
  const row = db
    .prepare('SELECT id, name, category, price, compare_at, description, icon, tint, rating, reviews_count, tagline, stock FROM products WHERE id = ?')
    .get(id);
  if (!row) return res.status(404).json({ error: 'not_found', message: 'Product not found.' });
  res.json({ product: row });
});

// --------------------------------------------- reviews (XSS surface)
router.get('/products/:id/reviews', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1 || id > 100000) {
    return res.status(400).json({ error: 'invalid_id', message: 'Invalid product id.' });
  }
  const rows = db
    .prepare('SELECT id, author, rating, content, created_at FROM comments WHERE product_id = ? ORDER BY id DESC LIMIT 50')
    .all(id);
  res.json(renderReviews(rows));
});

router.post('/products/:id/reviews', (req, res) => {
  const db = getDb();
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1 || id > 100000) {
    return res.status(400).json({ error: 'invalid_id', message: 'Invalid product id.' });
  }
  const { author = 'Guest', content = '', rating = 5 } = req.body || {};
  const text = String(content).slice(0, 2000);
  if (!text.trim()) {
    return res.status(400).json({ error: 'empty_review', message: 'Please write your review before posting.' });
  }
  const ratingNum = Math.min(5, Math.max(1, Number(rating) || 5));

  const guard = guardPayload(text);
  if (!guard.allowed) {
    logEvent('WARNING', 'Review blocked by input filter', { reason: guard.reason });
    return res.status(400).json({
      error: 'review_blocked',
      message: "Your review couldn't be posted — the input filter rejected some of its content.",
    });
  }

  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
  if (!product) return res.status(404).json({ error: 'not_found', message: 'Product not found.' });

  const info = db
    .prepare('INSERT INTO comments (product_id, author, content, rating) VALUES (?, ?, ?, ?)')
    .run(id, String(author).slice(0, 60) || 'Guest', text, ratingNum);

  if (isDemoPayload(text)) {
    logEvent('WARNING', 'XSS demonstration triggered', { module: 'xss', demoPayload: true });
  } else {
    logEvent('INFO', 'Review posted', { product: id });
  }

  const row = db
    .prepare('SELECT id, author, rating, content, created_at FROM comments WHERE id = ?')
    .get(info.lastInsertRowid);
  const [rendered] = renderReviews([row]).reviews;
  res.status(201).json({ review: rendered });
});

// ------------------------------------------------ login (SQLi surface)
router.post('/login', (req, res) => {
  const result = loginDispatcher(req.body);
  if (!result.ok) {
    // Secure mode: the payload is just wrong credentials. Same page, same
    // message a real store would show — that IS the demonstration.
    return res.status(401).json({ error: 'invalid_credentials', message: "That username and password don't match our records." });
  }
  res.json({ user: publicUser(result.user) });
});

export default router;
