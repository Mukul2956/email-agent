require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('🧹 Clearing all data from database...');

    // Clear all data
    await prisma.chatHistory.deleteMany({});
    await prisma.draft.deleteMany({});
    await prisma.email.deleteMany({});
    await prisma.prompt.deleteMany({});

    console.log('✅ Database cleared successfully!');
    console.log('📭 Inbox is now empty - ready for Load Inbox demonstration');

  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
clearDatabase();