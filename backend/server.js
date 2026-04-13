import express from 'express';
import cors from 'cors';
import { validateConfig, config } from './config/env.js';
import connectDB from './config/database.js';
import customerRoutes from './routes/customerRoutes.js';

const app = express();

try {
  validateConfig();
  console.log('Configuration validated successfully');
} catch (error) {
  console.error('Configuration error:', error.message);
  process.exit(1);
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/customers', customerRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Shopify Customer API'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

const PORT = config.server.port;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Shopify Customer API server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Customer creation: POST http://localhost:${PORT}/api/customers/create`);
    console.log(`Dummy customer: POST http://localhost:${PORT}/api/customers/create-dummy`);
    console.log(`Get all customers: GET http://localhost:${PORT}/api/customers/all`);
  });
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
