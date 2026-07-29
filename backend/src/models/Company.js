import mongoose from 'mongoose';

export const COMPANY_STATUSES = ['Active', 'Inactive', 'Blocked'];

export const INDUSTRIES = [
  'Software Development', 'Information Technology', 'Marketing & Advertising',
  'E-Commerce', 'Education', 'Healthcare', 'Finance & Banking', 'Manufacturing',
  'Construction', 'Retail', 'Logistics', 'Consulting', 'Media & Entertainment',
  'Telecommunications', 'Real Estate', 'Other',
];

const companySchema = new mongoose.Schema(
  {
    // Human-readable tenant identifier, e.g. CMP-0007. Unique platform-wide.
    companyCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    // URL-safe identifier derived from the name, e.g. "acme-solutions".
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Short prefix used to mint employee IDs inside this tenant, e.g. ACME-0001.
    employeePrefix: { type: String, required: true, uppercase: true, trim: true },

    name: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    industry: { type: String, enum: INDUSTRIES, default: 'Other' },
    logo: { type: String, default: '' },
    website: { type: String, default: '' },

    status: { type: String, enum: COMPANY_STATUSES, default: 'Active' },
    // `isActive` mirrors status for backward compatibility with existing UI code.
    isActive: { type: Boolean, default: true },
    blockedReason: { type: String, default: '' },
    blockedAt: { type: Date, default: null },

    // The Employee document that owns this tenant (role: 'Company Admin').
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },

    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

companySchema.index({ name: 'text', ownerName: 'text', email: 'text' });
companySchema.index({ status: 1, createdAt: -1 });


companySchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.isActive = this.status === 'Active';
    if (this.status === 'Blocked' && !this.blockedAt) this.blockedAt = new Date();
    if (this.status !== 'Blocked') { this.blockedAt = null; this.blockedReason = ''; }
  }
  next();
});


companySchema.methods.canOperate = function () {
  return this.status === 'Active';
};

export default mongoose.model('Company', companySchema);
