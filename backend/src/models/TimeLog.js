import mongoose from 'mongoose';
import { tenantPlugin } from '../utils/tenancy.js';
const timeLogSchema = new mongoose.Schema({
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, default: Date.now },
  hours: { type: Number, required: true },
  description: { type: String, default: '' },
  billable: { type: Boolean, default: true },
}, { timestamps: true });
timeLogSchema.plugin(tenantPlugin, { modelName: 'TimeLog' });
timeLogSchema.index({ companyId: 1, date: -1 });

export default mongoose.model('TimeLog', timeLogSchema);
