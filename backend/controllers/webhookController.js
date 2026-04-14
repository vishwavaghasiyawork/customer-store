import webhookService from '../services/webhookService.js';
import webhookCustomerService from '../services/webhookCustomerService.js';

export const handleCustomerWebhook = async (req, res) => {
  try {
    const shopifySignature = req.headers['x-shopify-hmac-sha256'];

    if (!shopifySignature) {
      console.error('Missing Shopify signature');
      return res.status(401).json({ error: 'Missing signature' });
    }

    const topic = req.headers['x-shopify-topic']; // 'customers/create' or 'customers/update'
    const shopDomain = req.headers['x-shopify-shop-domain'];

    const rawBody = req.body; // Buffer from rawBodyParser

    console.log('Shopify Signature:', shopifySignature);
    console.log('Shopify Topic:', topic);
    console.log('Shopify Shop:', shopDomain);
    console.log('Is Buffer?', Buffer.isBuffer(rawBody));

    const isValid = webhookService.verifyWebhook(rawBody, shopifySignature);
    console.log('Signature valid?', isValid);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse JSON only after HMAC is verified
    const customerData = JSON.parse(rawBody.toString('utf8'));

    console.log(
      `Received ${topic} webhook for customer:`,
      customerData.email,
      'ID:',
      customerData.id
    );

    // This will insert on create & update on update
    await webhookCustomerService.upsertCustomer(customerData, shopDomain);

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};

export const setupCustomerWebhooks = async (req, res) => {
  try {
    const result = await webhookService.setupCustomerWebhooks();
    res.status(200).json({
      success: true,
      data: result,
      message: 'Customer webhooks created successfully',
    });
  } catch (error) {
    console.error('Webhook setup error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create webhooks',
    });
  }
};