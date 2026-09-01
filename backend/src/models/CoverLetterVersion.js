import mongoose from 'mongoose';

const coverLetterVersionSchema = new mongoose.Schema(
  {
    coverLetter: { type: mongoose.Schema.Types.ObjectId, ref: 'CoverLetter', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

coverLetterVersionSchema.index({ coverLetter: 1, createdAt: -1 });

export default mongoose.model('CoverLetterVersion', coverLetterVersionSchema);
