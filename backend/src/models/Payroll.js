import mongoose from 'mongoose';
import { tenantPlugin } from '../utils/tenancy.js';
const payrollSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  month: { type: Number, required: true },  // 1-12
  year: { type: Number, required: true },
  basicSalary: { type: Number, required: true },
  allowances: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  netSalary: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Processed', 'Paid'], default: 'Pending' },
  paidOn: { type: Date },
}, { timestamps: true });
payrollSchema.index({ companyId: 1, employee: 1, month: 1, year: 1 }, { unique: true });
payrollSchema.plugin(tenantPlugin, { modelName: 'Payroll' });

export default mongoose.model('Payroll', payrollSchema);
