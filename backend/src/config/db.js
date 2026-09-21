import dns from 'node:dns';
import mongoose from 'mongoose';

// On some Windows machines Node resolves DNS through a local proxy
// (127.0.0.1 — often injected by a VPN, antivirus, or ad-blocker) that
// refuses SRV queries even though the OS resolver itself works fine. That
// breaks `mongodb+srv://` connection strings with `querySrv ECONNREFUSED`.
// Preferring public resolvers (with the original servers kept as a
// fallback) sidesteps it without requiring the user to change OS network
// settings. Done inside connectDB (not at import time) so it also works for
// scripts that call dotenv.config() after their imports.
const preferPublicDns = (uri) => {
  if (uri.startsWith('mongodb+srv://')) {
    dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);
  }
};

// Queries issued before the initial connection finishes are queued by
// mongoose and flushed once connected, rather than failing immediately —
// this is what makes it safe for server.js to start listening before this
// resolves. Default buffer timeout is 10s; raised because this app's Atlas
// cluster has been measured taking upwards of 11s on a cold connect.
mongoose.set('bufferTimeoutMS', 20000);

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cvbuilder';
  preferPublicDns(uri);
  await mongoose.connect(uri);
  console.log('MongoDB connected');
};
