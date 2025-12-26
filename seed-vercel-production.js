const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Use the Vercel Postgres direct connection URL
const DATABASE_URL = 'postgres://b9795591239079b860bf09d6e0ebaa155d7d9e202906ddf27142e4c5d2413841:sk_EQYYh-lu1cuCuagwPP-0B@db.prisma.io:5432/postgres?sslmode=require';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: DATABASE_URL
        }
    }
});

async function main() {
    console.log('🌱 Seeding Vercel production database...\n');
    console.log('Database:', DATABASE_URL.replace(/:[^:@]+@/, ':****@'), '\n');

    try {
        // Create student
        const student = await prisma.user.upsert({
            where: { email: 'student@example.com' },
            update: {
                password: await bcrypt.hash('student123', 10),
                firstName: 'Alex',
                lastName: 'Smith',
            },
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
            update: {
                password: await bcrypt.hash('tutor123', 10),
                firstName: 'Sarah',
                lastName: 'Johnson',
            },
            create: {
                email: 'tutor@example.com',
                password: await bcrypt.hash('tutor123', 10),
                firstName: 'Sarah',
                lastName: 'Johnson',
                role: 'TUTOR',
            },
        });
        console.log('✅ Tutor created:', tutor.email);

        // Count total users
        const userCount = await prisma.user.count();
        console.log(`\n📊 Total users in production database: ${userCount}`);

        // List all users
        const allUsers = await prisma.user.findMany({
            select: {
                email: true,
                firstName: true,
                lastName: true,
                role: true,
            }
        });

        console.log('\n👥 All users:');
        console.table(allUsers);

        console.log('\n✅ Database seeding complete!');
        console.log('\nTest accounts for https://tutor-sandy.vercel.app:');
        console.log('  Student: student@example.com / student123');
        console.log('  Tutor: tutor@example.com / tutor123');
    } catch (error) {
        console.error('❌ Error seeding database:', error.message);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error('Fatal error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
