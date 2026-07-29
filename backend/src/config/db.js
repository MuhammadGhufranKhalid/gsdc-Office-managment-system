import mongoose from 'mongoose';

export const connectDB = async (uri) => {
  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(uri, { autoIndex: true });
  console.log(`\u2713 MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
};
