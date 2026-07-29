import mongoose from 'mongoose';
import { tenantPlugin } from '../utils/tenancy.js';
const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  description: { type: String, default: '' },
  dueDate: { type: Date },
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
  progress: { type: Number, default: 0 },
}, { timestamps: true });
milestoneSchema.plugin(tenantPlugin, { modelName: 'Milestone' });
milestoneSchema.index({ companyId: 1, project: 1 });

export default mongoose.model('Milestone', milestoneSchema);
