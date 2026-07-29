import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { signToken } from '../utils/token.js';
import { PRINCIPAL } from '../middleware/auth.js';
import { provisionCompany } from '../services/company.service.js';
import Employee from '../models/Employee.js';
import SuperAdmin from '../models/SuperAdmin.js';
import Company from '../models/Company.js';

const cookieOpts = {
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const publicCompany = (c) => (c ? {
  _id: c._id,
  companyCode: c.companyCode,
  name: c.name,
  slug: c.slug,
  logo: c.logo,
  industry: c.industry,
  status: c.status,
} : null);

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await Employee.findOne({ email: email?.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password.');
  }
  if (!user.isActive) throw ApiError.forbidden('Your account is inactive.');

  const company = user.companyId ? await Company.findById(user.companyId) : null;
  if (!company) {
    throw ApiError.forbidden('This account is not linked to an active company.');
  }
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

  const token = signToken({
    id: user._id,
    role: user.role,
    companyId: company._id,
    kind: PRINCIPAL.COMPANY,
  });

  user.password = undefined;
  res.cookie('token', token, cookieOpts);
  return sendSuccess(res, {
    message: 'Logged in',
    data: { token, user, company: publicCompany(company), scope: 'company' },
  });
});


export const superAdminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await SuperAdmin.findOne({ email: email?.toLowerCase() }).select('+password');
  if (!admin || !(await admin.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password.');
  }
  if (!admin.isActive) throw ApiError.forbidden('This Super Admin account is inactive.');

  admin.lastLoginAt = new Date();
  await admin.save({ validateBeforeSave: false });

  const token = signToken({
    id: admin._id,
    role: 'Super Admin',
    companyId: null,
    kind: PRINCIPAL.SUPER,
  });

  admin.password = undefined;
  res.cookie('token', token, cookieOpts);
  return sendSuccess(res, {
    message: 'Logged in as Super Admin',
    data: { token, user: admin, company: null, scope: 'super' },
  });
});


export const registerCompany = asyncHandler(async (req, res) => {
  const { company, admin } = await provisionCompany({
    companyName: req.body.companyName,
    ownerName: req.body.ownerName,
    email: req.body.email,
    password: req.body.password,
    phone: req.body.phone,
    address: req.body.address,
    industry: req.body.industry,
    logo: req.body.logo,
    website: req.body.website,
  });

  const token = signToken({
    id: admin._id,
    role: admin.role,
    companyId: company._id,
    kind: PRINCIPAL.COMPANY,
  });

  admin.password = undefined;
  res.cookie('token', token, cookieOpts);
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Company registered successfully',
    data: { token, user: admin, company: publicCompany(company), scope: 'company' },
  });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie('token');
  return sendSuccess(res, { message: 'Logged out' });
});

/** Returns the current principal plus its tenant context. */
export const me = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    data: {
      user: req.user,
      company: publicCompany(req.company),
      scope: req.tenant?.isSuperAdmin ? 'super' : 'company',
    },
  })
);
