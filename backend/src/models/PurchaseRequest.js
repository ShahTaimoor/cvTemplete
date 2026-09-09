import mongoose from 'mongoose';

// A user's request to move onto a paid plan. Payment happens off-platform
// (bank / JazzCash), so nothing about the user's subscription changes when
// this is created — a super admin reviews the request and only on approval
// is the plan actually activated (see routes/adminRoutes.js).
const purchaseRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ['basic', 'pro', 'premium'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    // Price snapshot at request time, so a later change to PLANS pricing
    // doesn't rewrite what the user actually asked to pay.
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'PKR' },
    // Optional transaction id / note the user types in when submitting.
    reference: { type: String, default: '', trim: true, maxlength: 200 },
    // Payment screenshot the user uploads with the request (Cloudinary URL,
    // or a local /uploads/... path when Cloudinary isn't configured). The
    // super admin views this before approving.
    receiptUrl: { type: String, default: '', trim: true },
    // How long the plan stays active once approved (matches the existing
    // /upgrade handler's 365-day window).
    durationDays: { type: Number, default: 365 },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, default: '', trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

export default mongoose.model('PurchaseRequest', purchaseRequestSchema);
