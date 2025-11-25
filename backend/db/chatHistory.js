const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Chat History Database Service
 * Handles all chat history-related database operations
 */

// Get chat history for an email
const getChatHistory = async (emailId) => {
  return await prisma.chatHistory.findMany({
    where: { emailId },
    orderBy: { timestamp: 'asc' }
  });
};

// Add chat message
const addChatMessage = async (emailId, role, message) => {
  return await prisma.chatHistory.create({
    data: {
      emailId,
      role,
      message
    }
  });
};

// Get recent conversations
const getRecentConversations = async (limit = 50) => {
  return await prisma.chatHistory.findMany({
    take: limit,
    orderBy: { timestamp: 'desc' },
    include: {
      email: {
        select: {
          id: true,
          subject: true,
          sender: true
        }
      }
    }
  });
};

// Delete chat history for email
const deleteChatHistory = async (emailId) => {
  return await prisma.chatHistory.deleteMany({
    where: { emailId }
  });
};

// Get conversation summary
const getConversationSummary = async (emailId) => {
  const messages = await getChatHistory(emailId);
  return {
    emailId,
    messageCount: messages.length,
    lastMessage: messages[messages.length - 1] || null,
    messages
  };
};

module.exports = {
  getChatHistory,
  addChatMessage,
  getRecentConversations,
  deleteChatHistory,
  getConversationSummary
};