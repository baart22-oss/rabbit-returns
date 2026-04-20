"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAdminNewProof = sendAdminNewProof;
exports.sendUserInvestmentApproved = sendUserInvestmentApproved;
exports.sendUserInvestmentRejected = sendUserInvestmentRejected;
exports.sendUserWithdrawalUpdate = sendUserWithdrawalUpdate;
exports.sendUserRaffleApproved = sendUserRaffleApproved;
exports.sendUserRaffleRejected = sendUserRaffleRejected;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
const from = process.env.SMTP_FROM ?? 'Rabbit Returns <noreply@example.com>';
const adminEmail = process.env.ADMIN_NOTIFY_EMAIL ?? '';
async function sendAdminNewProof(type, userId, itemId, filename) {
    const fileLine = filename ? `\nFilename: ${filename}\nURL: /uploads/${filename}` : '';
    await transporter.sendMail({
        from,
        to: adminEmail,
        subject: `New proof of payment uploaded (${type})`,
        text: `A new ${type} proof has been uploaded.\nUser ID: ${userId}\nItem ID: ${itemId}${fileLine}\n\nPlease log in to review.`,
    });
}
// ... other email functions unchanged
async function sendUserInvestmentApproved(email, packageName, amount) {
    await transporter.sendMail({
        from,
        to: email,
        subject: 'Your investment has been approved!',
        text: `Great news! Your ${packageName} investment of R${amount} has been approved and is now active. It will mature in 180 days.`,
    });
}
async function sendUserInvestmentRejected(email, packageName, reason) {
    await transporter.sendMail({
        from,
        to: email,
        subject: 'Your investment has been rejected',
        text: `Unfortunately your ${packageName} investment has been rejected.${reason ? `\n\nReason: ${reason}` : ''}`,
    });
}
async function sendUserWithdrawalUpdate(email, amount, status, note) {
    await transporter.sendMail({
        from,
        to: email,
        subject: `Withdrawal request ${status}`,
        text: `Your withdrawal request of R${amount} has been updated to: ${status}.${note ? `\n\nNote: ${note}` : ''}`,
    });
}
async function sendUserRaffleApproved(email) {
    await transporter.sendMail({
        from,
        to: email,
        subject: 'Your raffle ticket has been approved!',
        text: 'Your raffle ticket has been approved and is now active. Good luck!',
    });
}
async function sendUserRaffleRejected(email, reason) {
    await transporter.sendMail({
        from,
        to: email,
        subject: 'Your raffle ticket has been rejected',
        text: `Your raffle ticket has been rejected.${reason ? `\n\nReason: ${reason}` : ''}`,
    });
}
