import mongoose from 'mongoose';
import { tenantPlugin } from '../utils/tenancy.js';
import bcrypt from 'bcryptjs';

const ROLES = [
  'Company Admin',
  'Super Admin', 'CEO', 'HR Manager', 'Finance Manager', 'Project Manager',
  'Department Head', 'Team Lead', 'Senior Developer', 'Developer',
  'Junior Developer', 'Intern', 'Employee',
];

export const COMPANY_ADMIN_ROLES = ['Company Admin', 'Super Admin', 'CEO'];

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true },      // e.g. GSDC-0001 (unique per company)
    cardNumber: { type: String, required: true },
    avatar: { type: String, default: '' },

    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    gender: { type: String, enum: ['Male', 'Female'], required: true },
    dateOfBirth: { type: Date },
    cnic: { type: String, sparse: true, set: (v) => (v === '' ? undefined : v) },
    nationality: { type: String, default: 'Pakistani' },
    religion: { type: String, default: 'Islam' },
    maritalStatus: { type: String, enum: ['Single', 'Married'], default: 'Single' },
    bloodGroup: { type: String, default: '' },

    phone: { type: String, default: '' },
    emergencyContact: { type: String, default: '' },
    personalEmail: { type: String, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true }, // company email = login
    password: { type: String, required: true, select: false, minlength: 6 },

    currentAddress: { type: String, default: '' },
    city: { type: String, default: 'Bahawalpur' },
    province: { type: String, default: 'Punjab' },

    qualification: { type: String, default: '' },
    university: { type: String, default: '' },
    experienceYears: { type: Number, default: 0 },
    skills: [{ type: String }],
    languages: [{ type: String }],

    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    designation: { type: String, required: true },
    reportingManager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    role: { type: String, enum: ROLES, default: 'Employee' },

    employmentType: {
      type: String,
      enum: ['Full Time', 'Part Time', 'Intern', 'Remote', 'Hybrid', 'Contract'],
      default: 'Full Time',
    },
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Resigned', 'Terminated', 'Probation', 'Suspended', 'Retired'],
      default: 'Active',
    },
    salary: { type: Number, required: true, default: 0 },

    joiningDate: { type: Date, required: true },
    contractStart: { type: Date },
    contractEnd: { type: Date },

    attendancePercentage: { type: Number, default: 100 },
    leaveBalance: { type: Number, default: 20 },
    performanceRating: {
      type: String,
      enum: ['Excellent', 'Very Good', 'Good', 'Average', 'Needs Improvement'],
      default: 'Good',
    },
    biography: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

employeeSchema.index({ fullName: 'text', email: 'text', designation: 'text' });

employeeSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

employeeSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};


employeeSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  return Math.floor((Date.now() - this.dateOfBirth.getTime()) / 31557600000);
});

employeeSchema.set('toJSON', { virtuals: true });
employeeSchema.set('toObject', { virtuals: true });

export { ROLES };
employeeSchema.plugin(tenantPlugin, { modelName: 'Employee' });
employeeSchema.index({ companyId: 1, employeeId: 1 }, { unique: true });
employeeSchema.index({ companyId: 1, cardNumber: 1 }, { unique: true });
employeeSchema.index({ companyId: 1, cnic: 1 }, { unique: true, partialFilterExpression: { cnic: { $type: 'string' } } });
employeeSchema.index({ companyId: 1, team: 1 });
employeeSchema.index({ companyId: 1, status: 1 });

export default mongoose.model('Employee', employeeSchema);
