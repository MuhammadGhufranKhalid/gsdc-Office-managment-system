import mongoose from 'mongoose';
import { tenantPlugin } from '../utils/tenancy.js';
const clientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  company: { type: String, default: '' },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String, default: '' },
  country: { type: String, default: '' },
  logo: { type: String, default: '' },
  source: { type: String, enum: ['Upwork', 'LinkedIn', 'Freelancer', 'Direct', 'Referral', 'Other'], default: 'Direct' },
  status: { type: String, enum: ['Active', 'Inactive', 'Prospect', 'Lost'], default: 'Active' },
  totalProjects: { type: Number, default: 0 },
  totalValue: { type: Number, default: 0 },
  notes: { type: String, default: '' },
}, { timestamps: true });
clientSchema.index({ name: 'text', company: 'text' });
clientSchema.plugin(tenantPlugin, { modelName: 'Client' });
clientSchema.index({ companyId: 1, status: 1 });

export default mongoose.model('Client', clientSchema);
