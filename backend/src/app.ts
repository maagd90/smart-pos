import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { apiRateLimiter } from './middleware/rateLimiter';
import authRoutes from './routes/auth';
import shopRoutes from './routes/shops';
import productRoutes from './routes/products';
import customerRoutes from './routes/customers';
import transactionRoutes from './routes/transactions';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/shops', apiRateLimiter, shopRoutes);
app.use('/api/shops/:shopId/products', apiRateLimiter, productRoutes);
app.use('/api/shops/:shopId/customers', apiRateLimiter, customerRoutes);
app.use('/api/shops/:shopId/transactions', apiRateLimiter, transactionRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

export default app;
