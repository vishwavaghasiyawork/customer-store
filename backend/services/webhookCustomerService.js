import WebhookCustomer from '../models/WebhookCustomer.js';

class WebhookCustomerService {
  async upsertCustomer(customerPayload, shopDomain) {
    const {
      id,
      email,
      phone,
      first_name,
      last_name,
      created_at,
      updated_at,
      default_address,
      addresses,
      orders_count,
      total_spent,
      tags,
    } = customerPayload;

    const doc = await WebhookCustomer.findOneAndUpdate(
      { shopifyId: id },
      {
        shopifyId: id,
        shopDomain,
        email,
        phone,
        firstName: first_name,
        lastName: last_name,
        createdAt: created_at,
        updatedAt: updated_at,
        defaultAddress: default_address,
        addresses,
        ordersCount: orders_count,
        totalSpent: total_spent,
        tags: Array.isArray(tags)
          ? tags
          : (tags || '')
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean),
      },
      { upsert: true, new: true }
    );

    console.log('Upserted customer doc:', doc);
  }

  async getCustomerByShopifyId(shopifyId) {
    return await WebhookCustomer.findOne({ shopifyId });
  }

  async getAllWebhookCustomers() {
    return await WebhookCustomer.find().sort({ createdAt: -1 });
  }
}

export default new WebhookCustomerService();
