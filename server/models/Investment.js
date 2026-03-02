const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    returnRate: { type: Number, default: 0.02 },
    maturityDays: { type: Number, default: 180 },
    status: {
      type: String,
      enum: ['pending', 'active', 'matured', 'withdrawn'],
      default: 'pending',
    },
    startedAt: { type: Date, default: null },
    maturesAt: { type: Date, default: null },
    proofOfPayment: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Investment', investmentSchema);
