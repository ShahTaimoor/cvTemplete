import { v2 as cloudinary } from 'cloudinary';

const configured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (configured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export const uploadImage = async (filePath) => {
  if (!configured) {
    throw new Error('Cloudinary is not configured');
  }
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'cv-builder',
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  });
  return result.secure_url;
};

// Resume thumbnails are already rendered at their target size by Puppeteer
// (see thumbnailService.js) — no face-crop/fill transform needed here, just
// upload as-is to a separate folder from user-uploaded profile photos.
//
// publicId is deterministic (keyed by the owning document's own _id, set by
// the caller) rather than left to Cloudinary's default random one: a
// document's thumbnail regenerates repeatedly over its life (every autosave
// cooldown window), and without a fixed id each regeneration uploaded a
// brand-new asset while the old one sat there orphaned forever — silent,
// unbounded storage growth with no cleanup path. Uploading to the same
// public_id overwrites the previous asset in place instead.
export const uploadThumbnail = async (filePath, publicId) => {
  if (!configured) {
    throw new Error('Cloudinary is not configured');
  }
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'cv-builder/thumbnails',
    public_id: publicId,
    overwrite: true,
    invalidate: true,
  });
  return result.secure_url;
};

// Payment screenshots attached to a plan purchase request. Uploaded as-is
// (no face crop) to their own folder so a super admin can eyeball the
// transfer before approving.
export const uploadReceipt = async (filePath) => {
  if (!configured) {
    throw new Error('Cloudinary is not configured');
  }
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'cv-builder/receipts',
  });
  return result.secure_url;
};

export const isCloudinaryConfigured = () => configured;
