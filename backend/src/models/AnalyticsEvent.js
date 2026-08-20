import mongoose from 'mongoose';

const analyticsEventSchema = new mongoose.Schema(
  {
    // Exactly one of resume/coverLetter is set per event (enforced below) —
    // neither is `required` on its own since which one applies depends on
    // what generated the event. Kept as two optional refs rather than one
    // polymorphic {contentType, contentId} pair so existing queries filtering
    // on `resume` (Resume's own analytics/dashboard-insight code) keep
    // working completely unchanged.
    resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', index: true },
    coverLetter: { type: mongoose.Schema.Types.ObjectId, ref: 'CoverLetter', index: true },
    type: { type: String, enum: ['view', 'download'], required: true },
    format: { type: String, enum: ['pdf', 'png', 'docx'] },
  },
  { timestamps: true }
);

analyticsEventSchema.pre('validate', function (next) {
  if (Boolean(this.resume) === Boolean(this.coverLetter)) {
    return next(new Error('AnalyticsEvent requires exactly one of resume or coverLetter'));
  }
  next();
});

analyticsEventSchema.index({ resume: 1, createdAt: -1 });
analyticsEventSchema.index({ coverLetter: 1, createdAt: -1 });

export default mongoose.model('AnalyticsEvent', analyticsEventSchema);
