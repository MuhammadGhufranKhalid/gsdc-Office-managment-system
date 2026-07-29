import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import { COMPANY_ADMIN_ROLES } from '../models/Employee.js';


export const superAdminOnly = (req, _res, next) => {
  if (!req.tenant?.isSuperAdmin) {
    return next(ApiError.forbidden('This area is restricted to the platform Super Admin.'));
  }
  next();
};


export const companyAdminOnly = (req, _res, next) => {
  if (req.tenant?.isSuperAdmin) {
    if (req.tenant.companyId) return next();
    return next(ApiError.forbidden(
      'Super Admin must select a company (?companyId=) to use company-admin routes.'
    ));
  }
  if (!COMPANY_ADMIN_ROLES.includes(req.user?.role)) {
    return next(ApiError.forbidden('Only a Company Admin can perform this action.'));
  }
  next();
};


export const resolveTenantScope = (req, _res, next) => {
  if (!req.tenant?.isSuperAdmin) return next();

  const requested = req.query.companyId;
  if (!requested) return next();

  if (!mongoose.isValidObjectId(requested)) {
    return next(ApiError.badRequest('Invalid companyId.'));
  }
  req.tenant.companyId = new mongoose.Types.ObjectId(requested);
  next();
};

export const requireTenantForWrite = (req, _res, next) => {
  if (!req.tenant?.companyId) {
    return next(ApiError.forbidden(
      'A company context is required for this operation. Super Admins must pass ?companyId=.'
    ));
  }
  next();
};


export const requireCompanyContext = requireTenantForWrite;
