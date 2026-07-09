import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

let useJsonDbFallback = false;

export async function connectDB() {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://localhost:27017/cosostyle';
    // Small timeout so it falls back quickly if Mongo is not active locally
    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 2000
    });
    console.log('MongoDB Connection Established.');
  } catch (err) {
    console.warn('MongoDB Connection Refused:', err.message);
    console.log('Activating Local JSON Database Fallback Adapter (server/data/)');
    useJsonDbFallback = true;

    // Create server/data directory if missing
    const dataDir = path.resolve('data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }
}

export function isJsonDb() {
  return useJsonDbFallback;
}
