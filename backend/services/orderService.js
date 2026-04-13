import axios from 'axios';
import { config } from '../config/env.js';
import Order from '../models/Order.js';

class OrderService {
  constructor() {
    const cleanStoreUrl = config.shopify.storeUrl
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');

    this.restBaseUrl = `https://${cleanStoreUrl}/admin/api/2026-04`;
    this.accessToken = config.shopify.accessToken;
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
          limit: 250
        }
      });

      console.log(`Fetched ${response.data.orders.length} orders from Shopify`);
      return response.data.orders;
    } catch (error) {
      console.error('Error fetching orders from Shopify:', error.response?.data || error.message);
      throw error;
    }
  }

  async upsertOrders(orders) {
    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    };

    for (const order of orders) {
      try {
        const orderData = {
          shopifyOrderId: order.id,
          admin_graphql_api_id: order.admin_graphql_api_id,
          app_id: order.app_id,
          browser_ip: order.browser_ip,
          buyer_accepts_marketing: order.buyer_accepts_marketing,
          cancel_reason: order.cancel_reason,
          cancelled_at: order.cancelled_at ? new Date(order.cancelled_at) : null,
          cart_token: order.cart_token,
          checkout_id: order.checkout_id,
          checkout_token: order.checkout_token,
          confirmation_number: order.confirmation_number,
          confirmed: order.confirmed,
          contact_email: order.contact_email,
          created_at: new Date(order.created_at),
          updated_at: new Date(order.updated_at),
          processed_at: order.processed_at ? new Date(order.processed_at) : null,
          currency: order.currency,
          financial_status: order.financial_status,
          fulfillment_status: order.fulfillment_status,
          total_price: order.total_price,
          subtotal_price: order.subtotal_price,
          total_tax: order.total_tax,
          total_weight: order.total_weight,
          order_number: order.order_number,
          name: order.name,
          email: order.email,
          phone: order.phone,
          tags: order.tags,
          note: order.note,
          token: order.token,
          test: order.test,
          customer: order.customer,
          billing_address: order.billing_address,
          shipping_address: order.shipping_address,
          line_items: order.line_items,
          shipping_lines: order.shipping_lines,
          payment_gateway_names: order.payment_gateway_names,
          discount_codes: order.discount_codes,
          discount_applications: order.discount_applications,
          tax_lines: order.tax_lines,
          fulfillments: order.fulfillments,
          refunds: order.refunds,
          current_total_price: order.current_total_price,
          current_subtotal_price: order.current_subtotal_price,
          current_total_tax: order.current_total_tax,
          current_total_discounts: order.current_total_discounts,
          total_discounts: order.total_discounts,
          total_shipping_price_set: order.total_shipping_price_set,
          current_total_price_set: order.current_total_price_set,
          current_subtotal_price_set: order.current_subtotal_price_set,
          current_total_tax_set: order.current_total_tax_set,
          current_total_discounts_set: order.current_total_discounts_set,
          subtotal_price_set: order.subtotal_price_set,
          total_price_set: order.total_price_set,
          total_tax_set: order.total_tax_set,
          total_discounts_set: order.total_discounts_set,
          total_line_items_price_set: order.total_line_items_price_set,
          total_line_items_price: order.total_line_items_price,
          total_outstanding: order.total_outstanding,
          total_tip_received: order.total_tip_received,
          total_cash_rounding_payment_adjustment_set: order.total_cash_rounding_payment_adjustment_set,
          total_cash_rounding_refund_adjustment_set: order.total_cash_rounding_refund_adjustment_set,
          order_status_url: order.order_status_url,
          landing_site: order.landing_site,
          source_name: order.source_name,
          referring_site: order.referring_site,
          source_identifier: order.source_identifier,
          source_url: order.source_url,
          device_id: order.device_id,
          location_id: order.location_id,
          reference: order.reference,
          po_number: order.po_number,
          presentment_currency: order.presentment_currency,
          customer_locale: order.customer_locale,
          estimated_taxes: order.estimated_taxes,
          taxes_included: order.taxes_included,
          duties_included: order.duties_included,
          original_total_additional_fees_set: order.original_total_additional_fees_set,
          original_total_duties_set: order.original_total_duties_set,
          current_total_additional_fees_set: order.current_total_additional_fees_set,
          current_total_duties_set: order.current_total_duties_set,
          merchant_business_entity_id: order.merchant_business_entity_id,
          merchant_of_record_app_id: order.merchant_of_record_app_id,
          user_id: order.user_id,
          payment_terms: order.payment_terms,
          note_attributes: order.note_attributes,
          client_details: order.client_details
        };

        // Use findOneAndUpdate with upsert to avoid duplicates
        const existingOrder = await Order.findOne({ shopifyOrderId: order.id });
        
        if (!existingOrder) {
          await Order.create(orderData);
          results.created++;
          console.log(`Created new order: ${order.name} (${order.email})`);
        } else {
          // Check if order was updated in Shopify
          const shopifyUpdatedAt = new Date(order.updated_at);
          const localUpdatedAt = existingOrder.updated_at;
          
          if (shopifyUpdatedAt > localUpdatedAt) {
            await Order.findOneAndUpdate(
              { shopifyOrderId: order.id },
              { ...orderData, updatedAt: new Date() },
              { new: true }
            );
            results.updated++;
            console.log(`Updated order: ${order.name} (${order.email})`);
          } else {
            results.skipped++;
            console.log(`Skipped unchanged order: ${order.name}`);
          }
        }
      } catch (error) {
        console.error(`Error processing order ${order.id}:`, error.message);
        results.errors++;
      }
    }

    return results;
  }

  async syncOrders() {
    try {
      console.log('Starting order sync from Shopify...');
      
      // Fetch orders from Shopify
      const orders = await this.fetchOrdersFromShopify();
      
      if (!orders || orders.length === 0) {
        console.log('No orders found in Shopify');
        return { created: 0, updated: 0, skipped: 0, errors: 0 };
      }

      // Upsert orders to MongoDB
      const results = await this.upsertOrders(orders);
      
      console.log(`Order sync completed:`, {
        created: results.created,
        updated: results.updated,
        skipped: results.skipped,
        errors: results.errors,
        total: orders.length
      });

      return results;
    } catch (error) {
      console.error('Order sync failed:', error.message);
      throw error;
    }
  }

  async getAllOrders() {
    try {
      return await Order.find().sort({ created_at: -1 });
    } catch (error) {
      console.error('Error fetching orders from MongoDB:', error.message);
      throw error;
    }
  }

  async getOrderByShopifyId(shopifyId) {
    try {
      return await Order.findOne({ shopifyOrderId: shopifyId });
    } catch (error) {
      console.error('Error fetching order by Shopify ID:', error.message);
      throw error;
    }
  }

  async getOrdersByEmail(email) {
    try {
      return await Order.find({ email }).sort({ created_at: -1 });
    } catch (error) {
      console.error('Error fetching orders by email:', error.message);
      throw error;
    }
  }
}

export default new OrderService();
