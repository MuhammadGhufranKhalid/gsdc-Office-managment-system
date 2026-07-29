import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { superAdminOnly } from '../middleware/tenant.js';
import { INDUSTRIES } from '../models/Company.js';
import {
  listCompanies, getCompany, createCompany, updateCompany,
  updateCompanyStatus, deleteCompany, listCompanyAdmins, platformStats,
} from '../controllers/superadmin.controller.js';

const router = Router();

router.use(protect, superAdminOnly);

router.get('/stats', platformStats);
router.get('/admins', listCompanyAdmins);

router.route('/companies')
  .get(listCompanies)
  .post(
    [
      body('companyName').trim().isLength({ min: 2, max: 120 }),
      body('ownerName').trim().isLength({ min: 2, max: 80 }),
      body('email').isEmail().normalizeEmail(),
      body('password').isLength({ min: 6 }),
      body('industry').optional({ values: 'falsy' }).isIn(INDUSTRIES),
      validate,
    ],
    createCompany
  );

router.route('/companies/:id')
  .get([param('id').isMongoId(), validate], getCompany)
  .put([param('id').isMongoId(), validate], updateCompany)
  .delete([param('id').isMongoId(), validate], deleteCompany);

router.patch('/companies/:id/status',
  [
    param('id').isMongoId(),
    body('action').isIn(['activate', 'deactivate', 'block', 'unblock'])
      .withMessage('action must be activate, deactivate, block or unblock'),
    body('reason').optional({ values: 'falsy' }).trim().isLength({ max: 300 }),
    validate,
  ],
  updateCompanyStatus
);

export default router;
