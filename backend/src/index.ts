import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import productsRouter from './routes/products';
import customersRouter from './routes/customers';
import salesRouter from './routes/sales';
import messagesRouter from './routes/messages';
import aiRouter from './routes/ai';

const app = express();
const PORT = process.env.PORT || 3001;

// General API rate limiter: 200 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Stricter limiter for AI endpoints (calls OpenAI and is more expensive)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many AI requests, please try again later.' },
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/products', apiLimiter, productsRouter);
app.use('/api/customers', apiLimiter, customersRouter);
app.use('/api/sales', apiLimiter, salesRouter);
app.use('/api/messages', apiLimiter, messagesRouter);
app.use('/api/ai', aiLimiter, aiRouter);

app.get('/api/dashboard/stats', (_req, res) => {
  res.redirect('/api/sales/stats/dashboard');
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Smart POS Server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   API:    http://localhost:${PORT}/api`);
});

export default app;
