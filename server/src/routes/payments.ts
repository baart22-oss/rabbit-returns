import { Router } from 'express';

const router = Router();

router.get('/eft-details', (_req, res) => {
  return res.json({
    beneficiaryName: process.env.BENEFICIARY_NAME ?? 'ERoos',
    bank: process.env.BENEFICIARY_BANK ?? 'ABSA',
    accountNumber: process.env.BENEFICIARY_ACCOUNT ?? '',
    branchCode: process.env.BENEFICIARY_BRANCH ?? '632005',
    reference: 'Use your email address as reference',
  });
});

export default router;
