import { Router } from 'express';
import { login, register, me } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { loginSchema, registerSchema } from '../validators/auth.validator';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// POST /auth/login - all roles
router.post('/login', validate(loginSchema), asyncHandler(login));

// POST /auth/register - Admin only, creates users for any role
router.post('/register', authenticate, authorize('ADMIN'), validate(registerSchema), asyncHandler(register));

// GET /auth/me - current logged-in user
router.get('/me', authenticate, asyncHandler(me));

export default router;
