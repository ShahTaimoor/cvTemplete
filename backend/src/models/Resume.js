import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const emptySection = () => [];

const resumeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, default: 'Untitled Resume' },
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
    templateSlug: { type: String, default: 'classic-blue' },
    theme: {
      primaryColor: { type: String, default: '#2563eb' },
      secondaryColor: { type: String, default: '#1e40af' },
      backgroundColor: { type: String, default: '#ffffff' },
      fontFamily: { type: String, default: 'Inter' },
    },
    sectionOrder: {
      type: [String],
      default: [
        'personal',
        'summary',
        'experience',
        'education',
        'skills',
        'projects',
        'certifications',
      ],
    },
    personal: {
      fullName: { type: String, default: '' },
      jobTitle: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      location: { type: String, default: '' },
      website: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      photo: { type: String, default: '' },
    },
    summary: { type: String, default: '' },
    education: [
      {
        institution: String,
        degree: String,
        field: String,
        startDate: String,
        endDate: String,
        description: String,
      },
    ],
    experience: [
      {
        company: String,
        position: String,
        location: String,
        startDate: String,
        endDate: String,
        current: Boolean,
        description: String,
      },
    ],
    skills: [{ name: String, level: String }],
    projects: [
      {
        name: String,
        url: String,
        description: String,
        technologies: String,
      },
    ],
    certifications: [
      {
        name: String,
        issuer: String,
        date: String,
        url: String,
      },
    ],
    shareToken: { type: String, unique: true, sparse: true },
    isPublic: { type: Boolean, default: false },
    lastAutoSavedAt: { type: Date, default: Date.now },
    thumbnailUrl: { type: String, default: '' },
    thumbnailGeneratedAt: { type: Date },
  },
  { timestamps: true }
);

resumeSchema.pre('save', function (next) {
  if (this.isPublic && !this.shareToken) {
    this.shareToken = uuidv4();
  }
  next();
});

resumeSchema.index({ user: 1, updatedAt: -1 });

export default mongoose.model('Resume', resumeSchema);
