import mongoose from 'mongoose';
import { tenantPlugin } from '../utils/tenancy.js';


const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, uppercase: true, trim: true, set: (v) => (v === '' ? undefined : v) },
    description: { type: String, default: '' },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
    color: { type: String, default: '#2563EB' },
    headcount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

teamSchema.plugin(tenantPlugin, { modelName: 'Team' });

teamSchema.index({ companyId: 1, name: 1 }, { unique: true });
teamSchema.index({ companyId: 1, code: 1 }, { unique: true, partialFilterExpression: { code: { $type: 'string' } } });

export default mongoose.model('Team', teamSchema);
