import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 Running Vercel build preparation for TechFest Hub...');

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || '';

if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
  console.log('📦 PostgreSQL connection string detected. Applying PostgreSQL Prisma schema...');
  if (fs.existsSync('prisma/schema.postgresql.prisma')) {
    fs.copyFileSync('prisma/schema.postgresql.prisma', 'prisma/schema.prisma');
  }
} else {
  console.log('📦 Using standard SQLite Prisma schema...');
}

console.log('⚙️ Generating Prisma Client...');
execSync('npx prisma generate', { stdio: 'inherit' });

console.log('🔨 Building frontend with Vite...');
execSync('npx vite build', { stdio: 'inherit' });

console.log('✅ Build completed successfully for Vercel!');
