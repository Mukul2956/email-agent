const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Email Database Service
 * Handles all email-related database operations
 */

// Get all emails with optional filters
const getEmails = async (filters = {}) => {
  const where = {};
  
  if (filters.category) where.category = filters.category;
  if (filters.processed !== undefined) where.processed = filters.processed;
  if (filters.starred !== undefined) where.starred = filters.starred;
  if (filters.read !== undefined) where.read = filters.read;
  if (filters.sender) where.sender = { contains: filters.sender, mode: 'insensitive' };
  if (filters.subject) where.subject = { contains: filters.subject, mode: 'insensitive' };

  return await prisma.email.findMany({
    where,
    orderBy: { receivedAt: 'desc' },
    take: filters.limit || undefined,
    skip: filters.offset || undefined
  });
};

// Get single email by ID
const getEmailById = async (id) => {
  return await prisma.email.findUnique({
    where: { id },
    include: {
      drafts: true,
      chatHistory: {
        orderBy: { timestamp: 'asc' }
      }
    }
  });
};

// Create new email
const createEmail = async (emailData) => {
  return await prisma.email.create({
    data: {
      sender: emailData.sender,
      receiver: emailData.receiver,
      subject: emailData.subject,
      body: emailData.body,
      receivedAt: emailData.receivedAt || new Date(),
      category: emailData.category || null,
      actionItems: emailData.actionItems || [],
      processed: emailData.processed || false,
      starred: emailData.starred || false,
      read: emailData.read || false
    }
  });
};

// Update email
const updateEmail = async (id, updates) => {
  return await prisma.email.update({
    where: { id },
    data: {
      ...updates,
      updatedAt: new Date()
    }
  });
};

// Update email category
const updateEmailCategory = async (id, category) => {
  return await prisma.email.update({
    where: { id },
    data: {
      category,
      processed: true,
      updatedAt: new Date()
    }
  });
};

// Update email action items
const updateEmailActionItems = async (id, actionItems) => {
  return await prisma.email.update({
    where: { id },
    data: {
      actionItems,
      processed: true,
      updatedAt: new Date()
    }
  });
};

// Mark email as read/unread
const markEmailAsRead = async (id, read = true) => {
  return await prisma.email.update({
    where: { id },
    data: { read, updatedAt: new Date() }
  });
};

// Star/unstar email
const starEmail = async (id, starred = true) => {
  return await prisma.email.update({
    where: { id },
    data: { starred, updatedAt: new Date() }
  });
};

// Delete email
const deleteEmail = async (id) => {
  return await prisma.email.delete({
    where: { id }
  });
};

// Search emails
const searchEmails = async (query, filters = {}) => {
  const where = {
    OR: [
      { subject: { contains: query, mode: 'insensitive' } },
      { body: { contains: query, mode: 'insensitive' } },
      { sender: { contains: query, mode: 'insensitive' } }
    ]
  };

  if (filters.category) where.category = filters.category;
  if (filters.processed !== undefined) where.processed = filters.processed;

  return await prisma.email.findMany({
    where,
    orderBy: { receivedAt: 'desc' },
    take: filters.limit || 50
  });
};

// Get emails by category
const getEmailsByCategory = async (category, limit = 50) => {
  return await prisma.email.findMany({
    where: { category },
    orderBy: { receivedAt: 'desc' },
    take: limit
  });
};

// Bulk import emails (for mock data)
const bulkCreateEmails = async (emailsArray) => {
  return await prisma.email.createMany({
    data: emailsArray,
    skipDuplicates: true
  });
};

// Get unprocessed emails
const getUnprocessedEmails = async () => {
  return await prisma.email.findMany({
    where: { processed: false },
    orderBy: { receivedAt: 'desc' }
  });
};

module.exports = {
  getEmails,
  getEmailById,
  createEmail,
  updateEmail,
  updateEmailCategory,
  updateEmailActionItems,
  markEmailAsRead,
  starEmail,
  deleteEmail,
  searchEmails,
  getEmailsByCategory,
  bulkCreateEmails,
  getUnprocessedEmails
};