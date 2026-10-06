require('dotenv').config();

const express = require('express');
const cors = require('cors');
const reviewRoutes = require('./routes/review');
const repoPrsRoutes = require('./routes/repoPrs');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ──────────────────────────────────────────────
app.use(
  cors({
    origin: [
      'http://localhost:5173', // Vite default
      'http://localhost:5174', // Vite fallback
      'http://localhost:3000', // Common React dev port
    ],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);

app.use(express.json());

// ─── Request logging (lightweight) ─────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`
    );
  });
  next();
});

// ─── Routes ─────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/review', reviewRoutes);
app.use('/api/repo-prs', repoPrsRoutes);

// ─── Global error handler ──────────────────────────────────
app.use(errorHandler);

// ─── Start server ──────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 PR Reviewer Backend running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Review endpoint: POST http://localhost:${PORT}/api/review\n`);

  if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️  GEMINI_API_KEY not set — AI analysis will fail.');
    console.warn('   Copy .env.example to .env and add your Gemini API key.');
    console.warn('   Get one at: https://aistudio.google.com/apikey\n');
  }

  if (!process.env.GITHUB_TOKEN) {
    console.warn('ℹ️  GITHUB_TOKEN not set — using unauthenticated GitHub API (60 req/hr limit).');
    console.warn('   Add a GitHub PAT to .env for higher rate limits (5000 req/hr).\n');
  }
});

module.exports = app;
