import mongoose from 'mongoose';
import { tenantPlugin } from '../utils/tenancy.js';
const contractSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  title: { type: String, default: 'Employment Contract' },
  type: { type: String, enum: ['Permanent', 'Fixed Term', 'Internship', 'Probation'], default: 'Fixed Term' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  durationMonths: { type: Number, default: 24 },
  salary: { type: Number, default: 0 },
  status: { type: String, enum: ['Active', 'Expired', 'Terminated', 'Renewed'], default: 'Active' },
  documentUrl: { type: String, default: '' },
}, { timestamps: true });
contractSchema.plugin(tenantPlugin, { modelName: 'Contract' });
contractSchema.index({ companyId: 1, status: 1 });

export default mongoose.model('Contract', contractSchema);
