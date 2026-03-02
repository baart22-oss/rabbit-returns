const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.DATABASE_URL || 'mongodb://localhost:27017/rabbit-returns';
  await mongoose.connect(uri);
  console.log('MongoDB connected');
};

module.exports = connectDB;
