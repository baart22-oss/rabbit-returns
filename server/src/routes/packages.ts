import { Router } from 'express';

/**
 * Central package definitions used by the server.
 * Keep names and amounts here — frontend will fetch /api/packages so they match exactly.
 * Adjust values to match the investment tiers you want to present.
 */
export const PACKAGES: Record<string, number> = {
  'Starter Bunny': 200,
  'Junior Hopper': 500,
  'Silver Rabbit': 1000,
  'Gold Rabbit': 2000,
  'Platinum Hare': 5000,
  'Diamond Warren': 10000,
};

const router = Router();

// GET /api/packages
// Returns an array of { name, amount } for frontend to display/select.
router.get('/', (_req, res) => {
  const list = Object.entries(PACKAGES).map(([name, amount]) => ({ name, amount }));
  res.json(list);
});

export default router;
