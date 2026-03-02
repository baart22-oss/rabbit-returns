const mongoose = require('mongoose');

const referralCommissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    investment: { type: mongoose.Schema.Types.ObjectId, ref: 'Investment', required: true },
    level: { type: Number, required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: 'pending' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReferralCommission', referralCommissionSchema);
