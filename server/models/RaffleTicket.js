const mongoose = require('mongoose');

const raffleTicketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ticketNumber: { type: Number, required: true },
    status: { type: String, default: 'pending' },
    proofOfPayment: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RaffleTicket', raffleTicketSchema);
