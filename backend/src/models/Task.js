import mongoose from 'mongoose';
import { tenantPlugin } from '../utils/tenancy.js';
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  milestone: { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone', default: null },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: { type: String, enum: ['Todo', 'In Progress', 'Review', 'Done'], default: 'Todo' },
  progress: { type: Number, default: 0 },
  estimatedHours: { type: Number, default: 0 },
  loggedHours: { type: Number, default: 0 },
  dueDate: { type: Date },
  tags: [{ type: String }],
}, { timestamps: true });
taskSchema.index({ title: 'text' });
taskSchema.plugin(tenantPlugin, { modelName: 'Task' });
taskSchema.index({ companyId: 1, status: 1 });

export default mongoose.model('Task', taskSchema);
