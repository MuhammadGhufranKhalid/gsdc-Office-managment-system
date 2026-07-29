import mongoose from 'mongoose';
import { tenantPlugin } from '../utils/tenancy.js';
const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  agenda: { type: String, default: '' },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  location: { type: String, default: 'Conference Room' },
  meetingLink: { type: String, default: '' },
  status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' },
}, { timestamps: true });
meetingSchema.plugin(tenantPlugin, { modelName: 'Meeting' });
meetingSchema.index({ companyId: 1, startTime: 1 });

export default mongoose.model('Meeting', meetingSchema);
