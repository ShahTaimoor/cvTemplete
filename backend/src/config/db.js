import mongoose from 'mongoose';

// Queries issued before the initial connection finishes are queued by
// mongoose and flushed once connected, rather than failing immediately —
// this is what makes it safe for server.js to start listening before this
// resolves. Default buffer timeout is 10s; raised because this app's Atlas
// cluster has been measured taking upwards of 11s on a cold connect.
mongoose.set('bufferTimeoutMS', 20000);

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cvbuilder';
  await mongoose.connect(uri);
  console.log('MongoDB connected');
};
