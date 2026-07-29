import mongoose from 'mongoose';
import { tenantPlugin } from '../utils/tenancy.js';
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  type: { type: String, enum: ['info', 'success', 'warning', 'danger'], default: 'info' },
  link: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });
notificationSchema.plugin(tenantPlugin, { modelName: 'Notification' });
notificationSchema.index({ companyId: 1, recipient: 1, isRead: 1 });

export default mongoose.model('Notification', notificationSchema);
