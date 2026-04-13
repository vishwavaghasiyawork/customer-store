import WebhookCustomer from '../models/WebhookCustomer.js';

class WebhookCustomerService {
  async upsertCustomer(customerData) {
    try {
      const customerPayload = {
        shopifyId: customerData.id.toString(),
        email: customerData.email,
        firstName: customerData.first_name,
        lastName: customerData.last_name,
        phone: customerData.phone,
        addresses: customerData.addresses || [],
        ordersCount: customerData.orders_count || 0,
        totalSpent: parseFloat(customerData.total_spent) || 0,
        tags: customerData.tags ? customerData.tags.split(', ') : []
      };

      const customer = await WebhookCustomer.findOneAndUpdate(
        { shopifyId: customerPayload.shopifyId },
        customerPayload,
        { 
          upsert: true, 
          new: true, 
          runValidators: true 
        }
      );

      console.log(`Customer upserted: ${customer.email}`);
      return customer;
    } catch (error) {
      console.error('Error upserting customer:', error);
      throw error;
    }
  }

  async getCustomerByShopifyId(shopifyId) {
    return await WebhookCustomer.findOne({ shopifyId });
  }

  async getAllWebhookCustomers() {
    return await WebhookCustomer.find().sort({ createdAt: -1 });
  }
}

export default new WebhookCustomerService();
