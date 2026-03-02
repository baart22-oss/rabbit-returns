const express = require('express');
const Investment = require('../models/Investment');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/investments – current user's investments
router.get('/', protect, async (req, res) => {
  try {
    const investments = await Investment.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(investments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/investments – create a new investment
router.post('/', protect, async (req, res) => {
  try {
    const { amount, maturityDays, proofOfPayment } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount is required and must be positive' });
    }

    const investment = await Investment.create({
      user: req.user._id,
      amount,
      maturityDays: maturityDays || 180,
      proofOfPayment: proofOfPayment || null,
    });

    res.status(201).json(investment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/investments/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const investment = await Investment.findOne({ _id: req.params.id, user: req.user._id });
    if (!investment) return res.status(404).json({ message: 'Investment not found' });
    res.json(investment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
