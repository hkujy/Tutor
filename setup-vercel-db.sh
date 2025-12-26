#!/bin/bash

# Vercel Production Database Setup Script
# This script will:
# 1. Apply Prisma migrations to your Vercel Postgres database
# 2. Seed it with test users (student and tutor)

echo "🚀 Setting up Vercel Production Database"
echo "=========================================="

# Check if we have the DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL not set"
  echo ""
  echo "Please run this script with:"
  echo "  export DATABASE_URL='your-vercel-postgres-url'"
  echo "  ./setup-vercel-db.sh"
  echo ""
  echo "Or get the URL from: vercel env pull .env.production"
  exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Step 1: Apply migrations
echo "📦 Step 1: Applying Prisma migrations..."
npx prisma migrate deploy

if [ $? -ne 0 ]; then
  echo "❌ Migration failed!"
  exit 1
fi

echo "✅ Migrations applied successfully"
echo ""

# Step 2: Seed database
echo "🌱 Step 2: Seeding database with test users..."

node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log('Creating test users...');
  
  // Create student
  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      password: await bcrypt.hash('student123', 10),
      firstName: 'Alex',
      lastName: 'Smith',
      role: 'STUDENT',
    },
  });
  console.log('✅ Student created:', student.email);

  // Create tutor
  const tutor = await prisma.user.upsert({
    where: { email: 'tutor@example.com' },
    update: {},
    create: {
      email: 'tutor@example.com',
      password: await bcrypt.hash('tutor123', 10),
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'TUTOR',
    },
  });
  console.log('✅ Tutor created:', tutor.email);
  
  // Count users
  const userCount = await prisma.user.count();
  console.log(\`\nTotal users in database: \${userCount}\`);
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.\$disconnect();
  });
"

if [ $? -ne 0 ]; then
  echo "❌ Seeding failed!"
  exit 1
fi

echo ""
echo "=========================================="
echo "✅ Database setup complete!"
echo ""
echo "Test accounts created:"
echo "  Student: student@example.com / student123"
echo "  Tutor: tutor@example.com / tutor123"
echo ""
echo "You can now test your Vercel deployment at:"
echo "  https://tutor-sandy.vercel.app/en/login"
echo "=========================================="
