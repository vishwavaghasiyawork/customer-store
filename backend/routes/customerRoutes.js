import { Router } from 'express';
import { createCustomer, createCustomerWithDummyData, getAllCustomers } from '../controllers/customerController.js';

const router = Router();

router.post('/create', createCustomer);
router.post('/create-dummy', createCustomerWithDummyData);
router.get('/all', getAllCustomers);

export default router;
