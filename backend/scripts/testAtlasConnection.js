require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  const uri = process.env.MONGODB_URI;

  console.log('----------------------------------------------------');
  console.log('Testing MongoDB connection...');
  console.log('Target Database: nexus_ems');
  console.log(`Connection scheme: ${uri ? (uri.startsWith('mongodb+srv://') ? 'MongoDB Atlas (SRV)' : 'Direct MongoDB URI') : 'UNDEFINED'}`);

  if (!uri) {
    console.error('ERROR: MONGODB_URI is not set in backend/.env');
    process.exit(1);
  }

  // Mask credentials for display
  const maskedUri = uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
  console.log(`Connecting to: ${maskedUri}`);

  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'nexus_ems',
      serverSelectionTimeoutMS: 8000,
    });

    console.log('SUCCESS: Connected to MongoDB successfully!');
    console.log(`Host: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);

    // List collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`Existing Collections (${collections.length}):`, collections.map(c => c.name).join(', ') || 'None (New DB)');

    await mongoose.disconnect();
    console.log('----------------------------------------------------');
    process.exit(0);
  } catch (err) {
    console.error('FAILED: Could not connect to MongoDB:');
    console.error(err.message);
    console.log('----------------------------------------------------');
    process.exit(1);
  }
}

testConnection();
