import mongoose from 'mongoose';
import Company from '../models/Company.js';
import Employee from '../models/Employee.js';
import Department from '../models/Department.js';
import Team from '../models/Team.js';
import { ApiError } from '../utils/ApiError.js';


export const slugify = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'company';

export const derivePrefix = (name) => {
  const words = String(name).replace(/[^a-zA-Z0-9 ]/g, ' ').trim().split(/\s+/);
  const acronym = words.length > 1
    ? words.map((w) => w[0]).join('')
    : words[0] || 'CO';
  return acronym.toUpperCase().slice(0, 6);
};

const uniqueSlug = async (base) => {
  let slug = base;
  let n = 1;
  while (await Company.exists({ slug })) slug = `${base}-${++n}`;
  return slug;
};

const nextCompanyCode = async () => {
  const last = await Company.findOne({ companyCode: /^CMP-\d+$/ })
    .sort({ companyCode: -1 })
    .select('companyCode')
    .lean();
  const n = last ? parseInt(last.companyCode.split('-')[1], 10) + 1 : 1;
  return `CMP-${String(n).padStart(4, '0')}`;
};

export const nextEmployeeId = async (company, session = null) => {
  const query = Employee.countDocuments({ companyId: company._id });
  if (session) query.session(session);
  const count = await query;
  return `${company.employeePrefix}-${String(count + 1).padStart(4, '0')}`;
};

export const provisionCompany = async (input) => {
  const {
    companyName, ownerName, email, password,
    phone = '', address = '', industry = 'Other', logo = '', website = '',
  } = input;

  const normalisedEmail = String(email).toLowerCase().trim();

  const [companyClash, employeeClash] = await Promise.all([
    Company.findOne({ email: normalisedEmail }).lean(),
    Employee.findOne({ email: normalisedEmail }).lean(),
  ]);
  if (companyClash || employeeClash) {
    throw ApiError.conflict('An account with this email already exists.');
  }

  const slug = await uniqueSlug(slugify(companyName));
  const companyCode = await nextCompanyCode();
  const employeePrefix = derivePrefix(companyName);

  let session = null;
  let useTxn = false;
  const opts = {}; 
  const created = { company: null, admin: null, department: null, team: null };

  try {
    const [company] = await Company.create([{
      companyCode, slug, employeePrefix,
      name: companyName, ownerName, email: normalisedEmail,
      phone, address, industry, logo, website,
      status: 'Active', isActive: true,
    }], opts);
    created.company = company;

    const [department] = await Department.create([{
      companyId: company._id,
      name: `Administration-${companyCode}`, 
      code: `ADMIN-${companyCode}`,           
      description: 'Default department created at registration.',
    }], opts);
    created.department = department;

    const [team] = await Team.create([{
      companyId: company._id,
      name: `General-${companyCode}`,         
      code: `GEN-${companyCode}`,            
      description: 'Default team created at registration.',
      department: department._id,
    }], opts);
    created.team = team;

    const admin = await Employee.create({
      companyId: company._id,
      employeeId: `${employeePrefix}-${companyCode}-0001`, // Isay unique banaya
      cardNumber: `${companyCode}-ADMIN-0001`,             // Isay unique banaya
      firstName: ownerName.split(' ')[0] || ownerName,
      lastName: ownerName.split(' ').slice(1).join(' ') || '-',
      fullName: ownerName,
      gender: 'Male',
      email: normalisedEmail,
      password,
      phone,
      currentAddress: address,
      department: department._id,
      team: team._id,
      designation: 'Company Administrator',
      role: 'Company Admin',
      employmentType: 'Full Time',
      status: 'Active',
      salary: 0,
      joiningDate: new Date(),
      isActive: true,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(ownerName)}&background=2563EB&color=fff`,
    });
    created.admin = admin;

    company.admin = admin._id;
    await company.save();

    await Department.updateOne({ _id: department._id }, { head: admin._id, headcount: 1 });
    await Team.updateOne({ _id: team._id }, { lead: admin._id, members: [admin._id], headcount: 1 });

    return { company, admin };
  } catch (err) {
    const cid = created.company?._id;
    if (cid) {
      await Promise.all([
        Employee.deleteMany({ companyId: cid }),
        Department.deleteMany({ companyId: cid }),
        Team.deleteMany({ companyId: cid }),
        Company.deleteOne({ _id: cid }),
      ]).catch(() => {});
    }
    throw err;
  } finally {
  }
};
