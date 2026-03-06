import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

async function createAdmin() {
  const email = process.argv[2] || "admin@yourcompany.com";
  const password = process.argv[3] || "YourPassword";
  const fullName = process.argv[4] || "Administrator";

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.error(`❌ User already exists`);
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
