import orderService from '../services/orderService.js';

export const syncOrders = async (req, res) => {
  try {
    console.log('Manual order sync triggered...');
    const results = await orderService.syncOrders();
    
    res.status(200).json({
      success: true,
      data: results,
      message: 'Order sync completed successfully'
    });
  } catch (error) {
    console.error('Manual order sync failed:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to sync orders'
    });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await orderService.getAllOrders();
    
    res.status(200).json({
      success: true,
      data: orders,
      message: 'Orders retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving orders:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve orders'
    });
  }
};

export const getOrderByShopifyId = async (req, res) => {
  try {
    const { shopifyId } = req.params;
    
    if (!shopifyId) {
      return res.status(400).json({
        success: false,
        error: 'Shopify order ID is required'
      });
    }

    const order = await orderService.getOrderByShopifyId(parseInt(shopifyId));
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order,
      message: 'Order retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving order:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve order'
    });
  }
};

export const getOrdersByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const orders = await orderService.getOrdersByEmail(email);
    
    res.status(200).json({
      success: true,
      data: orders,
      message: 'Orders retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving orders by email:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve orders'
    });
  }
};
