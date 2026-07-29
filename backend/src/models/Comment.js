import mongoose from 'mongoose';
import { tenantPlugin } from '../utils/tenancy.js';
const commentSchema = new mongoose.Schema({
  entityType: { type: String, enum: ['Project', 'Task', 'Client'], required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  body: { type: String, required: true },
}, { timestamps: true });
commentSchema.plugin(tenantPlugin, { modelName: 'Comment' });
commentSchema.index({ companyId: 1, entityType: 1, entityId: 1 });

export default mongoose.model('Comment', commentSchema);
