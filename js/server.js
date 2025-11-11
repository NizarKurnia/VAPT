// server.js
// require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();


// Built-in body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer for file uploads - VULNERABLE CONFIGURATION
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit (too high)
  fileFilter: (req, file, cb) => {
    // NO FILE TYPE VALIDATION - allows any file type
    cb(null, true);
  }
});

// CORS (dev)
app.use(cors({ origin: ['http://localhost:5500', 'http://127.0.0.1:5500'], credentials: true }));
// app.use(cors({ origin: true, credentials: true })); // alternative dev: allow all

// Simple request logger
function logReq(req, res, next) {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} ${req.ip}`);
  next();
}
app.use(logReq);

// Load data from files
function loadData() {
  try {
    const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'db', 'users.json'), 'utf8'));
    usersData.forEach(user => users[user.username] = user);
  } catch (e) {
    console.log('No users.json found, starting with empty users');
  }
  try {
    const cartsData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'db', 'carts.json'), 'utf8'));
    Object.assign(carts, cartsData);
  } catch (e) {
    console.log('No carts.json found, starting with empty carts');
  }
  try {
    const ordersData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'db', 'orders.json'), 'utf8'));
    Object.assign(orders, ordersData);
  } catch (e) {
    console.log('No orders.json found, starting with empty orders');
  }
  try {
    const promosData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'db', 'promos.json'), 'utf8'));
    Object.assign(promos, promosData);
  } catch (e) {
    console.log('No promos.json found, using default promos');
  }
}

// Save data to files
function saveData() {
  try {
    const usersArray = Object.values(users);
    fs.writeFileSync(path.join(__dirname, '..', 'db', 'users.json'), JSON.stringify(usersArray, null, 2));
    fs.writeFileSync(path.join(__dirname, '..', 'db', 'carts.json'), JSON.stringify(carts, null, 2));
    fs.writeFileSync(path.join(__dirname, '..', 'db', 'orders.json'), JSON.stringify(orders, null, 2));
    fs.writeFileSync(path.join(__dirname, '..', 'db', 'promos.json'), JSON.stringify(promos, null, 2));
  } catch (e) {
    console.error('Error saving data:', e);
  }
}

// Load data on startup
loadData();

// In-memory stores (dev only)
const users = {};         // username -> { username, password, email, joined, token? }
const tokens = {};        // token -> username
let products = [
  { id: 'p1', name: 'Classic Kebab', desc: 'Beef, lettuce, tomato, sauce', price: 6.50, image: 'img/p1.jpg' },
  { id: 'p2', name: 'Spicy Lamb Kebab', desc: 'Lamb, spicy sauce, onions', price: 7.25, image: 'img/p2.jpg' },
  { id: 'p3', name: 'Veggie Kebab', desc: 'Grilled veg, hummus, herbs', price: 5.75, image: 'img/p3.jpg' },
  { id: 'p4', name: 'Chicken Kebab', desc: 'Grilled chicken, garlic sauce, veggies', price: 6.75, image: 'img/p4.jpg' },
  { id: 'p5', name: 'Fish Kebab', desc: 'Grilled fish, lemon herb sauce, salad', price: 8.00, image: 'img/p5.jpg' },
  { id: 'p6', name: 'Beef Kebab', desc: 'Premium beef, spicy marinade, onions', price: 7.50, image: 'img/p6.jpg' },
  { id: 'p7', name: 'Turkey Kebab', desc: 'Lean turkey, yogurt sauce, herbs', price: 6.25, image: 'img/p7.jpg' },
  { id: 'p8', name: 'Mixed Kebab', desc: 'Chicken, beef, lamb mix, special sauce', price: 9.00, image: 'img/p8.jpg' }
];
const carts = {};         // username -> cart array
const orders = {};        // username -> [ orders ]
const promos = {
  'KEBAB10': { valid: true, discount: 0.10 },
  'FIRST10': { valid: true, discount: 0.10 }
};



// Helpers
function makeToken() { return crypto.randomBytes(24).toString('hex'); }

// Unified auth middleware
function requireAuth(req, res, next) {
  const h = (req.headers['authorization'] || '').trim();
  const m = h.match(/^Bearer (.+)$/);
  if (!m) return res.status(401).json({ message: 'Missing token' });
  const token = m[1];
  const username = tokens[token];
  if (!username) return res.status(401).json({ message: 'Invalid token' });
  const user = users[username];
  if (!user) return res.status(401).json({ message: 'Invalid token' });
  req.token = token;
  req.username = username;
  req.user = user;
  next();
}

// --- Endpoints ---

// GET /api/products?q=...
app.get('/api/products', (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  if (!q) return res.json(products);
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.desc || '').toLowerCase().includes(q) ||
    String(p.price).includes(q)
  );
  res.json(filtered);
});

// POST /api/cart/save  -> { ok: true }
app.post('/api/cart/save', (req, res) => {
  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  const username = tokens[token];
  const cart = Array.isArray(req.body && req.body.cart) ? req.body.cart : [];
  if (username) {
    carts[username] = cart;
    saveData();
    return res.json({ ok: true });
  } else {
    return res.json({ ok: true, note: 'saved client-side only while anonymous' });
  }
});

// POST /api/promo/verify
app.post('/api/promo/verify', requireAuth, (req, res) => {
  const code = (req.body && (req.body.code || '')).toUpperCase();
  const p = promos[code];
  if (!p || !p.valid) {
    return res.json({ valid: false, code, discount: 0 });
  }
  res.json({ valid: true, code, discount: p.discount });
});

// POST /api/promo/apply
app.post('/api/promo/apply', requireAuth, (req, res) => {
  const code = (req.body && (req.body.code || '')).toUpperCase();
  const p = promos[code];
  if (!p || !p.valid) {
    return res.json({ valid: false, code, discount: 0 });
  }
  const user = req.user;
  if (user.usedPromos.length > 0 && user.usedPromos[user.usedPromos.length - 1] === code) {
    return res.json({ valid: false, message: 'The promo code has already been used' });
  }
  user.usedPromos.push(code);
  saveData();
  res.json({ valid: true, code, discount: p.discount });
});



app.post('/api/orders', (req, res) => {
  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  const username = tokens[token];
  const id = 'ORD-' + Date.now();

  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const subtotal = items.reduce((s, i) => s + (Number(i.price || 0) * Number(i.qty || 1)), 0);

  // promo / discount
  const promoCodes = Array.isArray(req.body.promo) ? req.body.promo : [];
  let discount = 0;
  for (const code of promoCodes) {
    if (promos[code] && promos[code].valid) {
      discount += +(subtotal * promos[code].discount).toFixed(2);
    }
  }

  // total before credit
  let totalBeforeCredit = +(subtotal - discount).toFixed(2);

  // determine available user credit
  let creditApplied = 0;
  if (username && users[username]) {
    const available = Number(users[username].storeCredit || 0);
    creditApplied = Math.min(available, totalBeforeCredit);
    // apply
    totalBeforeCredit = +(totalBeforeCredit - creditApplied).toFixed(2);
    users[username].storeCredit = +(available - creditApplied).toFixed(2);
  }

  const order = {
    id,
    items,
    subtotal: +subtotal.toFixed(2),
    discount,
    creditApplied: +creditApplied.toFixed(2),
    total: totalBeforeCredit,
    status: 'received',
    created: new Date().toISOString()
  };

  if (username) {
    if (!orders[username]) orders[username] = [];
    orders[username].push(order);
    carts[username] = [];
  }

  saveData();
  return res.status(201).json({ ok: true, orderId: id, order });
});

// GET /api/orders/mine
app.get('/api/orders/mine', requireAuth, (req, res) => {
  const targetUser = req.query.user || req.username;
  res.json(orders[targetUser] || []);
});

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  const username = (req.body && req.body.username || '').trim();
  const password = (req.body && req.body.password || '').trim();
  if (!username || !password) return res.status(400).json({ message: 'username and password required' });
  if (users[username]) return res.status(400).json({ message: 'username taken' });

  // NOTE: plain password for mock only
  const user = {
    id: 'USER-' + Date.now(),
    username,
    password,
    email: `${username}@example.invalid`,
    joined: new Date().toISOString(),
    usedPromos: []
  };
  users[username] = user;
  saveData();
  return res.status(201).json({ ok: true });
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const username = (req.body && req.body.username || '').trim();
  const password = (req.body && req.body.password || '').trim();
  if (!username || !password) return res.status(400).json({ message: 'username and password required' });

  const user = users[username];
  if (!user || user.password !== password) return res.status(401).json({ message: 'Invalid credentials' });

  const token = makeToken();
  tokens[token] = username;
  user.token = token;
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, joined: user.joined } });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const u = req.user;
  res.json({
    id: u.id,
    username: u.username,
    email: u.email,
    joined: u.joined,
    photo: u.photo,
    storeCredit: typeof u.storeCredit === 'number' ? +u.storeCredit.toFixed(2) : 0
  });
});


// PUT /api/auth/me  -> update username / password
app.put('/api/auth/me', requireAuth, (req, res) => {
  const curUser = req.username;
  if (!curUser) return res.status(401).json({ message: 'not authenticated' });

  const payload = req.body || {};
  const newUsername = (payload.username || '').trim();
  const newPassword = (payload.password || '').trim();

  if (!newUsername) return res.status(400).json({ message: 'username required' });

  // if trying to change to an already-taken username
  if (newUsername !== curUser && users[newUsername]) {
    return res.status(400).json({ message: 'username already taken' });
  }

  const userObj = users[curUser];
  if (!userObj) return res.status(404).json({ message: 'user not found' });

  // update fields
  userObj.username = newUsername;
  if (newPassword) userObj.password = newPassword; // mock only

  // if username changed, move user's keyed data and update tokens mapping
  if (newUsername !== curUser) {
    // move user object
    users[newUsername] = userObj;
    delete users[curUser];

    // move carts
    if (carts[curUser]) {
      carts[newUsername] = carts[curUser];
      delete carts[curUser];
    }
    // move orders
    if (orders[curUser]) {
      orders[newUsername] = orders[curUser];
      delete orders[curUser];
    }

    // update tokens map (token -> username)
    for (const t in tokens) {
      if (tokens[t] === curUser) tokens[t] = newUsername;
    }
  }

  saveData();
  // respond without password
  const resp = Object.assign({}, userObj);
  delete resp.password;
  return res.status(200).json(resp);
});

// POST /api/auth/me/photo  -> upload profile photo (VULNERABLE)
app.post('/api/auth/me/photo', requireAuth, upload.single('photo'), (req, res) => {
  const curUser = req.username;
  if (!curUser) return res.status(401).json({ message: 'not authenticated' });

  const userObj = users[curUser];
  if (!userObj) return res.status(404).json({ message: 'user not found' });

  // VULNERABLE: No file type validation, no filename sanitization
  // Allows upload of any file type including malicious files
  if (req.file) {
    // VULNERABLE: Original filename preserved, could contain path traversal
    const originalName = req.file.originalname;
    const newPath = path.join('uploads', originalName);

    // VULNERABLE: Direct filesystem write without validation
    fs.renameSync(req.file.path, newPath);

    const photoPath = `/uploads/${originalName}`;
    userObj.photo = photoPath;
    saveData();
    return res.status(200).json({ photo: photoPath });
  } else {
    return res.status(400).json({ message: 'no photo uploaded' });
  }
});

// Debug endpoints
app.get('/api/debug/users', (req, res) => res.json(Object.keys(users)));
app.get('/api/debug/orders', (req, res) => res.json(orders));

// JSON parse error handler to avoid server crash on bad payload
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON' });
  next(err);
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Mock API running on http://localhost:${PORT}`);
});
