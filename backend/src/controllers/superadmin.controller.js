import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { COMPANY_ADMIN_ROLES } from '../models/Employee.js';

import Company from '../models/Company.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Team from '../models/Team.js';
import Project from '../models/Project.js';
import Client from '../models/Client.js';
import Task from '../models/Task.js';
import Milestone from '../models/Milestone.js';
import TimeLog from '../models/TimeLog.js';
import Comment from '../models/Comment.js';
import ActivityLog from '../models/ActivityLog.js';
import Attendance from '../models/Attendance.js';
import Leave from '../models/Leave.js';
import Payroll from '../models/Payroll.js';
import Contract from '../models/Contract.js';
import Meeting from '../models/Meeting.js';
import Asset from '../models/Asset.js';
import Notification from '../models/Notification.js';


const TENANT_COLLECTIONS = [
  Employee, Department, Team, Project, Client, Task, Milestone, TimeLog,
  Comment, ActivityLog, Attendance, Leave, Payroll, Contract, Meeting,
  Asset, Notification,
];

export const listCompanies = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.industry) filter.industry = req.query.industry;
  if (req.query.search) {
    const rx = new RegExp(req.query.search.trim(), 'i');
    filter.$or = [{ name: rx }, { ownerName: rx }, { email: rx }, { companyCode: rx }];
  }

  const [companies, total] = await Promise.all([
    Company.find(filter)
      .populate('admin', 'fullName email avatar role')
      .sort(req.query.sort || '-createdAt')
      .skip(skip)
      .limit(limit)
      .lean(),
    Company.countDocuments(filter),
  ]);

  const ids = companies.map((c) => c._id);
  const [empCounts, projCounts] = await Promise.all([
    Employee.aggregate([
      { $match: { companyId: { $in: ids } } },
      { $group: { _id: '$companyId', count: { $sum: 1 } } },
    ]),
    Project.aggregate([
      { $match: { companyId: { $in: ids } } },
      { $group: { _id: '$companyId', count: { $sum: 1 } } },
    ]),
  ]);
  const empMap = Object.fromEntries(empCounts.map((r) => [String(r._id), r.count]));
  const projMap = Object.fromEntries(projCounts.map((r) => [String(r._id), r.count]));

  const data = companies.map((c) => ({
    ...c,
    employeeCount: empMap[String(c._id)] || 0,
    projectCount: projMap[String(c._id)] || 0,
  }));

  return sendSuccess(res, {
    data,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id)
    .populate('admin', 'fullName email avatar role phone');
  if (!company) throw ApiError.notFound('Company not found');

  const companyId = company._id;
  const [employees, teams, departments, projects, activeProjects, clients,
    attendance, leaves, payroll, contracts] = await Promise.all([
    Employee.countDocuments({ companyId }),
    Team.countDocuments({ companyId }),
    Department.countDocuments({ companyId }),
    Project.countDocuments({ companyId }),
    Project.countDocuments({ companyId, status: 'In Progress' }),
    Client.countDocuments({ companyId }),
    Attendance.countDocuments({ companyId }),
    Leave.countDocuments({ companyId }),
    Payroll.countDocuments({ companyId }),
    Contract.countDocuments({ companyId }),
  ]);

  return sendSuccess(res, {
    data: {
      company,
      stats: {
        employees, teams, departments, projects, activeProjects,
        clients, attendance, leaves, payroll, contracts,
      },
    },
  });
});

export const createCompany = asyncHandler(async (req, res) => {
  const { provisionCompany } = await import('../services/company.service.js');
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
  admin.password = undefined;
  return sendSuccess(res, {
    statusCode: 201,
    message: 'Company created',
    data: { company, admin },
  });
});

export const updateCompany = asyncHandler(async (req, res) => {
  const allowed = ['name', 'ownerName', 'phone', 'address', 'industry', 'logo', 'website', 'notes'];
  const payload = {};
  allowed.forEach((k) => { if (req.body[k] !== undefined) payload[k] = req.body[k]; });

  const company = await Company.findByIdAndUpdate(req.params.id, payload, {
    new: true, runValidators: true,
  });
  if (!company) throw ApiError.notFound('Company not found');
  return sendSuccess(res, { message: 'Company updated', data: company });
});

export const updateCompanyStatus = asyncHandler(async (req, res) => {
  const { action, reason = '' } = req.body;

  const MAP = {
    activate: 'Active',
    unblock: 'Active',
    deactivate: 'Inactive',
    block: 'Blocked',
  };
  const status = MAP[action];
  if (!status) {
    throw ApiError.badRequest("action must be one of: activate, deactivate, block, unblock.");
  }

  const company = await Company.findById(req.params.id);
  if (!company) throw ApiError.notFound('Company not found');

  company.status = status;
  if (action === 'block') company.blockedReason = reason;
  await company.save();

  return sendSuccess(res, {
    message: `Company ${action}d successfully`,
    data: company,
  });
});

export const deleteCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) throw ApiError.notFound('Company not found');

  const confirm = req.body?.confirm ?? req.query?.confirm;
  if (confirm !== undefined && String(confirm).trim() !== company.name) {
    throw ApiError.badRequest('Confirmation text does not match the company name.');
  }

  const companyId = company._id;
  const deleted = {};
  for (const Model of TENANT_COLLECTIONS) {
    const r = await Model.deleteMany({ companyId });
    if (r.deletedCount) deleted[Model.modelName] = r.deletedCount;
  }
  await Company.deleteOne({ _id: companyId });

  return sendSuccess(res, {
    message: `Company '${company.name}' and all associated data deleted`,
    data: { deleted },
  });
});



export const listCompanyAdmins = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = { role: { $in: COMPANY_ADMIN_ROLES } };
  if (req.query.companyId && mongoose.isValidObjectId(req.query.companyId)) {
    filter.companyId = req.query.companyId;
  }
  if (req.query.search) {
    const rx = new RegExp(req.query.search.trim(), 'i');
    filter.$or = [{ fullName: rx }, { email: rx }];
  }

  const [admins, total] = await Promise.all([
    Employee.find(filter)
      .populate('companyId', 'name companyCode status logo')
      .select('fullName email avatar role phone designation isActive status createdAt companyId')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .lean(),
    Employee.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    data: admins,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const platformStats = asyncHandler(async (_req, res) => {
  const [
    totalCompanies, activeCompanies, inactiveCompanies, blockedCompanies,
    totalAdmins, totalEmployees, totalTeams, totalDepartments,
    totalProjects, activeProjects, completedProjects, totalClients, totalTasks,
  ] = await Promise.all([
    Company.countDocuments(),
    Company.countDocuments({ status: 'Active' }),
    Company.countDocuments({ status: 'Inactive' }),
    Company.countDocuments({ status: 'Blocked' }),
    Employee.countDocuments({ role: { $in: COMPANY_ADMIN_ROLES } }),
    Employee.countDocuments(),
    Team.countDocuments(),
    Department.countDocuments(),
    Project.countDocuments(),
    Project.countDocuments({ status: 'In Progress' }),
    Project.countDocuments({ status: 'Completed' }),
    Client.countDocuments(),
    Task.countDocuments(),
  ]);

  const attendanceByStatus = await Attendance.aggregate([
    { $group: { _id: '$status', value: { $sum: 1 } } },
    { $project: { _id: 0, name: '$_id', value: 1 } },
    { $sort: { value: -1 } },
  ]);
  const totalAttendance = attendanceByStatus.reduce((s, r) => s + r.value, 0);
  const presentCount = attendanceByStatus.find((r) => r.name === 'Present')?.value || 0;

  const payrollAgg = await Payroll.aggregate([
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        totalNet: { $sum: '$netSalary' },
        totalBasic: { $sum: '$basicSalary' },
        totalBonus: { $sum: '$bonus' },
        totalDeductions: { $sum: '$deductions' },
      },
    },
  ]);
  const payrollByStatus = await Payroll.aggregate([
    { $group: { _id: '$status', value: { $sum: 1 }, amount: { $sum: '$netSalary' } } },
    { $project: { _id: 0, name: '$_id', value: 1, amount: 1 } },
  ]);
  const p = payrollAgg[0] || {};

  const byIndustry = await Company.aggregate([
    { $group: { _id: '$industry', count: { $sum: 1 } } },
    { $project: { _id: 0, name: '$_id', count: 1 } },
    { $sort: { count: -1 } },
    { $limit: 8 },
  ]);

  const since = new Date();
  since.setMonth(since.getMonth() - 5);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);
  const registrationTrend = await Company.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
    {
      $project: {
        _id: 0,
        count: 1,
        name: {
          $concat: [
            { $arrayElemAt: [
              ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              '$_id.m',
            ] },
            ' ', { $toString: '$_id.y' },
          ],
        },
      },
    },
  ]);

  
  const topCompanies = await Employee.aggregate([
    { $group: { _id: '$companyId', employees: { $sum: 1 } } },
    { $sort: { employees: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'companies', localField: '_id', foreignField: '_id', as: 'c' } },
    { $unwind: '$c' },
    { $project: { _id: 0, name: '$c.name', companyCode: '$c.companyCode', employees: 1 } },
  ]);

  const recentRegistrations = await Company.find()
    .sort('-createdAt')
    .limit(8)
    .populate('admin', 'fullName email avatar')
    .select('name companyCode email industry status logo createdAt admin')
    .lean();

  return sendSuccess(res, {
    data: {
      cards: {
        totalCompanies, activeCompanies, inactiveCompanies, blockedCompanies,
        totalAdmins, totalEmployees, totalTeams, totalDepartments,
        totalProjects, activeProjects, completedProjects, totalClients, totalTasks,
      },
      attendance: {
        total: totalAttendance,
        present: presentCount,
        presentRate: totalAttendance ? Math.round((presentCount / totalAttendance) * 100) : 0,
        byStatus: attendanceByStatus,
      },
      payroll: {
        totalRecords: p.totalRecords || 0,
        totalNet: p.totalNet || 0,
        totalBasic: p.totalBasic || 0,
        totalBonus: p.totalBonus || 0,
        totalDeductions: p.totalDeductions || 0,
        byStatus: payrollByStatus,
      },
      byIndustry,
      registrationTrend,
      topCompanies,
      recentRegistrations,
    },
  });
});
