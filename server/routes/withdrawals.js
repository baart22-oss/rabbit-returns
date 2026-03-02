const express = require('express');
const Withdrawal = require('../models/Withdrawal');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/withdrawals – current user's withdrawal requests
router.get('/', protect, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/withdrawals – submit a withdrawal request
router.post('/', protect, async (req, res) => {
  try {
    const { amount, method, bankDetails, walletAddress, reason } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ message: 'Minimum withdrawal amount is R100' });
    }

    if (method === 'EFT') {
      const { bankName, accountHolder, accountNumber, branchCode } = bankDetails || {};
      if (!bankName || !accountHolder || !accountNumber || !branchCode) {
        return res.status(400).json({ message: 'All banking details are required for EFT' });
      }
    } else if (method === 'Crypto') {
      if (!walletAddress) {
        return res.status(400).json({ message: 'Wallet address is required for Crypto' });
      }
    } else {
      return res.status(400).json({ message: 'Method must be EFT or Crypto' });
    }

    const withdrawal = await Withdrawal.create({
      user: req.user._id,
      amount,
      method,
      bankDetails: method === 'EFT' ? bankDetails : undefined,
      walletAddress: method === 'Crypto' ? walletAddress : undefined,
      reason: reason || undefined,
    });

    res.status(201).json(withdrawal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
