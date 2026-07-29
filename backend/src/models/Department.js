import mongoose from 'mongoose';
import { tenantPlugin } from '../utils/tenancy.js';

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    head: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    headcount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

departmentSchema.plugin(tenantPlugin, { modelName: 'Department' });
departmentSchema.index({ companyId: 1, name: 1 }, { unique: true });
departmentSchema.index({ companyId: 1, code: 1 }, { unique: true });

export default mongoose.model('Department', departmentSchema);
