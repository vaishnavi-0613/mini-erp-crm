import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { createChallanSchema, updateChallanStatusSchema } from '../validators/challan.validator';
import {
  createChallan,
  listChallans,
  getChallan,
  updateChallanStatus,
} from '../controllers/challan.controller';

const router = Router();

router.use(authenticate);

// Admin + Sales create challans; Warehouse can confirm/cancel (stock impact); Accounts view only
router.post('/', authorize('ADMIN', 'SALES'), validate(createChallanSchema), asyncHandler(createChallan));
router.get('/', asyncHandler(listChallans));
router.get('/:id', asyncHandler(getChallan));
router.patch(
  '/:id/status',
  authorize('ADMIN', 'SALES', 'WAREHOUSE'),
  validate(updateChallanStatusSchema),
  asyncHandler(updateChallanStatus)
);

export default router;
