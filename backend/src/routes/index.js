import { Router } from 'express';

import authRoutes from './auth.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import superAdminRoutes from './superadmin.routes.js';
import companyRoutes from './company.routes.js';
import { resourceRouter } from './resourceRouter.js';

import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Team from '../models/Team.js';
import Company from '../models/Company.js';
import { nextEmployeeId } from '../services/company.service.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import Milestone from '../models/Milestone.js';
import Task from '../models/Task.js';
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

const router = Router();


router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);

router.use('/super-admin', superAdminRoutes);

router.use('/company', companyRoutes);


const ADMIN = ['Company Admin', 'Super Admin', 'CEO'];
const HR = [...ADMIN, 'HR Manager'];
const FIN = [...ADMIN, 'Finance Manager'];
const PM = [...ADMIN, 'Project Manager', 'Department Head'];


const prepareEmployee = async (payload, req) => {
  const company = await Company.findById(req.tenant.companyId).select('companyCode employeePrefix');
  if (!company) return payload;

  const next = await nextEmployeeId(company);
  const seq = next.split('-').pop();

  if (!payload.employeeId) payload.employeeId = next;
  if (!payload.cardNumber) payload.cardNumber = `${company.companyCode}-${seq}`;
  if (!payload.fullName) {
    payload.fullName = [payload.firstName, payload.lastName].filter(Boolean).join(' ').trim();
  }
  if (!payload.avatar && payload.fullName) {
    payload.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.fullName)}&background=2563EB&color=fff`;
  }
  return payload;
};

router.use('/employees', resourceRouter(Employee, {
  beforeCreate: prepareEmployee,
  searchFields: ['fullName', 'email', 'designation', 'employeeId'],
  filterFields: ['department', 'team', 'role', 'status', 'gender', 'employmentType'],
  populate: [
    { path: 'department', select: 'name code' },
    { path: 'team', select: 'name code color' },
    { path: 'reportingManager', select: 'fullName' },
  ],
  entityName: 'Employee',
}, { write: HR }));

router.use('/teams', resourceRouter(Team, {
  searchFields: ['name', 'code'],
  filterFields: ['department', 'lead', 'isActive'],
  populate: [
    { path: 'lead', select: 'fullName avatar' },
    { path: 'department', select: 'name code' },
  ],
  entityName: 'Team',
}, { write: HR }));

router.use('/departments', resourceRouter(Department, {
  searchFields: ['name', 'code'],
  populate: [{ path: 'head', select: 'fullName avatar' }],
  entityName: 'Department',
}, { write: HR }));

router.use('/clients', resourceRouter(Client, {
  searchFields: ['name', 'company', 'email'],
  filterFields: ['status', 'source'],
  entityName: 'Client',
}, { write: PM }));

router.use('/projects', resourceRouter(Project, {
  searchFields: ['name', 'code'],
  filterFields: ['status', 'priority', 'client', 'department', 'manager'],
  populate: [
    { path: 'client', select: 'name company' },
    { path: 'manager', select: 'fullName avatar' },
    { path: 'department', select: 'name' },
  ],
  entityName: 'Project',
}, { write: PM }));

router.use('/milestones', resourceRouter(Milestone, {
  searchFields: ['title'],
  filterFields: ['status', 'project'],
  populate: [{ path: 'project', select: 'name code' }],
  entityName: 'Milestone',
}, { write: PM }));

router.use('/tasks', resourceRouter(Task, {
  searchFields: ['title'],
  filterFields: ['status', 'priority', 'project', 'assignee'],
  populate: [
    { path: 'project', select: 'name code' },
    { path: 'assignee', select: 'fullName avatar' },
  ],
  entityName: 'Task',
}));

router.use('/timelogs', resourceRouter(TimeLog, {
  filterFields: ['employee', 'project', 'task', 'billable'],
  populate: [
    { path: 'employee', select: 'fullName' },
    { path: 'project', select: 'name' },
    { path: 'task', select: 'title' },
  ],
  entityName: 'TimeLog',
}));

router.use('/comments', resourceRouter(Comment, {
  filterFields: ['entityType', 'entityId'],
  populate: [{ path: 'author', select: 'fullName avatar' }],
  entityName: 'Comment',
}));

router.use('/activity', resourceRouter(ActivityLog, {
  filterFields: ['entityType', 'action', 'actor'],
  populate: [{ path: 'actor', select: 'fullName avatar' }],
  entityName: 'ActivityLog',
}));

router.use('/attendance', resourceRouter(Attendance, {
  filterFields: ['employee', 'status'],
  populate: [{ path: 'employee', select: 'fullName avatar employeeId' }],
  entityName: 'Attendance',
}, { write: HR }));

router.use('/leaves', resourceRouter(Leave, {
  filterFields: ['employee', 'status', 'type'],
  populate: [
    { path: 'employee', select: 'fullName avatar' },
    { path: 'approvedBy', select: 'fullName' },
  ],
  entityName: 'Leave',
}));

router.use('/payroll', resourceRouter(Payroll, {
  filterFields: ['employee', 'status', 'month', 'year'],
  populate: [{ path: 'employee', select: 'fullName avatar employeeId' }],
  entityName: 'Payroll',
}, { write: FIN }));

router.use('/contracts', resourceRouter(Contract, {
  filterFields: ['employee', 'status', 'type'],
  populate: [{ path: 'employee', select: 'fullName avatar employeeId' }],
  entityName: 'Contract',
}, { write: HR }));

router.use('/meetings', resourceRouter(Meeting, {
  searchFields: ['title'],
  filterFields: ['status', 'organizer', 'project'],
  populate: [
    { path: 'organizer', select: 'fullName avatar' },
    { path: 'project', select: 'name' },
  ],
  entityName: 'Meeting',
}));

router.use('/assets', resourceRouter(Asset, {
  searchFields: ['name', 'tag', 'serialNumber'],
  filterFields: ['category', 'status', 'assignedTo'],
  populate: [{ path: 'assignedTo', select: 'fullName avatar' }],
  entityName: 'Asset',
}, { write: HR }));

router.use('/notifications', resourceRouter(Notification, {
  filterFields: ['recipient', 'isRead', 'type'],
  entityName: 'Notification',
}));

export default router;
