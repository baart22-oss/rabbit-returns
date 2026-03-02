const mongoose = require('mongoose');

const bankingDetailsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    bankName: { type: String, required: true },
    accountHolder: { type: String, required: true },
    accountNumber: { type: String, required: true },
    branchCode: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BankingDetails', bankingDetailsSchema);
