import express from 'express';
import cors from 'cors';
import { validateConfig, config } from './config/env.js';
import connectDB from './config/database.js';
import customerRoutes from './routes/customerRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import cronService from './services/cronService.js';
import { rawBodyParser } from './middleware/webhookMiddleware.js';

const app = express();

try {
  validateConfig();
  console.log('Configuration validated successfully');
} catch (error) {
  console.error('Configuration error:', error.message);
  process.exit(1);
}

app.use(cors());

// 1) Webhook routes FIRST, with raw body
app.use('/webhooks', rawBodyParser, webhookRoutes);

// 2) Then global JSON/urlencoded for the rest of the app
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 3) Other routes
app.use('/api/customers', customerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Shopify Customer API',
  });
});

// 4) 404 and error handlers
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

const PORT = config.server.port;

connectDB().then(() => {
  app.listen(PORT, async () => {
    console.log(`Shopify Customer API server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    // Start cron jobs
    cronService.startAllTasks();
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});