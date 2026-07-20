import mongoose from 'mongoose';

const coverLetterSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', default: null },
    title: { type: String, default: 'Cover Letter' },
    templateSlug: { type: String, default: 'classic-blue' },
    theme: {
      primaryColor: { type: String, default: '#434a59ff' },
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
  },
  { timestamps: true }
);

coverLetterSchema.index({ user: 1, updatedAt: -1 });

export default mongoose.model('CoverLetter', coverLetterSchema);
