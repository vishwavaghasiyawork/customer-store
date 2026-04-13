import { Router } from 'express';
import { createCustomerWebhook, setupWebhook } from '../controllers/webhookController.js';
import bodyParser from 'body-parser';

const router = Router();

router.post('/customers/create', bodyParser.raw({ type: 'application/json' }), createCustomerWebhook);
router.post('/setup', setupWebhook);

export default router;
