const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected to database: "${conn.connection.name}" at host: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB Connection Failed:', err.message);
    console.error('👉 Tip: Check your internet connection or MongoDB Atlas "Network Access" IP whitelist.');
  }
};

module.exports = connectDB;
