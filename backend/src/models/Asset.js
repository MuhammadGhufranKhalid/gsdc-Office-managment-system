import mongoose from 'mongoose';
import { tenantPlugin } from '../utils/tenancy.js';
const assetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  tag: { type: String, sparse: true, set: (v) => (v === '' ? undefined : v) },
  category: { type: String, enum: ['Laptop', 'Desktop', 'Monitor', 'Phone', 'Furniture', 'Peripheral', 'Other'], default: 'Laptop' },
  serialNumber: { type: String, default: '' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  status: { type: String, enum: ['Available', 'Assigned', 'Under Repair', 'Retired'], default: 'Available' },
  purchaseDate: { type: Date },
  cost: { type: Number, default: 0 },
  condition: { type: String, enum: ['New', 'Good', 'Fair', 'Poor'], default: 'Good' },
}, { timestamps: true });
assetSchema.plugin(tenantPlugin, { modelName: 'Asset' });
assetSchema.index({ companyId: 1, tag: 1 }, { unique: true, partialFilterExpression: { tag: { $type: 'string' } } });

export default mongoose.model('Asset', assetSchema);
