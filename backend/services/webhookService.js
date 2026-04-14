// services/webhookService.js
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

    const digest = crypto
      .createHmac('sha256', secret)
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

  async createWebhook(topic) {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      throw new Error(
        'BACKEND_URL is not configured. Must be public HTTPS (e.g., ngrok URL).'
      );
    }

    const url = `${this.restBaseUrl}/webhooks.json`;
    const body = {
      webhook: {
        topic, // e.g. 'customers/create' or 'customers/update'
        address: `${backendUrl}/webhooks/customers`, // single endpoint for both
        format: 'json',
      },
    };

    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.accessToken,
      },
    });

    return response.data;
  }

  async setupCustomerWebhooks() {
    const topics = ['customers/create', 'customers/update'];

    const results = [];
    for (const topic of topics) {
      try {
        const data = await this.createWebhook(topic);
        console.log(`Webhook created for ${topic}:`, JSON.stringify(data, null, 2));
        results.push({ topic, ok: true, data });
      } catch (error) {
        console.error(`Error creating webhook for ${topic}:`, error.response?.data || error.message);
        results.push({ topic, ok: false, error: error.response?.data || error.message });
      }
    }

    return results;
  }
}

export default new WebhookService();