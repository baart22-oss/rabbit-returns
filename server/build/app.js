"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const node_cron_1 = __importDefault(require("node-cron"));
const client_1 = __importDefault(require("./prisma/client"));
const accrual_1 = require("./services/accrual");
// Routers
const auth_1 = __importDefault(require("./routes/auth"));
const admin_1 = __importDefault(require("./routes/admin"));
const banking_1 = __importDefault(require("./routes/banking"));
const investments_1 = __importDefault(require("./routes/investments"));
const payments_1 = __importDefault(require("./routes/payments"));
const raffle_1 = __importDefault(require("./routes/raffle"));
const withdrawals_1 = __importDefault(require("./routes/withdrawals"));
const packages_1 = __importDefault(require("./routes/packages"));
const referrals_1 = __importDefault(require("./routes/referrals"));
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: true
}));
// Ensure uploads directory exists and is writable
const uploadsDir = path_1.default.join(process.cwd(), 'uploads');
try {
    if (!fs_1.default.existsSync(uploadsDir)) {
        fs_1.default.mkdirSync(uploadsDir, { recursive: true });
        console.log('Created uploads directory at', uploadsDir);
    }
}
catch (err) {
    console.error('Failed to create uploads directory:', err);
}
// Serve uploaded files at /uploads/*
app.use('/uploads', express_1.default.static(uploadsDir));
// Fallback route to serve bare filenames from uploads (in case frontend requests bare filename)
app.get('/:filename', (req, res, next) => {
    const { filename } = req.params;
    if (!filename)
        return next();
    if (filename.startsWith('api') || filename.startsWith('uploads') || filename.includes('/')) {
        return next();
    }
    const allowedExt = /\.(png|jpg|jpeg|gif|webp|pdf|txt)$/i;
    if (!allowedExt.test(filename))
        return next();
    const filePath = path_1.default.join(uploadsDir, filename);
    fs_1.default.access(filePath, fs_1.default.constants.R_OK, (err) => {
        if (err)
            return next();
        return res.sendFile(filePath);
    });
});
// Route registration (API routes)
app.use('/api/auth', auth_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/banking', banking_1.default);
app.use('/api/investments', investments_1.default);
app.use('/api/payments', payments_1.default);
app.use('/api/raffle', raffle_1.default);
app.use('/api/withdrawals', withdrawals_1.default);
// Newly added routes
app.use('/api/packages', packages_1.default);
app.use('/api/referrals', referrals_1.default);
app.get('/', (_req, res) => {
    res.send('Backend is running!');
});
// Typed 404 handler
app.use((req, res, _next) => {
    res.status(404).json({ error: 'Not found' });
});
// Typed global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    if (res.headersSent)
        return next(err);
    res.status(500).json({ error: 'Internal server error' });
});
/**
 * Ensure admin user exists using environment variables.
 * This is idempotent: if ADMIN_EMAIL exists, it will not create a duplicate.
 */
async function ensureAdminFromEnv() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const fullName = process.env.ADMIN_FULLNAME || 'Admin';
    if (!email || !password) {
        console.log('ADMIN_EMAIL or ADMIN_PASSWORD not provided — skipping admin creation.');
        return;
    }
    try {
        const existing = await client_1.default.user.findUnique({ where: { email } });
        if (existing) {
            if (existing.role !== 'admin') {
                console.log(`User ${email} exists but is not admin. Skipping creation.`);
            }
            else {
                console.log(`Admin user ${email} already exists. Skipping creation.`);
            }
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        // Generate referralCode (schema requires it for Profile)
        const referralCode = `ADM${(0, uuid_1.v4)().replace(/-/g, '').slice(0, 5).toUpperCase()}`;
        await client_1.default.user.create({
            data: {
                email,
                passwordHash,
                role: 'admin',
                profile: {
                    create: {
                        fullName,
                        referralCode
                    }
                }
            }
        });
        console.log(`Admin user ${email} created from environment variables.`);
    }
    catch (err) {
        console.error('Error ensuring admin user from env:', err);
        // Do not throw so server can still start
    }
}
const PORT = Number(process.env.PORT || 3000);
(async () => {
    await ensureAdminFromEnv();
    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
    // Run accrual once at startup (helps with testing)
    (0, accrual_1.runAccrual)().catch(err => console.error('Initial accrual error:', err));
    // Schedule accrual daily at 00:01 in specified timezone (default Africa/Johannesburg)
    const CRON_TZ = process.env.CRON_TZ || 'Africa/Johannesburg';
    node_cron_1.default.schedule('1 0 * * *', () => {
        console.log(`Running scheduled accrual at 00:01 (${CRON_TZ})`);
        (0, accrual_1.runAccrual)().catch(err => console.error('Scheduled accrual error:', err));
    }, {
        timezone: CRON_TZ
    });
})();
exports.default = app;
