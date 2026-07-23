import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import {
  createProductSchema,
  updateProductSchema,
  stockMovementSchema,
} from '../validators/product.validator';
import {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  recordStockMovement,
} from '../controllers/product.controller';

const router = Router();

router.use(authenticate);

// Admin + Warehouse manage products & stock; Sales/Accounts can view only
router.post('/', authorize('ADMIN', 'WAREHOUSE'), validate(createProductSchema), asyncHandler(createProduct));
router.get('/', asyncHandler(listProducts));
router.get('/:id', asyncHandler(getProduct));
router.put('/:id', authorize('ADMIN', 'WAREHOUSE'), validate(updateProductSchema), asyncHandler(updateProduct));
router.post(
  '/:id/stock-movements',
  authorize('ADMIN', 'WAREHOUSE'),
  validate(stockMovementSchema),
  asyncHandler(recordStockMovement)
);

export default router;
