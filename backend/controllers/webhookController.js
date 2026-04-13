import webhookService from '../services/webhookService.js';
import webhookCustomerService from '../services/webhookCustomerService.js';

export const createCustomerWebhook = async (req, res) => {
  try {
    const shopifySignature = req.headers['x-shopify-hmac-sha256'];
    
    if (!shopifySignature) {
      console.error('Missing Shopify signature');
      return res.status(401).json({ error: 'Missing signature' });
    }

    console.log('Shopify Signature:', shopifySignature);

    const body = JSON.stringify(req.body);
    const isValid = webhookService.verifyWebhook(body, shopifySignature);
    console.log(isValid);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const customerData = req.body;
    console.log('Received customer webhook:', customerData.email);

    await webhookCustomerService.upsertCustomer(customerData);

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

export const setupWebhook = async (req, res) => {
  try {
    const result = await webhookService.createCustomerWebhook();
    res.status(200).json({
      success: true,
      data: result,
      message: 'Customer webhook created successfully',
    });
  } catch (error) {
    console.error('Webhook setup error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create webhook',
    });
  }
};