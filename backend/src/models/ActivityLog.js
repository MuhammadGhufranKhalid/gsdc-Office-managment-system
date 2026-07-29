import mongoose from 'mongoose';
import { tenantPlugin } from '../utils/tenancy.js';
const activityLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  action: { type: String, required: true },     
  entityType: { type: String, required: true }, 
  entityId: { type: mongoose.Schema.Types.ObjectId },
  meta: { type: Object, default: {} },
}, { timestamps: true });
activityLogSchema.plugin(tenantPlugin, { modelName: 'ActivityLog' });
activityLogSchema.index({ companyId: 1, createdAt: -1 });

export default mongoose.model('ActivityLog', activityLogSchema);
