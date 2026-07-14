import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, default: 'professional' },
    isPremium: { type: Boolean, default: false },
    planRequired: {
      type: String,
      enum: ['free', 'basic', 'pro', 'premium'],
      default: 'free',
    },
    sortOrder: { type: Number, default: 0 },
    thumbnail: { type: String, default: '' },
    layout: { type: String, default: 'classic' },
    defaultTheme: {
      primaryColor: { type: String, default: '#2563eb' },
      secondaryColor: { type: String, default: '#1e40af' },
      backgroundColor: { type: String, default: '#ffffff' },
      fontFamily: { type: String, default: 'Inter' },
    },
  },
  { timestamps: true }
);

export default mongoose.model('Template', templateSchema);
