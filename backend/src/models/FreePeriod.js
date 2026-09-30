import mongoose from 'mongoose';

// Single-document setting: while `enabled` and now is between startsAt and
// endsAt, every account gets full (Premium) access without paying. Managed by
// a super admin under Free Period.
const freePeriodSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    enabled: { type: Boolean, default: false },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export default mongoose.model('FreePeriod', freePeriodSchema);
