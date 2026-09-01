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
export const uploadThumbnail = async (filePath) => {
  if (!configured) {
    throw new Error('Cloudinary is not configured');
  }
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'cv-builder/thumbnails',
  });
  return result.secure_url;
};

export const isCloudinaryConfigured = () => configured;
