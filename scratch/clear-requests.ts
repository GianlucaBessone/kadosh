import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL="?([^"\n\r]+)"?/);
const dbUrl = dbUrlMatch ? dbUrlMatch[1] : '';

if (!dbUrl) {
  throw new Error('DATABASE_URL not found in .env');
}

process.env.DATABASE_URL = dbUrl;

const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.prayerInteraction.deleteMany({});
  await prisma.prayerRequest.deleteMany({});
  console.log('Deleted all prayer requests and interactions.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
