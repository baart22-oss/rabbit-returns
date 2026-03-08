import { Router } from 'express';

/**
 * Central package definitions used by the server.
 * Keep names and amounts here — frontend will fetch /api/packages so they match exactly.
 *
 * Note: If you previously had VALID_PACKAGES in investments.ts, replace it with this
 * or keep them in sync.
 */
export const PACKAGES: Record<string, number> = {
  'Hare Hustler': 1000,
  'Warren Winner': 2000,
  'Burrow Boss': 5000,
  'Colony King': 10000,
};

const router = Router();

// GET /api/packages
// Returns an array of { name, amount } for frontend to display/select.
router.get('/', (_req, res) => {
  const list = Object.entries(PACKAGES).map(([name, amount]) => ({ name, amount }));
  res.json(list);
});

export default router;
