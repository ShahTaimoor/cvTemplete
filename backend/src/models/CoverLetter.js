import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const coverLetterSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', default: null },
    title: { type: String, default: 'Cover Letter' },
    templateSlug: { type: String, default: 'classic-blue' },
    theme: {
      primaryColor: { type: String, default: '#2563eb' },
      secondaryColor: { type: String, default: '#1e40af' },
      backgroundColor: { type: String, default: '#ffffff' },
      fontFamily: { type: String, default: 'Inter' },
    },
    personal: {
      fullName: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      location: { type: String, default: '' },
    },
    recipientName: { type: String, default: '' },
    recipientTitle: { type: String, default: '' },
    companyName: { type: String, default: '' },
    companyAddress: { type: String, default: '' },
    date: { type: String, default: '' },
    salutation: { type: String, default: 'Dear Hiring Manager,' },
    body: { type: String, default: '' },
    closing: { type: String, default: 'Sincerely,' },
    shareToken: { type: String, unique: true, sparse: true },
    isPublic: { type: Boolean, default: false },
    thumbnailUrl: { type: String, default: '' },
    thumbnailGeneratedAt: { type: Date },
    // Mirrors Resume.js's thumbnailPending exactly — see its comment for
    // the full explanation (thumbnailService.js's fulfillIfDue).
    thumbnailPending: { type: Boolean, default: false },
  },
  { timestamps: true }
);

coverLetterSchema.pre('save', function (next) {
  if (this.isPublic && !this.shareToken) {
    this.shareToken = uuidv4();
  }
  next();
});

coverLetterSchema.index({ user: 1, updatedAt: -1 });

export default mongoose.model('CoverLetter', coverLetterSchema);
