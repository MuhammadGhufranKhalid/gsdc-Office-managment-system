import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import {
  resolveTenantScope, companyAdminOnly, requireCompanyContext,
} from '../middleware/tenant.js';
import {
  getMyCompany, updateMyCompany, createEmployee, transferEmployees, teamMembers,
} from '../controllers/company.controller.js';

const router = Router();

router.use(protect, resolveTenantScope);

router.get('/me', requireCompanyContext, getMyCompany);

router.put('/me', companyAdminOnly, updateMyCompany);

router.post('/employees',
  companyAdminOnly,
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('designation').trim().notEmpty().withMessage('Designation is required'),
    body('gender').isIn(['Male', 'Female']).withMessage('Gender is required'),
    body('joiningDate').isISO8601().withMessage('Valid joining date required'),
    validate,
  ],
  createEmployee
);

router.post('/employees/transfer',
  companyAdminOnly,
  [
    body('employeeIds').isArray({ min: 1 }).withMessage('employeeIds must be a non-empty array'),
    body('employeeIds.*').isMongoId().withMessage('Invalid employee id'),
    body('teamId').optional({ nullable: true }).isMongoId().withMessage('Invalid team id'),
    validate,
  ],
  transferEmployees
);

router.get('/teams/:id/members',
  requireCompanyContext,
  [param('id').isMongoId(), validate],
  teamMembers
);

export default router;
