import crypto from 'crypto';
import axios from 'axios';
import { config } from '../config/env.js';

class WebhookService {
  constructor() {
    if (!config.shopify.storeUrl) {
      throw new Error('SHOPIFY_STORE_URL is not configured');
    }
    if (!config.shopify.accessToken) {
      throw new Error('SHOPIFY_ADMIN_API_ACCESS_TOKEN is not configured');
    }

    const cleanStoreUrl = config.shopify.storeUrl
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');

    this.restBaseUrl = `https://${cleanStoreUrl}/admin/api/2025-07`;
    this.accessToken = config.shopify.accessToken;
  }

  verifyWebhook(rawBody, signature) {
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error('SHOPIFY_WEBHOOK_SECRET is not configured');
    }

    // rawBody is a Buffer from bodyParser.raw
    const digest = crypto
      .createHmac('sha256', secret) // secret = app API secret key
      .update(rawBody)
      .digest('base64');

    const hmacHeader = signature || '';

    const digestBuffer = Buffer.from(digest, 'utf8');
    const hmacBuffer = Buffer.from(hmacHeader, 'utf8');

    if (digestBuffer.length !== hmacBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(digestBuffer, hmacBuffer);
  }

  async createCustomerWebhook() {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      throw new Error(
        'BACKEND_URL is not configured. Must be public HTTPS, e.g. ngrok URL.'
      );
    }

    const url = `${this.restBaseUrl}/webhooks.json`;

    const body = {
      webhook: {
        topic: 'customers/create',
        address: `${backendUrl}/webhooks/customers/create`,
        format: 'json',
      },
    };

    try {
      const response = await axios.post(url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': this.accessToken,
        },
      });

      console.log('Webhook created:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      if (error.response) {
        console.error('HTTP status:', error.response.status);
        console.error('Response data:', error.response.data);
      } else {
        console.error('Request error:', error.message);
      }
      throw error;
    }
  }
}

export default new WebhookService();