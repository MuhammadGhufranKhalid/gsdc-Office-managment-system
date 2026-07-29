import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDB } from '../config/db.js';

import Company from '../models/Company.js';
import SuperAdmin from '../models/SuperAdmin.js';
import Team from '../models/Team.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
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

const TENANT_MODELS = [
  Employee, Department, Team, Client, Project, Milestone, Task, TimeLog,
  Comment, ActivityLog, Attendance, Leave, Payroll, Contract, Meeting,
  Asset, Notification,
];

const log = (...a) => console.log('  ', ...a);

const ensureSuperAdmin = async () => {
  const email = (process.env.SUPER_ADMIN_EMAIL || 'superadmin@oms.com').toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD || 'Super@123';
  const fullName = process.env.SUPER_ADMIN_NAME || 'Platform Super Admin';

  let admin = await SuperAdmin.findOne({ email });
  if (admin) {
    log(`Super Admin already exists: ${email}`);
    return admin;
  }
  admin = await SuperAdmin.create({
    fullName, email, password,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0F172A&color=fff`,
  });
  log(`Super Admin created: ${email} / ${password}`);
  return admin;
};

const ensureLegacyCompany = async () => {
  const name = process.env.LEGACY_COMPANY_NAME || 'Ghufran Software Development Company';
  const email = (process.env.LEGACY_COMPANY_EMAIL || 'admin@gsdc.com').toLowerCase();

  let company = await Company.findOne({ slug: 'gsdc' });
  if (company) {
    log(`Legacy company already exists: ${company.name} (${company.companyCode})`);
    return company;
  }

  company = await Company.create({
    companyCode: 'CMP-0001',
    slug: 'gsdc',
    employeePrefix: 'GSDC',
    name,
    ownerName: process.env.LEGACY_OWNER_NAME || 'Muhammad Ghufran',
    email,
    phone: '+92 300 0000000',
    address: 'Bahawalpur, Punjab, Pakistan',
    industry: 'Software Development',
    status: 'Active',
    isActive: true,
    notes: 'Auto-created during the multi-tenancy migration to adopt pre-existing records.',
  });
  log(`Legacy company created: ${company.name} (${company.companyCode})`);
  return company;
};

const backfill = async (companyId) => {
  let touched = 0;
  for (const Model of TENANT_MODELS) {
    const res = await Model.updateMany(
      { $or: [{ companyId: { $exists: false } }, { companyId: null }] },
      { $set: { companyId } }
    );
    if (res.modifiedCount) {
      log(`${Model.modelName}: ${res.modifiedCount} document(s) adopted`);
      touched += res.modifiedCount;
    }
  }
  if (!touched) log('No orphan documents found - nothing to backfill.');
  return touched;
};

const ensureCompanyAdmin = async (company) => {
  if (company.admin) {
    const existing = await Employee.findById(company.admin);
    if (existing) { log(`Company Admin already set: ${existing.email}`); return existing; }
  }

  const candidate =
    await Employee.findOne({ companyId: company._id, role: 'Company Admin' }) ||
    await Employee.findOne({ companyId: company._id, role: 'Super Admin' }) ||
    await Employee.findOne({ companyId: company._id, role: 'CEO' }) ||
    await Employee.findOne({ companyId: company._id }).sort('createdAt');

  if (!candidate) {
    log('No employees found - skipping Company Admin promotion.');
    return null;
  }

  const previousRole = candidate.role;
  candidate.role = 'Company Admin';
  await candidate.save();

  company.admin = candidate._id;
  await company.save();

  log(`Company Admin: ${candidate.email} (was '${previousRole}')`);
  return candidate;
};

const ensureDefaultTeam = async (company) => {
  let team = await Team.findOne({ companyId: company._id, name: 'General' });
  if (!team) {
    team = await Team.create({
      companyId: company._id,
      name: 'General',
      code: 'GEN',
      description: 'Default team created during migration.',
    });
    log('Default team "General" created.');
  }

  const res = await Employee.updateMany(
    { companyId: company._id, $or: [{ team: { $exists: false } }, { team: null }] },
    { $set: { team: team._id } }
  );
  if (res.modifiedCount) {
    const members = await Employee.find({ companyId: company._id, team: team._id }).select('_id');
    await Team.updateOne(
      { _id: team._id },
      { members: members.map((m) => m._id), headcount: members.length }
    );
    log(`${res.modifiedCount} employee(s) assigned to the default team.`);
  }
  return team;
};

const rebuildIndexes = async () => {
  const STALE = {
    employees: ['employeeId_1', 'cardNumber_1', 'cnic_1'],
    departments: ['name_1', 'code_1'],
    projects: ['code_1'],
    assets: ['tag_1'],
    attendances: ['employee_1_date_1'],
    payrolls: ['employee_1_month_1_year_1'],
  };

  for (const [collection, names] of Object.entries(STALE)) {
    for (const name of names) {
      try {
        await mongoose.connection.db.collection(collection).dropIndex(name);
        log(`Dropped stale index ${collection}.${name}`);
      } catch (e) {
        // IndexNotFound (27) / NamespaceNotFound (26) are expected on a fresh DB.
        if (![26, 27].includes(e.code)) {
          log(`Could not drop ${collection}.${name}: ${e.message}`);
        }
      }
    }
  }

  for (const Model of [...TENANT_MODELS, Company, SuperAdmin]) {
    try {
      await Model.syncIndexes();
    } catch (e) {
      log(`syncIndexes failed for ${Model.modelName}: ${e.message}`);
    }
  }
  log('Indexes rebuilt for all collections.');
};


const run = async () => {
  console.log('\n=== Multi-tenancy migration ===\n');
  await connectDB(env.mongoUri);

  console.log('\n[1/6] Super Admin');
  await ensureSuperAdmin();

  console.log('\n[2/6] Legacy company');
  const company = await ensureLegacyCompany();

  console.log('\n[3/6] Backfilling companyId');
  await backfill(company._id);

  console.log('\n[4/6] Company Admin');
  await ensureCompanyAdmin(company);

  console.log('\n[5/6] Default team');
  await ensureDefaultTeam(company);

  console.log('\n[6/6] Indexes');
  await rebuildIndexes();

  console.log('\n=== Migration complete ===');
  console.log(`Super Admin login : ${process.env.SUPER_ADMIN_EMAIL || 'superadmin@oms.com'}`);
  console.log(`Company Admin     : ${company.email}\n`);

  await mongoose.disconnect();
  process.exit(0);
};

run().catch(async (err) => {
  console.error('\nMigration failed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
