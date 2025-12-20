import { PrismaClient } from '@prisma/client'

async function main() {
  const dbUrl = process.env.DATABASE_URL || 'UNDEFINED';
  console.log(`DATABASE_URL in script: ${dbUrl}`);

  if (dbUrl === 'UNDEFINED') {
    console.error("DATABASE_URL is not set!");
    return;
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT current_database();`;
    console.log(`Connected to database: ${JSON.stringify(result)}`);
    console.log("Prisma client successfully connected using provided URL.");
  } catch (e) {
    console.error("Failed to connect to database using provided URL:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
