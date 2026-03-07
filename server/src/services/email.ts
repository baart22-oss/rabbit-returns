import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
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

export async function sendAdminNewProof(
  type: 'investment' | 'raffle',
  userId: string,
  itemId: string,
  filename?: string
): Promise<void> {
  const fileLine = filename ? `\nFilename: ${filename}\nURL: /uploads/${filename}` : '';
  await transporter.sendMail({
    from,
    to: adminEmail,
    subject: `New proof of payment uploaded (${type})`,
    text: `A new ${type} proof has been uploaded.\nUser ID: ${userId}\nItem ID: ${itemId}${fileLine}\n\nPlease log in to review.`,
  });
}

// ... other email functions unchanged
export async function sendUserInvestmentApproved(
  email: string,
  packageName: string,
  amount: number
): Promise<void> {
  await transporter.sendMail({
    from,
    to: email,
    subject: 'Your investment has been approved!',
    text: `Great news! Your ${packageName} investment of R${amount} has been approved and is now active. It will mature in 180 days.`,
  });
}

export async function sendUserInvestmentRejected(
  email: string,
  packageName: string,
  reason?: string
): Promise<void> {
  await transporter.sendMail({
    from,
    to: email,
    subject: 'Your investment has been rejected',
    text: `Unfortunately your ${packageName} investment has been rejected.${reason ? `\n\nReason: ${reason}` : ''}`,
  });
}

export async function sendUserWithdrawalUpdate(
  email: string,
  amount: number,
  status: string,
  note?: string
): Promise<void> {
  await transporter.sendMail({
    from,
    to: email,
    subject: `Withdrawal request ${status}`,
    text: `Your withdrawal request of R${amount} has been updated to: ${status}.${note ? `\n\nNote: ${note}` : ''}`,
  });
}

export async function sendUserRaffleApproved(email: string): Promise<void> {
  await transporter.sendMail({
    from,
    to: email,
    subject: 'Your raffle ticket has been approved!',
    text: 'Your raffle ticket has been approved and is now active. Good luck!',
  });
}

export async function sendUserRaffleRejected(email: string, reason?: string): Promise<void> {
  await transporter.sendMail({
    from,
    to: email,
    subject: 'Your raffle ticket has been rejected',
    text: `Your raffle ticket has been rejected.${reason ? `\n\nReason: ${reason}` : ''}`,
  });
}
