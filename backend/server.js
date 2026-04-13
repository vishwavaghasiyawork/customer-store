import express from 'express';
import cors from 'cors';
import { validateConfig, config } from './config/env.js';
import connectDB from './config/database.js';
import customerRoutes from './routes/customerRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
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
    console.log(`Customer creation: POST http://localhost:${PORT}/api/customers/create`);
    console.log(`Dummy customer: POST http://localhost:${PORT}/api/customers/create-dummy`);
    console.log(`Get all customers: GET http://localhost:${PORT}/api/customers/all`);
    console.log(`Webhook setup: POST http://localhost:${PORT}/webhooks/setup`);
    console.log(`Customer webhook: POST http://localhost:${PORT}/webhooks/customers/create`);
    console.log(`Order sync: POST http://localhost:${PORT}/api/orders/sync`);
    console.log(`Get all orders: GET http://localhost:${PORT}/api/orders/all`);
    console.log(`Get order by ID: GET http://localhost:${PORT}/api/orders/shopify/:shopifyId`);
    console.log(`Get orders by email: GET http://localhost:${PORT}/api/orders/email/:email`);
    
    // Start cron jobs
    cronService.startAllTasks();
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});