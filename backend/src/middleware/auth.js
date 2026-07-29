import { verifyToken } from '../utils/token.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import Employee from '../models/Employee.js';
import SuperAdmin from '../models/SuperAdmin.js';
import Company from '../models/Company.js';


export const PRINCIPAL = { SUPER: 'super', COMPANY: 'company' };

const extractToken = (req) => {
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  return req.cookies?.token || null;
};


export const protect = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('Not authenticated. Please log in.');

  const decoded = verifyToken(token);

  
  if (decoded.kind === PRINCIPAL.SUPER) {
    const admin = await SuperAdmin.findById(decoded.id);
    if (!admin || !admin.isActive) {
      throw ApiError.unauthorized('Super Admin account no longer exists or is inactive.');
    }
    req.user = admin;
    req.company = null;
    req.tenant = { companyId: null, isSuperAdmin: true, role: 'Super Admin' };
    return next();
  }

  const user = await Employee.findById(decoded.id).populate('department', 'name code');
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('User no longer exists or is inactive.');
  }
  if (!user.companyId) {
    throw ApiError.forbidden('This account is not linked to a company. Please contact support.');
  }

  const company = await Company.findById(user.companyId);
  if (!company) throw ApiError.forbidden('The company for this account no longer exists.');

  if (company.status === 'Blocked') {
    throw ApiError.forbidden(
      company.blockedReason
        ? `Your company has been blocked: ${company.blockedReason}`
        : 'Your company has been blocked. Please contact the platform administrator.'
    );
  }
  if (company.status !== 'Active') {
    throw ApiError.forbidden('Your company account is currently inactive.');
  }

  req.user = user;
  req.company = company;
  req.tenant = {
    companyId: company._id,
    isSuperAdmin: false,
    role: user.role,
  };
  next();
});


export const authorize = (...roles) => (req, _res, next) => {
  if (req.tenant?.isSuperAdmin) return next();
  if (!roles.includes(req.user.role)) {
    return next(ApiError.forbidden(`Role '${req.user.role}' is not allowed to perform this action.`));
  }
  next();
};
