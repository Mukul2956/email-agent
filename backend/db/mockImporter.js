const fs = require('fs').promises;
const path = require('path');
const { bulkCreateEmails } = require('./emails');

/**
 * Mock Inbox Importer
 * Imports mock email data into the database
 */

// Import mock inbox from JSON file
const importMockInbox = async (jsonFilePath) => {
  try {
    // Read the JSON file
    const fullPath = path.resolve(jsonFilePath);
    const jsonData = await fs.readFile(fullPath, 'utf-8');
    const mockEmails = JSON.parse(jsonData);

    // Transform mock emails to database format
    const emailsToInsert = mockEmails.map(email => ({
      sender: email.sender?.email || email.sender,
      receiver: email.receiver || 'user@example.com',
      subject: email.subject,
      body: email.body,
      receivedAt: new Date(email.timestamp || email.receivedAt || Date.now()),
      category: null, // Initially no category
      actionItems: [], // Initially no action items
      processed: false, // Not processed initially
      starred: email.starred || false,
      read: email.read || false
    }));

    // Insert into database
    const result = await bulkCreateEmails(emailsToInsert);
    console.log(`✅ Successfully imported ${emailsToInsert.length} emails into database`);
    
    return {
      success: true,
      imported: emailsToInsert.length,
      message: `Successfully imported ${emailsToInsert.length} emails`
    };

  } catch (error) {
    console.error('❌ Error importing mock inbox:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to import mock inbox'
    };
  }
};

// Import from the existing mock_inbox.json file
const importMockInboxFromData = async () => {
  const mockInboxPath = path.join(__dirname, '..', 'data', 'mock_inbox.json');
  return await importMockInbox(mockInboxPath);
};

// Generate sample emails if no JSON file exists
const generateSampleEmails = async (count = 20) => {
  const sampleEmails = [];
  const senders = [
    { name: 'Sarah Chen', email: 'sarah.chen@techcorp.com' },
    { name: 'Marketing Team', email: 'marketing@company.com' },
    { name: 'John Smith', email: 'j.smith@business.com' },
    { name: 'Newsletter', email: 'no-reply@newsletter.com' },
    { name: 'Amazon', email: 'orders@amazon.com' },
    { name: 'GitHub', email: 'notifications@github.com' },
    { name: 'Bank Alert', email: 'alerts@bank.com' },
    { name: 'Mom', email: 'mom@family.com' },
    { name: 'Design Team', email: 'design@agency.com' },
    { name: 'LinkedIn', email: 'notifications@linkedin.com' }
  ];

  const subjects = [
    'Q4 Marketing Campaign Review',
    'Your Amazon order has shipped',
    'Weekly Design Review Meeting',
    'Bank Account Alert: Transaction Processed',
    'Family Dinner This Sunday',
    'GitHub: Pull Request Merged',
    'Newsletter: Latest Tech Updates',
    'Project Deadline Reminder',
    'Meeting Notes from Yesterday',
    'Invoice Payment Required'
  ];

  const bodies = [
    'Hi there,\n\nI wanted to follow up on our marketing campaign review for Q4. We need to discuss the budget allocation and timeline.\n\nBest regards,\nSarah',
    'Your order #12345 has been shipped and should arrive by Friday. Track your package with the provided link.\n\nThanks for shopping with us!',
    'The weekly design review is scheduled for tomorrow at 2 PM. Please prepare your mockups and be ready to present.\n\nSee you there!',
    'A transaction of $150.00 was processed on your account ending in 1234. If this was not you, please contact us immediately.',
    'Hey honey,\n\nDon\'t forget about family dinner this Sunday at 6 PM. Let me know if you can make it!\n\nLove,\nMom',
    'Your pull request "Fix authentication bug" has been merged into the main branch. Great work!\n\nHappy coding!',
    'This week in tech: New AI developments, startup funding rounds, and the latest in web development.\n\nRead more in our newsletter.',
    'Reminder: The project deadline is approaching next week. Please ensure all deliverables are ready for review.',
    'Here are the notes from yesterday\'s meeting. Please review and let me know if I missed anything important.',
    'Invoice #INV-2023-001 is now due. Please process payment within 30 days to avoid late fees.'
  ];

  for (let i = 0; i < count; i++) {
    const sender = senders[i % senders.length];
    const subject = subjects[i % subjects.length];
    const body = bodies[i % bodies.length];
    
    sampleEmails.push({
      sender: sender.email,
      receiver: 'user@example.com',
      subject: subject,
      body: body,
      receivedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
      category: null,
      actionItems: [],
      processed: false,
      starred: Math.random() > 0.8,
      read: Math.random() > 0.6
    });
  }

  const result = await bulkCreateEmails(sampleEmails);
  console.log(`✅ Successfully generated and imported ${count} sample emails`);
  
  return {
    success: true,
    imported: count,
    message: `Successfully generated and imported ${count} sample emails`
  };
};

module.exports = {
  importMockInbox,
  importMockInboxFromData,
  generateSampleEmails
};