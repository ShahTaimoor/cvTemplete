import mongoose from 'mongoose';

const resumeVersionSchema = new mongoose.Schema(
  {
    resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

resumeVersionSchema.index({ resume: 1, createdAt: -1 });

export default mongoose.model('ResumeVersion', resumeVersionSchema);
