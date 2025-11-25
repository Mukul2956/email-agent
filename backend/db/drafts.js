const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Drafts Database Service
 * Handles all draft-related database operations
 */

// Get all drafts
const getDrafts = async (filters = {}) => {
  const where = {};
  
  if (filters.emailId) where.emailId = filters.emailId;

  return await prisma.draft.findMany({
    where,
    include: {
      email: {
        select: {
          id: true,
          subject: true,
          sender: true,
          receivedAt: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit || undefined
  });
};

// Get draft by ID
const getDraftById = async (id) => {
  return await prisma.draft.findUnique({
    where: { id },
    include: {
      email: true
    }
  });
};

// Create new draft
const createDraft = async (draftData) => {
  return await prisma.draft.create({
    data: {
      emailId: draftData.emailId || null,
      draftBody: draftData.draftBody,
      subject: draftData.subject || null,
      recipient: draftData.recipient || null
    }
  });
};

// Update draft
const updateDraft = async (id, updates) => {
  return await prisma.draft.update({
    where: { id },
    data: {
      ...updates,
      updatedAt: new Date()
    }
  });
};

// Delete draft
const deleteDraft = async (id) => {
  return await prisma.draft.delete({
    where: { id }
  });
};

// Get drafts for specific email
const getDraftsForEmail = async (emailId, limit = 10) => {
  return await prisma.draft.findMany({
    where: { emailId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      email: {
        select: {
          subject: true,
          sender: true
        }
      }
    }
  });
};

// Save AI generated draft
const saveDraft = async (emailId, draftBody, subject = null, recipient = null) => {
  return await createDraft({
    emailId,
    draftBody,
    subject,
    recipient
  });
};

// Get recent drafts
const getRecentDrafts = async (limit = 20) => {
  return await prisma.draft.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      email: {
        select: {
          id: true,
          subject: true,
          sender: true,
          receivedAt: true
        }
      }
    }
  });
};

// Delete drafts for specific email
const deleteDraftsForEmail = async (emailId) => {
  return await prisma.draft.deleteMany({
    where: { emailId }
  });
};

// Count drafts
const countDrafts = async (filters = {}) => {
  const where = {};
  if (filters.emailId) where.emailId = filters.emailId;

  return await prisma.draft.count({ where });
};

module.exports = {
  getDrafts,
  getDraftById,
  createDraft,
  updateDraft,
  deleteDraft,
  getDraftsForEmail,
  saveDraft,
  getRecentDrafts,
  deleteDraftsForEmail,
  countDrafts
};