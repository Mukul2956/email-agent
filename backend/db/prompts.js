const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Prompts Database Service
 * Handles all prompt-related database operations
 */

// Get all prompts
const getPrompts = async () => {
  return await prisma.prompt.findMany({
    orderBy: { createdAt: 'asc' }
  });
};

// Get prompt by type
const getPromptByType = async (type) => {
  return await prisma.prompt.findUnique({
    where: { type }
  });
};

// Get prompt by ID
const getPromptById = async (id) => {
  return await prisma.prompt.findUnique({
    where: { id }
  });
};

// Create new prompt
const createPrompt = async (promptData) => {
  return await prisma.prompt.create({
    data: {
      type: promptData.type,
      title: promptData.title,
      promptBody: promptData.promptBody
    }
  });
};

// Update prompt
const updatePrompt = async (id, updates) => {
  return await prisma.prompt.update({
    where: { id },
    data: {
      ...updates,
      updatedAt: new Date()
    }
  });
};

// Update prompt by type
const updatePromptByType = async (type, updates) => {
  return await prisma.prompt.update({
    where: { type },
    data: {
      ...updates,
      updatedAt: new Date()
    }
  });
};

// Delete prompt
const deletePrompt = async (id) => {
  return await prisma.prompt.delete({
    where: { id }
  });
};

// Delete prompt by type
const deletePromptByType = async (type) => {
  return await prisma.prompt.delete({
    where: { type }
  });
};

// Reset to default prompts
const resetToDefaultPrompts = async () => {
  // Delete all existing prompts
  await prisma.prompt.deleteMany({});
  
  // Insert default prompts
  const defaultPrompts = [
    {
      type: 'categorization',
      title: 'Email Categorization',
      promptBody: `Analyze the email content and sender information to categorize it into one of the following categories:
- Work: Professional emails, meetings, projects, tasks
- Personal: Friends, family, personal matters
- Shopping: Orders, receipts, shipping notifications
- Social: Social media, newsletters, community updates
- Finance: Banking, invoices, payments
- Design: Design-related discussions, feedback, assets
- Newsletter: Newsletters, updates, announcements

Return only the category name.`
    },
    {
      type: 'action_items',
      title: 'Action Items Extraction',
      promptBody: `Extract actionable items from the email that require a response or action from the recipient.

For each action item:
1. Be specific and concise
2. Include deadlines if mentioned
3. Focus on what needs to be done
4. Ignore marketing or informational content

Return a JSON array of action items, or an empty array if none exist.`
    },
    {
      type: 'auto_reply',
      title: 'Auto Reply Generation',
      promptBody: `Generate a professional and contextually appropriate email reply based on the original email content.

Guidelines:
1. Match the tone of the original email (formal/casual)
2. Address all questions or requests mentioned
3. Be concise but complete
4. Include appropriate greeting and closing
5. Leave placeholders [DETAILS] where specific information is needed

Generate a draft reply that can be edited before sending.`
    }
  ];

  return await prisma.prompt.createMany({
    data: defaultPrompts
  });
};

// Get prompts as key-value object (for backward compatibility)
const getPromptsAsObject = async () => {
  const prompts = await getPrompts();
  const promptsObject = {};
  
  prompts.forEach(prompt => {
    promptsObject[prompt.type] = prompt.promptBody;
  });

  return promptsObject;
};

module.exports = {
  getPrompts,
  getPromptByType,
  getPromptById,
  createPrompt,
  updatePrompt,
  updatePromptByType,
  deletePrompt,
  deletePromptByType,
  resetToDefaultPrompts,
  getPromptsAsObject
};