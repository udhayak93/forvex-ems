const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexus_ems';

  const options = {
    dbName: 'nexus_ems', // Always enforces nexus_ems database isolation
    serverSelectionTimeoutMS: 5000,
  };

  try {
    const conn = await mongoose.connect(uri, options);
    console.log(`[Database] MongoDB connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.warn(`[Database] Could not connect to primary MongoDB at ${uri.split('@')[1] || uri}: ${err.message}`);
    
    // In dev / test or when primary is unreachable, fallback to in-memory MongoDB
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[Database] Initializing in-memory MongoDB fallback...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create({
          instance: { dbName: 'nexus_ems' }
        });
        const memoryUri = memoryServer.getUri();
        const conn = await mongoose.connect(memoryUri, options);
        console.log(`[Database] In-memory fallback connected: ${memoryUri}`);
        return conn;
      } catch (memErr) {
        console.error('[Database] In-memory MongoDB fallback failed:', memErr.message);
        throw err;
      }
    } else {
      throw err;
    }
  }
};

const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServer) {
    await memoryServer.stop();
  }
};

module.exports = { connectDB, closeDB };
