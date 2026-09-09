import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { connectDB } from '../config/db.js';

dotenv.config();

// Usage: node src/scripts/makeSuperAdmin.js someone@example.com
// Promotes an existing account to the super-admin role so it can review
// and approve plan purchase requests. Run again with a different email to
// move the role; pass --demote to drop it back to a normal user.
const run = async () => {
  const email = process.argv[2]?.toLowerCase().trim();
  const demote = process.argv.includes('--demote');

  if (!email) {
    console.error('Usage: node src/scripts/makeSuperAdmin.js <email> [--demote]');
    process.exit(1);
  }

  await connectDB();

  const user = await User.findOne({ email });
  if (!user) {
    console.error(`No user found with email ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  user.role = demote ? 'user' : 'superadmin';
  await user.save();

  console.log(`${email} is now role="${user.role}"`);
  await mongoose.disconnect();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
