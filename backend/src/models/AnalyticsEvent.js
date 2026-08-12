import mongoose from 'mongoose';

const analyticsEventSchema = new mongoose.Schema(
  {
    resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
    type: { type: String, enum: ['view', 'download'], required: true },
    format: { type: String, enum: ['pdf', 'png', 'docx'] },
  },
  { timestamps: true }
);

analyticsEventSchema.index({ resume: 1, createdAt: -1 });

export default mongoose.model('AnalyticsEvent', analyticsEventSchema);
