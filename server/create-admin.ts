import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function createAdmin() {
  // Fetch admin credentials from env variables or CLI arguments
  const email = process.env.ADMIN_EMAIL || process.argv[2] || "admin@yourcompany.com";
  const password = process.env.ADMIN_PASSWORD || process.argv[3] || "YourPassword";
  const fullName = process.env.ADMIN_FULLNAME || process.argv[4] || "Administrator";
  const scriptApiKey = process.env.SECRET_API_KEY || "";

  // Optional: CLI override for secret API key
  const cliApiKey = process.argv[5] || "";
  // Ensure script is only run if SECRET_API_KEY matches (prevent accidental runs)
  if (scriptApiKey && cliApiKey && scriptApiKey !== cliApiKey) {
    console.error("❌ SECRET_API_KEY mismatch, aborting admin creation.");
    process.exit(1);
  }

  if (!email || !password || !fullName) {
    console.error("❌ Missing admin email, password, or full name.");
    process.exit(1);
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.error(`❌ User already exists`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = uuidv4();
  const referralCode = "ADMIN" + uuidv4().replace(/-/g, "").slice(0, 4).toUpperCase();

  const user = await prisma.user.create({
    data: {
      id: userId,
      email,
      passwordHash,
      role: "admin",
      profile: {
        create: {
          id: uuidv4(),
          fullName,
          referralCode,
        },
      },
    },
    include: { profile: true },
  });

  console.log(`✅ Admin created: ${user.email}`);
  await prisma.$disconnect();
}

createAdmin().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
