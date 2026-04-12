import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import productsRouter from './routes/products';
import customersRouter from './routes/customers';
import salesRouter from './routes/sales';
import messagesRouter from './routes/messages';
import aiRouter from './routes/ai';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/products', productsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/sales', salesRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/ai', aiRouter);

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
