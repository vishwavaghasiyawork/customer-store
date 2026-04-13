import webhookService from '../services/webhookService.js';
import { config } from '../config/env.js';

const setupWebhook = async () => {
  try {
    console.log('Setting up Shopify customer webhook...');
    await webhookService.createCustomerWebhook();
    console.log('✅ Webhook setup completed successfully!');
  } catch (error) {
    console.error('❌ Webhook setup failed:', error.message);
    process.exit(1);
  }
};

setupWebhook();
