import Customer from '../models/Customer.js';

class CustomerService {
  async createCustomerInMongo(shopifyCustomer) {
    try {
      const customerData = {
        shopifyCustomerId: shopifyCustomer.id,
        firstName: shopifyCustomer.firstName,
        lastName: shopifyCustomer.lastName,
        email: shopifyCustomer.defaultEmailAddress?.emailAddress,
        phone: shopifyCustomer.defaultPhoneNumber?.phoneNumber,
        tags: shopifyCustomer.tags || [],
        addresses: shopifyCustomer.addresses || [],
        emailMarketingConsent: {
          marketingState: shopifyCustomer.emailMarketingConsent?.marketingState,
          marketingOptInLevel: shopifyCustomer.emailMarketingConsent?.marketingOptInLevel
        }
      };

      const customer = await Customer.create(customerData);
      
      console.log(`Customer synced to MongoDB: ${customer.email}`);
      return customer;
    } catch (error) {
      console.error('Error syncing customer to MongoDB:', error);
      throw error;
    }
  }

  async getCustomerByEmail(email) {
    return await Customer.findOne({ email });
  }

  async getCustomerByShopifyId(shopifyId) {
    return await Customer.findOne({ shopifyCustomerId: shopifyId });
  }

  async getAllCustomers() {
    return await Customer.find().sort({ createdAt: -1 });
  }
}

export default new CustomerService();
