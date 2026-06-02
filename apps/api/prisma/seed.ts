import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: 'Alimentação', icon: 'utensils' },
  { name: 'Transporte', icon: 'car' },
  { name: 'Saúde', icon: 'heart-pulse' },
  { name: 'Lazer', icon: 'gamepad-2' },
  { name: 'Moradia', icon: 'home' },
  { name: 'Educação', icon: 'graduation-cap' },
  { name: 'Outros', icon: 'circle-ellipsis' },
];

async function main() {
  console.log('🌱 Starting seed...');

  const email = 'admin@financeapp.com';
  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const user = await prisma.user.create({
      data: {
        email,
        name: 'Admin',
        password: await bcrypt.hash('admin123', 10),
        isVerified: true,
        categories: { create: DEFAULT_CATEGORIES },
      },
    });
    console.log(`✅ Test user created: ${user.email} / admin123`);
  } else {
    await prisma.user.update({
      where: { email },
      data: { isVerified: true },
    });
    console.log(`ℹ️  Test user already exists and is now verified: ${email}`);
  }

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
