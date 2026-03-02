const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, default: null },
    phone: { type: String, default: null },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);
