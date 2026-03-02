const express = require('express');
const Investment = require('../models/Investment');
const Withdrawal = require('../models/Withdrawal');
const RaffleTicket = require('../models/RaffleTicket');
const Profile = require('../models/Profile');
const BankingDetails = require('../models/BankingDetails');
const ReferralCommission = require('../models/ReferralCommission');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect, adminOnly);

// GET /api/admin/investments
router.get('/investments', async (req, res) => {
  try {
    const investments = await Investment.find().sort({ createdAt: -1 }).populate('user', 'email');
    res.json(investments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/investments/:id
router.patch('/investments/:id', async (req, res) => {
  try {
    const { status, startedAt, maturesAt } = req.body;
    const investment = await Investment.findByIdAndUpdate(
      req.params.id,
      { status, startedAt, maturesAt },
      { new: true }
    );
    if (!investment) return res.status(404).json({ message: 'Investment not found' });
    res.json(investment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/withdrawals
router.get('/withdrawals', async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find().sort({ createdAt: -1 }).populate('user', 'email');
    res.json(withdrawals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/admin/withdrawals/:id
router.patch('/withdrawals/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const update = { status };
    if (status === 'processed') update.processedAt = new Date();
    const withdrawal = await Withdrawal.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!withdrawal) return res.status(404).json({ message: 'Withdrawal not found' });
    res.json(withdrawal);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/raffle-tickets
router.get('/raffle-tickets', async (req, res) => {
  try {
    const tickets = await RaffleTicket.find().sort({ createdAt: -1 }).populate('user', 'email');
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/profiles
router.get('/profiles', async (req, res) => {
  try {
    const profiles = await Profile.find().sort({ createdAt: -1 }).populate('user', 'email role');
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/banking-details
router.get('/banking-details', async (req, res) => {
  try {
    const details = await BankingDetails.find().populate('user', 'email');
    res.json(details);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/admin/commissions
router.get('/commissions', async (req, res) => {
  try {
    const commissions = await ReferralCommission.find()
      .sort({ createdAt: -1 })
      .populate('user', 'email')
      .populate('fromUser', 'email');
    res.json(commissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/admin/users/:id/make-admin
router.post('/users/:id/make-admin', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: 'admin' }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
