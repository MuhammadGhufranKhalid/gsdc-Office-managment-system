import mongoose from 'mongoose';
import { tenantPlugin } from '../utils/tenancy.js';
const leaveSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  type: { type: String, enum: ['Casual', 'Sick', 'Annual', 'Unpaid', 'Maternity', 'Emergency'], default: 'Casual' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  days: { type: Number, default: 1 },
  reason: { type: String, default: '' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], default: 'Pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
}, { timestamps: true });
leaveSchema.plugin(tenantPlugin, { modelName: 'Leave' });
leaveSchema.index({ companyId: 1, status: 1 });

export default mongoose.model('Leave', leaveSchema);
