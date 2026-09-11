import User from '../models/User.js';

// Reads SUPERADMIN_EMAIL/SUPERADMIN_PASSWORD from the environment and makes
// sure that account exists with the superadmin role — creating it on first
// run, or promoting it if it already exists as a regular user. Runs once
// per server start right after the DB connects; a bad/short password here
// only logs and is skipped, it never crashes the server.
export const ensureSuperAdmin = async () => {
  const email = process.env.SUPERADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!email || !password) return;

  try {
    const existing = await User.findOne({ email });

    if (existing) {
      if (existing.role !== 'superadmin') {
        existing.role = 'superadmin';
        await existing.save();
        console.log(`ensureSuperAdmin: promoted ${email} to superadmin`);
      }
      return;
    }

    await User.create({
      name: 'Super Admin',
      email,
      password,
      role: 'superadmin',
    });
    console.log(`ensureSuperAdmin: created superadmin account for ${email}`);
  } catch (err) {
    console.error('ensureSuperAdmin failed:', err.message);
  }
};
