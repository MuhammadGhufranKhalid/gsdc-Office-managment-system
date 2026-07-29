import { Router } from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { INDUSTRIES } from '../models/Company.js';
import {
  login, superAdminLogin, registerCompany, logout, me,
} from '../controllers/auth.controller.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

const credentials = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
  validate,
];

router.post('/login', authLimiter, credentials, login);

router.post('/super-admin/login', authLimiter, credentials, superAdminLogin);

router.post('/register-company',
  authLimiter,
  [
    body('companyName').trim().isLength({ min: 2, max: 120 })
      .withMessage('Company name must be 2-120 characters'),
    body('ownerName').trim().isLength({ min: 2, max: 80 })
      .withMessage('Owner name must be 2-80 characters'),
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('phone').optional({ values: 'falsy' }).trim()
      .isLength({ min: 7, max: 20 }).withMessage('Enter a valid phone number'),
    body('address').optional({ values: 'falsy' }).trim().isLength({ max: 250 }),
    body('industry').optional({ values: 'falsy' }).isIn(INDUSTRIES)
      .withMessage('Unknown industry'),
    body('logo').optional({ values: 'falsy' }).trim().isLength({ max: 500 }),
    body('website').optional({ values: 'falsy' }).trim().isLength({ max: 200 }),
    validate,
  ],
  registerCompany
);

router.post('/logout', logout);
router.get('/me', protect, me);

export default router;
