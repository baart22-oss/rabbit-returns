const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['EFT', 'Crypto'], required: true },
    bankDetails: {
      bankName: String,
      accountHolder: String,
      accountNumber: String,
      branchCode: String,
    },
    walletAddress: { type: String, default: null },
    reason: { type: String, default: null },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'processed'],
      default: 'pending',
    },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Withdrawal', withdrawalSchema);
