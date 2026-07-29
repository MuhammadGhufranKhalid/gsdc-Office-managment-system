import mongoose from 'mongoose';
import { tenantPlugin } from '../utils/tenancy.js';
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, sparse: true, set: (v) => (v === '' ? undefined : v) },
  description: { type: String, default: '' },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  team: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  category: { type: String, default: 'Web Development' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: { type: String, enum: ['Planning', 'In Progress', 'On Hold', 'Completed', 'Cancelled'], default: 'Planning' },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  budget: { type: Number, default: 0 },
  startDate: { type: Date },
  deadline: { type: Date },
  tags: [{ type: String }],
}, { timestamps: true });
projectSchema.index({ name: 'text', code: 'text' });
projectSchema.plugin(tenantPlugin, { modelName: 'Project' });
projectSchema.index({ companyId: 1, code: 1 }, { unique: true, partialFilterExpression: { code: { $type: 'string' } } });
projectSchema.index({ companyId: 1, status: 1 });

export default mongoose.model('Project', projectSchema);
