"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PACKAGE_META = exports.PACKAGES = void 0;
const express_1 = require("express");
/**
 * Central package definitions used by the server.
 * Keep names and amounts here — frontend will fetch /api/packages so they match exactly.
 * Adjust values to match the investment tiers you want to present.
 */
exports.PACKAGES = {
    'Starter Bunny': 200,
    'Junior Hopper': 500,
    'Silver Rabbit': 1000,
    'Gold Rabbit': 2000,
    'Platinum Hare': 5000,
    'Diamond Warren': 10000,
    'Satin': 300,
    'Silver Fox': 600,
    'Beveran': 900,
};
/**
 * Per-package metadata for plans that have custom daily rates and durations.
 * Packages not listed here fall back to the default accrual rate and maturity period.
 */
exports.PACKAGE_META = {
    'Satin': { dailyRate: 0.05, durationDays: 30, compounding: false },
    'Silver Fox': { dailyRate: 0.05, durationDays: 30, compounding: false },
    'Beveran': { dailyRate: 0.05, durationDays: 30, compounding: false },
};
const router = (0, express_1.Router)();
// GET /api/packages
// Returns an array of { name, amount } for frontend to display/select.
router.get('/', (_req, res) => {
    const list = Object.entries(exports.PACKAGES).map(([name, amount]) => ({ name, amount }));
    res.json(list);
});
exports.default = router;
