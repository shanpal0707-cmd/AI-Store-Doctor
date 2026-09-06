require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const cookieParser = require('cookie-parser');

const { connectDB, getDBStatus } = require('./db/connection');

const analyzeRouter  = require('./routes/analyze');
const contentRouter  = require('./routes/content');
const marketRouter   = require('./routes/market');
const authRouter     = require('./routes/auth');
const storeRouter    = require('./routes/store');
const productsRouter = require('./routes/products');

const app  = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors({
  origin:      'http://localhost:4200',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// ============================================================
// ROUTES
// ============================================================

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'AI Store Doctor Backend' });
});

app.get('/api/db-health', (req, res) => {
  const db = getDBStatus();
  const httpStatus = db.connected ? 200 : 503;
  res.status(httpStatus).json({
    status:   db.connected ? 'ok' : 'unavailable',
    database: db.state,
    name:     db.database
  });
});

app.use('/api/auth',authRouter);
app.use('/api/store',storeRouter);
app.use('/api/products',productsRouter);
app.use('/api/analyze',analyzeRouter);
app.use('/api/content', contentRouter);
app.use('/api/market-intelligence', marketRouter);

// ============================================================
// 404 FALLBACK
// ============================================================

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ============================================================
// START SERVER
// ============================================================

async function startServer() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`\nAI Store Doctor backend running on http://localhost:${PORT}`);
    console.log(`\nAI Store Doctor backend running on http://localhost:${PORT}`);
console.log(`  GET  http://localhost:${PORT}/api/health`);
console.log(`  GET  http://localhost:${PORT}/api/db-health`);
console.log(`  POST http://localhost:${PORT}/api/auth/signup`);
console.log(`  POST http://localhost:${PORT}/api/auth/login`);
console.log(`  POST http://localhost:${PORT}/api/auth/logout`);
console.log(`  GET  http://localhost:${PORT}/api/auth/me`);
console.log(`  GET  http://localhost:${PORT}/api/store`);
console.log(`  PUT  http://localhost:${PORT}/api/store`);
console.log(`  GET  http://localhost:${PORT}/api/products`);
console.log(`  POST http://localhost:${PORT}/api/products`);
console.log(`  DEL  http://localhost:${PORT}/api/products/:id`);
console.log(`  POST http://localhost:${PORT}/api/analyze`);
console.log(`  POST http://localhost:${PORT}/api/content`);
console.log(`  POST http://localhost:${PORT}/api/market-intelligence`);
  });
}

startServer();
