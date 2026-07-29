import mongoose from 'mongoose';
import { tenantPlugin } from '../utils/tenancy.js';
const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  status: { type: String, enum: ['Present', 'Absent', 'Late', 'Half Day', 'On Leave', 'Holiday'], default: 'Present' },
  workedHours: { type: Number, default: 0 },
  notes: { type: String, default: '' },
}, { timestamps: true });
attendanceSchema.index({ companyId: 1, employee: 1, date: 1 }, { unique: true });
attendanceSchema.plugin(tenantPlugin, { modelName: 'Attendance' });

export default mongoose.model('Attendance', attendanceSchema);
