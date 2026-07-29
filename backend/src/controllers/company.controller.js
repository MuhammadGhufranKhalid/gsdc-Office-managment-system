import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { nextEmployeeId } from '../services/company.service.js';
import Company from '../models/Company.js';
import Employee from '../models/Employee.js';
import Team from '../models/Team.js';


export const getMyCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.tenant.companyId)
    .populate('admin', 'fullName email avatar');
  if (!company) throw ApiError.notFound('Company not found');
  return sendSuccess(res, { data: company });
});


export const updateMyCompany = asyncHandler(async (req, res) => {
  const allowed = ['name', 'ownerName', 'phone', 'address', 'industry', 'logo', 'website'];
  const payload = {};
  allowed.forEach((k) => { if (req.body[k] !== undefined) payload[k] = req.body[k]; });

  const company = await Company.findByIdAndUpdate(req.tenant.companyId, payload, {
    new: true, runValidators: true,
  });
  if (!company) throw ApiError.notFound('Company not found');
  return sendSuccess(res, { message: 'Company profile updated', data: company });
});


export const createEmployee = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.tenant.companyId);
  if (!company) throw ApiError.notFound('Company not found');

  const payload = { ...req.body };
  delete payload.companyId;
  payload.companyId = company._id;

  if (!payload.employeeId) payload.employeeId = await nextEmployeeId(company);
  if (!payload.cardNumber) payload.cardNumber = `${company.companyCode}-${payload.employeeId.split('-').pop()}`;
  if (!payload.fullName) {
    payload.fullName = [payload.firstName, payload.lastName].filter(Boolean).join(' ');
  }
  if (!payload.avatar && payload.fullName) {
    payload.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.fullName)}&background=2563EB&color=fff`;
  }


  if (payload.team) {
    const team = await Team.findOne({ _id: payload.team, companyId: company._id });
    if (!team) throw ApiError.badRequest('Selected team does not belong to your company.');
  }

  const employee = await Employee.create(payload);
  if (payload.team) {
    await Team.updateOne(
      { _id: payload.team, companyId: company._id },
      { $addToSet: { members: employee._id }, $inc: { headcount: 1 } }
    );
  }

  employee.password = undefined;
  return sendSuccess(res, { statusCode: 201, message: 'Employee created', data: employee });
});


export const transferEmployees = asyncHandler(async (req, res) => {
  const companyId = req.tenant.companyId;
  const { employeeIds, teamId } = req.body;

  if (!Array.isArray(employeeIds) || !employeeIds.length) {
    throw ApiError.badRequest('employeeIds must be a non-empty array.');
  }

  const employees = await Employee.find({ _id: { $in: employeeIds }, companyId }).select('_id team');
  if (employees.length !== new Set(employeeIds.map(String)).size) {
    throw ApiError.badRequest('One or more employees were not found in your company.');
  }

  let target = null;
  if (teamId) {
    target = await Team.findOne({ _id: teamId, companyId });
    if (!target) throw ApiError.badRequest('Target team does not belong to your company.');
  }

  const ids = employees.map((e) => e._id);


  await Team.updateMany(
    { companyId, members: { $in: ids } },
    { $pull: { members: { $in: ids } } }
  );
  await Employee.updateMany({ _id: { $in: ids }, companyId }, { team: teamId || null });
  if (target) {
    await Team.updateOne({ _id: target._id }, { $addToSet: { members: { $each: ids } } });
  }

  const teams = await Team.find({ companyId }).select('_id members');
  await Promise.all(teams.map((t) =>
    Team.updateOne({ _id: t._id }, { headcount: t.members.length })
  ));

  return sendSuccess(res, {
    message: target
      ? `${ids.length} employee(s) transferred to ${target.name}`
      : `${ids.length} employee(s) removed from their team`,
    data: { moved: ids.length, teamId: teamId || null },
  });
});


export const teamMembers = asyncHandler(async (req, res) => {
  const companyId = req.tenant.companyId;
  const team = await Team.findOne({ _id: req.params.id, companyId });
  if (!team) throw ApiError.notFound('Team not found');

  const members = await Employee.find({ companyId, team: team._id })
    .select('fullName email avatar designation role status employeeId')
    .sort('fullName');

  return sendSuccess(res, { data: { team, members } });
});
