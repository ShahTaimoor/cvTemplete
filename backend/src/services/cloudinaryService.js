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

export const isCloudinaryConfigured = () => configured;
