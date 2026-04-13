import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { config } from '../config/env.js';

class CsvOrderSyncService {
  constructor() {
    const cleanStoreUrl = config.shopify.storeUrl
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');

    this.restBaseUrl = `https://${cleanStoreUrl}/admin/api/2026-04`;
    this.accessToken = config.shopify.accessToken;
    this.csvFilePath = path.join(process.cwd(), 'data', 'orders.csv');
    
    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Initialize CSV file with headers if it doesn't exist
    this.initializeCsvFile();
  }

  initializeCsvFile() {
    if (!fs.existsSync(this.csvFilePath)) {
      const headers = [
        'shopifyOrderId',
        'orderNumber',
        'orderName',
        'customerEmail',
        'customerFirstName',
        'customerLastName',
        'customerPhone',
        'orderDate',
        'financialStatus',
        'fulfillmentStatus',
        'currency',
        'totalPrice',
        'subtotalPrice',
        'totalTax',
        'shippingPrice',
        'totalDiscount',
        'paymentMethods',
        'billingAddress',
        'shippingAddress',
        'lineItemsCount',
        'productNames',
        'productSKUs',
        'productQuantities',
        'productPrices',
        'tags',
        'createdAt',
        'updatedAt',
        'lastSyncedAt'
      ];
      
      fs.writeFileSync(this.csvFilePath, headers.join(',') + '\n', 'utf8');
      console.log('CSV file initialized with headers');
    }
  }

  async fetchOrdersFromShopify() {
    try {
      const url = `${this.restBaseUrl}/orders.json`;
      
      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': this.accessToken,
        },
        params: {
          status: 'any',
          limit: 250,
          updated_at_min: this.getLastSyncTime() // Only get orders updated since last sync
        }
      });

      console.log(`Fetched ${response.data.orders.length} orders from Shopify`);
      return response.data.orders;
    } catch (error) {
      console.error('Error fetching orders from Shopify:', error.response?.data || error.message);
      throw error;
    }
  }

  getLastSyncTime() {
    try {
      if (!fs.existsSync(this.csvFilePath)) {
        return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago if file doesn't exist
      }
      
      const data = fs.readFileSync(this.csvFilePath, 'utf8');
      const lines = data.trim().split('\n');
      
      if (lines.length <= 1) {
        return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago if only headers
      }
      
      // Get last line and extract lastSyncedAt
      const lastLine = lines[lines.length - 1];
      const fields = lastLine.split(',');
      const lastSyncedAt = fields[fields.length - 1].replace(/"/g, '');
      
      if (lastSyncedAt && lastSyncedAt !== 'lastSyncedAt') {
        return new Date(lastSyncedAt).toISOString();
      }
      
      return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    } catch (error) {
      console.error('Error getting last sync time:', error.message);
      return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    }
  }

  formatOrderForCsv(order) {
    const customerName = `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim();
    const billingAddress = this.formatAddress(order.billing_address);
    const shippingAddress = this.formatAddress(order.shipping_address);
    const productNames = order.line_items?.map(item => `"${item.name}"`).join(';') || '';
    const productSKUs = order.line_items?.map(item => item.sku || '').join(';') || '';
    const productQuantities = order.line_items?.map(item => item.quantity).join(';') || '';
    const productPrices = order.line_items?.map(item => item.price).join(';') || '';
    const paymentMethods = order.payment_gateway_names?.join(';') || '';
    const shippingPrice = order.shipping_lines?.[0]?.price || '0';

    return [
      order.id || '',
      order.order_number || '',
      `"${order.name || ''}"`,
      `"${order.email || ''}"`,
      `"${order.customer?.first_name || ''}"`,
      `"${order.customer?.last_name || ''}"`,
      `"${order.phone || ''}"`,
      `"${this.formatDate(order.created_at)}"`,
      `"${order.financial_status || ''}"`,
      `"${order.fulfillment_status || ''}"`,
      order.currency || '',
      order.total_price || '0',
      order.subtotal_price || '0',
      order.total_tax || '0',
      shippingPrice,
      order.total_discounts || '0',
      `"${paymentMethods}"`,
      `"${billingAddress}"`,
      `"${shippingAddress}"`,
      order.line_items?.length || 0,
      productNames,
      productSKUs,
      productQuantities,
      productPrices,
      `"${order.tags || ''}"`,
      `"${this.formatDate(order.created_at)}"`,
      `"${this.formatDate(order.updated_at)}"`,
      `"${new Date().toISOString()}"`
    ].join(',');
  }

  formatAddress(address) {
    if (!address) return '';
    
    const parts = [
      address.first_name,
      address.last_name,
      address.company,
      address.address1,
      address.address2,
      address.city,
      address.province,
      address.country,
      address.zip,
      address.phone
    ].filter(Boolean);

    return parts.join(', ').replace(/"/g, '""');
  }

  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  async syncOrders() {
    try {
      console.log('Starting CSV order sync from Shopify...');
      
      // Fetch orders from Shopify
      const orders = await this.fetchOrdersFromShopify();
      
      if (!orders || orders.length === 0) {
        console.log('No new/updated orders found in Shopify');
        return { created: 0, updated: 0, skipped: 0, errors: 0 };
      }

      // Read existing CSV data
      let existingData = [];
      if (fs.existsSync(this.csvFilePath)) {
        const data = fs.readFileSync(this.csvFilePath, 'utf8');
        existingData = data.trim().split('\n');
      }

      const headers = existingData[0] || '';
      const existingOrders = new Map();
      
      // Parse existing orders (skip header)
      for (let i = 1; i < existingData.length; i++) {
        const line = existingData[i];
        const fields = line.split(',');
        const shopifyOrderId = fields[0];
        if (shopifyOrderId) {
          existingOrders.set(shopifyOrderId, {
            lineIndex: i,
            updatedAt: fields[fields.length - 2].replace(/"/g, '')
          });
        }
      }

      const results = { created: 0, updated: 0, skipped: 0, errors: 0 };
      const updatedLines = [headers]; // Start with headers

      // Process existing orders (keep them unchanged)
      for (let i = 1; i < existingData.length; i++) {
        const line = existingData[i];
        const fields = line.split(',');
        const shopifyOrderId = fields[0];
        
        // Check if this order needs updating
        const shopifyOrder = orders.find(o => o.id == shopifyOrderId);
        
        if (shopifyOrder) {
          const shopifyUpdatedAt = new Date(shopifyOrder.updated_at);
          const localUpdatedAt = new Date(fields[fields.length - 2].replace(/"/g, ''));
          
          if (shopifyUpdatedAt > localUpdatedAt) {
            // Update this order
            updatedLines.push(this.formatOrderForCsv(shopifyOrder));
            results.updated++;
            console.log(`Updated order: ${shopifyOrder.name}`);
          } else {
            // Keep existing order
            updatedLines.push(line);
            results.skipped++;
          }
          
          // Remove from new orders list
          orders.splice(orders.findIndex(o => o.id == shopifyOrderId), 1);
        } else {
          // Keep existing order
          updatedLines.push(line);
        }
      }

      // Add new orders
      orders.forEach(order => {
        try {
          updatedLines.push(this.formatOrderForCsv(order));
          results.created++;
          console.log(`Created new order: ${order.name}`);
        } catch (error) {
          console.error(`Error processing order ${order.id}:`, error.message);
          results.errors++;
        }
      });

      // Write updated data back to CSV
      fs.writeFileSync(this.csvFilePath, updatedLines.join('\n'), 'utf8');
      
      console.log(`CSV order sync completed:`, {
        created: results.created,
        updated: results.updated,
        skipped: results.skipped,
        errors: results.errors,
        total: orders.length + existingOrders.size
      });

      return results;
    } catch (error) {
      console.error('CSV order sync failed:', error.message);
      throw error;
    }
  }

  readOrdersFromCsv() {
    try {
      if (!fs.existsSync(this.csvFilePath)) {
        return [];
      }

      const data = fs.readFileSync(this.csvFilePath, 'utf8');
      const lines = data.trim().split('\n');
      
      if (lines.length <= 1) {
        return [];
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
      const orders = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = this.parseCsvLine(line);
        
        if (values.length === headers.length) {
          const order = {};
          headers.forEach((header, index) => {
            order[header] = values[index];
          });
          orders.push(order);
        }
      }

      return orders;
    } catch (error) {
      console.error('Error reading orders from CSV:', error.message);
      return [];
    }
  }

  parseCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  filterOrders(orders, filters) {
    return orders.filter(order => {
      // Date filtering
      if (filters.startDate && order.orderDate) {
        const orderDate = new Date(order.orderDate);
        const filterDate = new Date(filters.startDate);
        if (orderDate < filterDate) return false;
      }
      
      if (filters.endDate && order.orderDate) {
        const orderDate = new Date(order.orderDate);
        const filterDate = new Date(filters.endDate);
        if (orderDate > filterDate) return false;
      }
      
      // Status filtering
      if (filters.financialStatus && order.financialStatus !== filters.financialStatus) {
        return false;
      }
      
      if (filters.fulfillmentStatus && order.fulfillmentStatus !== filters.fulfillmentStatus) {
        return false;
      }
      
      // Email filtering
      if (filters.customerEmail && order.customerEmail) {
        if (!order.customerEmail.toLowerCase().includes(filters.customerEmail.toLowerCase())) {
          return false;
        }
      }
      
      // Order number filtering
      if (filters.orderNumber && order.orderNumber) {
        if (!order.orderNumber.includes(filters.orderNumber)) {
          return false;
        }
      }
      
      // Currency filtering
      if (filters.currency && order.currency !== filters.currency) {
        return false;
      }
      
      // Tags filtering
      if (filters.tags && order.tags) {
        if (!order.tags.toLowerCase().includes(filters.tags.toLowerCase())) {
          return false;
        }
      }
      
      return true;
    });
  }
}

export default new CsvOrderSyncService();
