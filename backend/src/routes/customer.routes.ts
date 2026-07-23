import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createCustomerSchema,
  updateCustomerSchema,
  addNoteSchema,
} from '../validators/customer.validator';
import {
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
  addCustomerNote,
} from '../controllers/customer.controller';

const router = Router();

router.use(authenticate);

// Admin + Sales can manage customers; Warehouse/Accounts can view only
router.post('/', authorize('ADMIN', 'SALES'), validate(createCustomerSchema), asyncHandler(createCustomer));
router.get('/', asyncHandler(listCustomers));
router.get('/:id', asyncHandler(getCustomer));
router.put('/:id', authorize('ADMIN', 'SALES'), validate(updateCustomerSchema), asyncHandler(updateCustomer));
router.post('/:id/notes', authorize('ADMIN', 'SALES'), validate(addNoteSchema), asyncHandler(addCustomerNote));

export default router;
