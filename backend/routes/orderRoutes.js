import { Router } from 'express';
import { syncOrders, getAllOrders, getOrderByShopifyId, getOrdersByEmail } from '../controllers/orderController.js';

const router = Router();

// Manual order sync
router.post('/sync', syncOrders);

// Get all orders
router.get('/all', getAllOrders);

// Get order by Shopify ID
router.get('/shopify/:shopifyId', getOrderByShopifyId);

// Get orders by email
router.get('/email/:email', getOrdersByEmail);

export default router;
