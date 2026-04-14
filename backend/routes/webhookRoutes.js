import { Router } from 'express';
import { handleCustomerWebhook, setupCustomerWebhooks } from '../controllers/webhookController.js';
import bodyParser from 'body-parser';

const router = Router();

router.post('/customers/create', bodyParser.raw({ type: 'application/json' }), handleCustomerWebhook);
router.post('/setup', setupCustomerWebhooks);

export default router;
