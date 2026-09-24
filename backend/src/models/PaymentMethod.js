import mongoose from 'mongoose';

// An account users can transfer plan payments to (Easypaisa, JazzCash, a bank
// account, ...). Managed by a super admin under Payment Settings; the active
// ones are shown to users in the "Request a plan" dialog.
const paymentMethodSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['easypaisa', 'jazzcash', 'bank', 'other'],
      default: 'bank',
    },
    // Optional display name, e.g. "Meezan Bank". Falls back to the type.
    label: { type: String, default: '', trim: true, maxlength: 60 },
    accountName: { type: String, required: true, trim: true, maxlength: 100 },
    accountNumber: { type: String, required: true, trim: true, maxlength: 60 },
    // Extra bank detail (branch code, IBAN, ...) or any instruction for the user.
    note: { type: String, default: '', trim: true, maxlength: 300 },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('PaymentMethod', paymentMethodSchema);
