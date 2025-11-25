const express = require('express');
const router = express.Router();

// Import database services
const { 
  getDrafts,
  getDraftById,
  createDraft,
  updateDraft,
  deleteDraft,
  getDraftsForEmail,
  saveDraft
} = require('../db/drafts');

// Import original controller for fallback
const DraftController = require('../controllers/draftController');
const draftController = new DraftController();

/**
 * Database-integrated draft routes
 */

// GET /api/drafts - Get all drafts
router.get('/', async (req, res) => {
  try {
    const { emailId, limit } = req.query;
    
    const filters = {};
    if (emailId) filters.emailId = emailId;
    if (limit) filters.limit = parseInt(limit);

    const drafts = await getDrafts(filters);
    
    // Transform drafts to match frontend format
    const transformedDrafts = drafts.map(draft => ({
      id: draft.id,
      emailId: draft.emailId,
      draftBody: draft.draftBody,
      subject: draft.subject,
      recipient: draft.recipient,
      timestamp: new Date(draft.createdAt).toLocaleString(),
      createdAt: draft.createdAt,
      email: draft.email ? {
        id: draft.email.id,
        subject: draft.email.subject,
        sender: draft.email.sender
      } : null
    }));
    
    res.json({
      success: true,
      data: transformedDrafts,
      count: transformedDrafts.length
    });
  } catch (error) {
    console.error('Database error getting drafts:', error);
    
    // Fallback to original method
    return draftController.getAllDrafts(req, res);
  }
});

// GET /api/drafts/:id - Get draft by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const draft = await getDraftById(id);
    
    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found'
      });
    }

    const transformedDraft = {
      id: draft.id,
      emailId: draft.emailId,
      draftBody: draft.draftBody,
      subject: draft.subject,
      recipient: draft.recipient,
      timestamp: new Date(draft.createdAt).toLocaleString(),
      createdAt: draft.createdAt,
      email: draft.email
    };

    res.json({
      success: true,
      data: transformedDraft
    });
  } catch (error) {
    console.error('Database error getting draft:', error);
    
    // Fallback to original method
    return draftController.getDraft(req, res);
  }
});

// POST /api/drafts - Create new draft
router.post('/', async (req, res) => {
  try {
    const { emailId, draftBody, subject, recipient } = req.body;
    
    const newDraft = await createDraft({
      emailId,
      draftBody,
      subject,
      recipient
    });
    
    const transformedDraft = {
      id: newDraft.id,
      emailId: newDraft.emailId,
      draftBody: newDraft.draftBody,
      subject: newDraft.subject,
      recipient: newDraft.recipient,
      timestamp: new Date(newDraft.createdAt).toLocaleString(),
      createdAt: newDraft.createdAt
    };
    
    res.status(201).json({
      success: true,
      data: transformedDraft,
      message: 'Draft created successfully'
    });
  } catch (error) {
    console.error('Error creating draft:', error);
    
    // Fallback to original method
    return draftController.createDraft(req, res);
  }
});

// PUT /api/drafts/:id - Update draft
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const updatedDraft = await updateDraft(id, updates);
    
    res.json({
      success: true,
      data: updatedDraft,
      message: 'Draft updated successfully'
    });
  } catch (error) {
    console.error('Error updating draft:', error);
    
    // Fallback to original method
    return draftController.updateDraft(req, res);
  }
});

// DELETE /api/drafts/:id - Delete draft
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await deleteDraft(id);
    
    res.json({
      success: true,
      message: 'Draft deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting draft:', error);
    
    // Fallback to original method
    return draftController.deleteDraft(req, res);
  }
});

// GET /api/drafts/for-email/:emailId - Get drafts for specific email
router.get('/for-email/:emailId', async (req, res) => {
  try {
    const { emailId } = req.params;
    const { limit } = req.query;
    
    const drafts = await getDraftsForEmail(emailId, limit ? parseInt(limit) : 10);
    
    const transformedDrafts = drafts.map(draft => ({
      id: draft.id,
      emailId: draft.emailId,
      draftBody: draft.draftBody,
      subject: draft.subject,
      recipient: draft.recipient,
      timestamp: new Date(draft.createdAt).toLocaleString(),
      createdAt: draft.createdAt
    }));
    
    res.json({
      success: true,
      data: transformedDrafts,
      count: transformedDrafts.length
    });
  } catch (error) {
    console.error('Error getting drafts for email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get drafts for email',
      error: error.message
    });
  }
});

// POST /api/drafts/generate - Generate AI draft (save to database)
router.post('/generate', async (req, res) => {
  try {
    const { emailId, type, customPrompt } = req.body;
    
    // This would integrate with the existing AI generation logic
    // but save the result to the database instead of JSON files
    
    // For now, fallback to original method and then save to DB
    // You can enhance this later to directly use database
    return draftController.generateReply(req, res);
    
  } catch (error) {
    console.error('Error generating draft:', error);
    
    // Fallback to original method
    return draftController.generateReply(req, res);
  }
});

module.exports = router;