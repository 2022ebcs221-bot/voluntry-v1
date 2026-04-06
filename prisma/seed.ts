// SHUBHAM KUMAR
// 2022ebcs221@online.bits-pilani.ac.in
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  
  const prisma = new PrismaClient({ adapter });

  const password = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@voluntry.com' },
    update: {},
    create: {
      email: 'admin@voluntry.com',
      name: 'Admin',
      password: password,
      role: 'ADMIN',
      status: 'APPROVED',
    },
  });

  console.log('Admin user created:', admin);
  await prisma.$disconnect();
}

main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  });