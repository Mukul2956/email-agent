require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function populateDatabase() {
  try {
    console.log('🚀 Starting database population...');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await prisma.chatHistory.deleteMany({});
    await prisma.draft.deleteMany({});
    await prisma.email.deleteMany({});
    await prisma.prompt.deleteMany({});

    // Load mock emails
    const mockDataPath = path.join(__dirname, '../data/mock_inbox.json');
    const mockEmails = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));

    console.log('📧 Inserting mock emails...');
    for (const emailData of mockEmails) {
      await prisma.email.create({
        data: {
          sender: `${emailData.sender.name} <${emailData.sender.email}>`,
          senderName: emailData.sender.name,
          senderEmail: emailData.sender.email,
          senderAvatar: emailData.sender.avatar,
          receiver: 'user@example.com', // Default receiver
          subject: emailData.subject,
          body: emailData.body,
          category: emailData.category,
          actionItems: emailData.actionItems,
          receivedAt: new Date(emailData.timestamp),
          processed: emailData.category !== null && emailData.category !== '',
          starred: false,
          read: emailData.read || false,
        },
      });
    }

    // Insert default prompts
    console.log('🤖 Inserting default prompts...');
    const defaultPrompts = [
      {
        type: 'email_categorization',
        title: 'Email Categorization',
        promptBody: 'Analyze the following email and categorize it into one of these categories: Work, Personal, Shopping, Finance, Education, Social, Newsletter, Spam, or Other. Consider the sender, subject, and content to make an accurate categorization. Respond with only the category name.'
      },
      {
        type: 'email_processing',
        title: 'Email Processing',
        promptBody: 'Process this email and extract key information including: category, action items, and importance level. Return a JSON object with these fields.'
      },
      {
        type: 'draft_generation',
        title: 'Draft Generation',
        promptBody: 'Generate a professional email response based on the context provided. Make it concise, polite, and appropriate for the situation.'
      }
    ];

    for (const promptData of defaultPrompts) {
      await prisma.prompt.create({
        data: promptData
      });
    }

    console.log('✅ Database populated successfully!');
    console.log(`📊 Inserted ${mockEmails.length} emails and ${defaultPrompts.length} prompts`);

  } catch (error) {
    console.error('❌ Error populating database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
populateDatabase();