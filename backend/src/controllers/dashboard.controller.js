import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Team from '../models/Team.js';
import Project from '../models/Project.js';
import Client from '../models/Client.js';
import Task from '../models/Task.js';
import Leave from '../models/Leave.js';
import Attendance from '../models/Attendance.js';
import Payroll from '../models/Payroll.js';
import Contract from '../models/Contract.js';
import ActivityLog from '../models/ActivityLog.js';

export const getStats = asyncHandler(async (req, res) => {
  const companyId = req.tenant?.companyId || null;
  const scope = companyId ? { companyId } : {};

  const [
    totalEmployees, activeEmployees, totalDepartments, totalTeams,
    totalProjects, activeProjects, completedProjects,
    totalClients, totalTasks, pendingLeaves, approvedLeaves,
    totalContracts, activeContracts,
  ] = await Promise.all([
    Employee.countDocuments(scope),
    Employee.countDocuments({ ...scope, status: 'Active' }),
    Department.countDocuments(scope),
    Team.countDocuments(scope),
    Project.countDocuments(scope),
    Project.countDocuments({ ...scope, status: 'In Progress' }),
    Project.countDocuments({ ...scope, status: 'Completed' }),
    Client.countDocuments(scope),
    Task.countDocuments(scope),
    Leave.countDocuments({ ...scope, status: 'Pending' }),
    Leave.countDocuments({ ...scope, status: 'Approved' }),
    Contract.countDocuments(scope),
    Contract.countDocuments({ ...scope, status: 'Active' }),
  ]);

  const match = companyId ? [{ $match: { companyId } }] : [];

  const byDepartment = await Employee.aggregate([
    ...match,
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
    { $project: { _id: 0, name: { $ifNull: ['$dept.name', 'Unassigned'] }, count: 1 } },
    { $sort: { count: -1 } },
  ]);

  const byTeam = await Employee.aggregate([
    ...match,
    { $group: { _id: '$team', count: { $sum: 1 } } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: { path: '$team', preserveNullAndEmptyArrays: true } },
    { $project: { _id: 0, name: { $ifNull: ['$team.name', 'Unassigned'] }, count: 1 } },
    { $sort: { count: -1 } },
  ]);

  const projectStatus = await Project.aggregate([
    ...match,
    { $group: { _id: '$status', value: { $sum: 1 } } },
    { $project: { _id: 0, name: '$_id', value: 1 } },
  ]);

  const taskStatus = await Task.aggregate([
    ...match,
    { $group: { _id: '$status', value: { $sum: 1 } } },
    { $project: { _id: 0, name: '$_id', value: 1 } },
  ]);

 
  const attendanceByStatus = await Attendance.aggregate([
    ...match,
    { $group: { _id: '$status', value: { $sum: 1 } } },
    { $project: { _id: 0, name: '$_id', value: 1 } },
    { $sort: { value: -1 } },
  ]);

  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(); dayEnd.setHours(23, 59, 59, 999);
  const [presentToday, absentToday] = await Promise.all([
    Attendance.countDocuments({ ...scope, date: { $gte: dayStart, $lte: dayEnd }, status: 'Present' }),
    Attendance.countDocuments({ ...scope, date: { $gte: dayStart, $lte: dayEnd }, status: 'Absent' }),
  ]);
  const totalAttendance = attendanceByStatus.reduce((s, r) => s + r.value, 0);
  const presentTotal = attendanceByStatus.find((r) => r.name === 'Present')?.value || 0;


  const payrollAgg = await Payroll.aggregate([
    ...match,
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
    ...match,
    { $group: { _id: '$status', value: { $sum: 1 }, amount: { $sum: '$netSalary' } } },
    { $project: { _id: 0, name: '$_id', value: 1, amount: 1 } },
  ]);
  const pay = payrollAgg[0] || {};

  const recentActivity = await ActivityLog.find(scope)
    .sort('-createdAt').limit(8)
    .populate('actor', 'fullName avatar');

  return sendSuccess(res, {
    data: {
      cards: {
        totalEmployees, activeEmployees, totalDepartments, totalTeams,
        totalProjects, activeProjects, completedProjects,
        totalClients, totalTasks, pendingLeaves, approvedLeaves,
        totalContracts, activeContracts,
        presentToday, absentToday,
      },
      byDepartment,
      byTeam,
      projectStatus,
      taskStatus,
      attendance: {
        total: totalAttendance,
        present: presentTotal,
        presentRate: totalAttendance ? Math.round((presentTotal / totalAttendance) * 100) : 0,
        presentToday,
        absentToday,
        byStatus: attendanceByStatus,
      },
      payroll: {
        totalRecords: pay.totalRecords || 0,
        totalNet: pay.totalNet || 0,
        totalBasic: pay.totalBasic || 0,
        totalBonus: pay.totalBonus || 0,
        totalDeductions: pay.totalDeductions || 0,
        byStatus: payrollByStatus,
      },
      recentActivity,
    },
  });
});
