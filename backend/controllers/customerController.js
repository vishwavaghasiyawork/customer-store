import shopifyService from '../services/shopifyService.js';
import customerService from '../services/customerService.js';

export const createCustomer = async (req, res) => {
  try {
    const { input } = req.body;

    if (!input) {
      return res.status(400).json({
        success: false,
        error: 'Missing customer input data'
      });
    }

    if (!input.email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    if (!input.firstName || !input.lastName) {
      return res.status(400).json({
        success: false,
        error: 'First name and last name are required'
      });
    }

    let customer;
    try {
      customer = await shopifyService.createCustomer(input);
      await customerService.createCustomerInMongo(customer);
    } catch (mongoError) {
      console.error('Failed to sync to MongoDB, but Shopify creation succeeded:', mongoError);
    }

    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully and synced to MongoDB'
    });
  } catch (error) {
    console.error('Error creating customer:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create customer'
    });
  }
};

export const createCustomerWithDummyData = async (req, res) => {
  try {
    const dummyCustomer = {
    "firstName": "Vishwa",
    "lastName": "Vaghasiya",
    "email": "vishwa.vaghhasiya@example.com",
    "phone": "+919909981051",
    "tags": ["test", "auto-generated"],
    "addresses": [
      {
        "address1": "123 Main Street",
        "city": "New York",
        "province": "NY",
        "zip": "10001",
        "country": "United States",
        "firstName": "Vishwa",
        "lastName": "Vaghasiya",
        "phone": "+15551234"
      }
    ],
    "emailMarketingConsent": {
      "marketingState": "SUBSCRIBED",
      "marketingOptInLevel": "CONFIRMED_OPT_IN"
    }
    }

  const customer = await shopifyService.createCustomer(dummyCustomer);
  try {
      await customerService.createCustomerInMongo(customer);
    } catch (mongoError) {
      console.error('Failed to sync to MongoDB, but Shopify creation succeeded:', mongoError);
    }

    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully with dummy data and synced to MongoDB'
    });
  } catch (error) {
    console.error('Error creating customer with dummy data:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create customer'
    });
  }
};

export const getAllCustomers = async (req, res) => {
  try {
    const customers = await customerService.getAllCustomers();
    
    res.status(200).json({
      success: true,
      data: customers,
      message: 'Customers retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving customers:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve customers'
    });
  }
};
