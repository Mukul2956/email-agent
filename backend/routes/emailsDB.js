const express = require('express');
const router = express.Router();

// Import database services
const { 
  getEmails, 
  getEmailById, 
  updateEmailCategory,
  markEmailAsRead,
  starEmail,
  searchEmails,
  getEmailsByCategory 
} = require('../db/emails');
const { importMockInboxFromData, generateSampleEmails } = require('../db/mockImporter');

// Import original controller for fallback
const EmailController = require('../controllers/emailController');
const emailController = new EmailController();

/**
 * Database-integrated email routes
 * These routes use PostgreSQL instead of JSON files
 */

// GET /api/emails - Get all emails from database
router.get('/', async (req, res) => {
  try {
    const { category, processed, starred, read, limit, offset, sender, subject } = req.query;
    
    const filters = {};
    if (category) filters.category = category;
    if (processed !== undefined) filters.processed = processed === 'true';
    if (starred !== undefined) filters.starred = starred === 'true';
    if (read !== undefined) filters.read = read === 'true';
    if (sender) filters.sender = sender;
    if (subject) filters.subject = subject;
    if (limit) filters.limit = parseInt(limit);
    if (offset) filters.offset = parseInt(offset);

    const emails = await getEmails(filters);
    
    // Transform emails to match frontend format
    const transformedEmails = emails.map(email => ({
      id: email.id,
      sender: {
        name: email.sender.split('@')[0].replace(/[.-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        email: email.sender,
        avatar: email.sender.charAt(0).toUpperCase()
      },
      receiver: email.receiver,
      subject: email.subject,
      body: email.body,
      category: email.category,
      categoryColor: getCategoryColor(email.category),
      actionItems: email.actionItems || [],
      timestamp: formatTimestamp(email.receivedAt),
      receivedAt: email.receivedAt,
      processed: email.processed,
      starred: email.starred,
      read: email.read
    }));
    
    res.json({
      success: true,
      data: transformedEmails,
      count: transformedEmails.length
    });
  } catch (error) {
    console.error('Database error getting emails:', error);
    
    // Fallback to original JSON file method
    console.log('Falling back to JSON file method...');
    return emailController.getAllEmails(req, res);
  }
});

// POST /api/emails/load-mock - Load mock inbox into database
router.post('/load-mock', async (req, res) => {
  try {
    const result = await importMockInboxFromData();
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        imported: result.imported
      });
    } else {
      // Generate sample emails if mock data import fails
      const sampleResult = await generateSampleEmails(20);
      res.json(sampleResult);
    }
  } catch (error) {
    console.error('Error loading mock inbox:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load mock inbox',
      error: error.message
    });
  }
});

// GET /api/emails/:id - Get single email
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const email = await getEmailById(id);
    
    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    // Transform email to match frontend format
    const transformedEmail = {
      id: email.id,
      sender: {
        name: email.sender.split('@')[0].replace(/[.-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        email: email.sender,
        avatar: email.sender.charAt(0).toUpperCase()
      },
      receiver: email.receiver,
      subject: email.subject,
      body: email.body,
      category: email.category,
      categoryColor: getCategoryColor(email.category),
      actionItems: email.actionItems || [],
      timestamp: formatTimestamp(email.receivedAt),
      receivedAt: email.receivedAt,
      processed: email.processed,
      starred: email.starred,
      read: email.read,
      drafts: email.drafts || [],
      chatHistory: email.chatHistory || []
    };

    res.json({
      success: true,
      data: transformedEmail
    });
  } catch (error) {
    console.error('Database error getting email:', error);
    
    // Fallback to original method
    return emailController.getEmailById(req, res);
  }
});

// POST /api/emails/:id/update-category - Update email category
router.post('/:id/update-category', async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;
    
    const updatedEmail = await updateEmailCategory(id, category);
    
    res.json({
      success: true,
      data: updatedEmail,
      message: 'Email category updated successfully'
    });
  } catch (error) {
    console.error('Error updating email category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email category',
      error: error.message
    });
  }
});

// POST /api/emails/:id/read - Mark as read
router.post('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedEmail = await markEmailAsRead(id, true);
    
    res.json({
      success: true,
      data: updatedEmail,
      message: 'Email marked as read'
    });
  } catch (error) {
    console.error('Error marking email as read:', error);
    
    // Fallback to original method
    return emailController.markAsRead(req, res);
  }
});

// POST /api/emails/:id/unread - Mark as unread
router.post('/:id/unread', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedEmail = await markEmailAsRead(id, false);
    
    res.json({
      success: true,
      data: updatedEmail,
      message: 'Email marked as unread'
    });
  } catch (error) {
    console.error('Error marking email as unread:', error);
    
    // Fallback to original method
    return emailController.markAsUnread(req, res);
  }
});

// POST /api/emails/:id/star - Star email
router.post('/:id/star', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedEmail = await starEmail(id, true);
    
    res.json({
      success: true,
      data: updatedEmail,
      message: 'Email starred'
    });
  } catch (error) {
    console.error('Error starring email:', error);
    
    // Fallback to original method
    return emailController.starEmail(req, res);
  }
});

// POST /api/emails/:id/unstar - Unstar email
router.post('/:id/unstar', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedEmail = await starEmail(id, false);
    
    res.json({
      success: true,
      data: updatedEmail,
      message: 'Email unstarred'
    });
  } catch (error) {
    console.error('Error unstarring email:', error);
    
    // Fallback to original method
    return emailController.unstarEmail(req, res);
  }
});

// GET /api/emails/search/:query - Search emails
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { category, processed, limit } = req.query;
    
    const filters = {};
    if (category) filters.category = category;
    if (processed !== undefined) filters.processed = processed === 'true';
    if (limit) filters.limit = parseInt(limit);
    
    const emails = await searchEmails(query, filters);
    
    const transformedEmails = emails.map(email => ({
      id: email.id,
      sender: {
        name: email.sender.split('@')[0].replace(/[.-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        email: email.sender,
        avatar: email.sender.charAt(0).toUpperCase()
      },
      subject: email.subject,
      body: email.body,
      category: email.category,
      categoryColor: getCategoryColor(email.category),
      actionItems: email.actionItems || [],
      timestamp: formatTimestamp(email.receivedAt),
      processed: email.processed,
      starred: email.starred,
      read: email.read
    }));
    
    res.json({
      success: true,
      data: transformedEmails,
      count: transformedEmails.length,
      query
    });
  } catch (error) {
    console.error('Error searching emails:', error);
    
    // Fallback to original method
    return emailController.searchEmails(req, res);
  }
});

// GET /api/emails/category/:category - Get emails by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit } = req.query;
    
    const emails = await getEmailsByCategory(category, limit ? parseInt(limit) : 50);
    
    const transformedEmails = emails.map(email => ({
      id: email.id,
      sender: {
        name: email.sender.split('@')[0].replace(/[.-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        email: email.sender,
        avatar: email.sender.charAt(0).toUpperCase()
      },
      subject: email.subject,
      body: email.body,
      category: email.category,
      categoryColor: getCategoryColor(email.category),
      actionItems: email.actionItems || [],
      timestamp: formatTimestamp(email.receivedAt),
      processed: email.processed,
      starred: email.starred,
      read: email.read
    }));
    
    res.json({
      success: true,
      data: transformedEmails,
      category,
      count: transformedEmails.length
    });
  } catch (error) {
    console.error('Error getting emails by category:', error);
    
    // Fallback to original method
    return emailController.getEmailsByCategory(req, res);
  }
});

// Utility functions
function getCategoryColor(category) {
  const colorMap = {
    'Work': 'bg-blue-500',
    'Personal': 'bg-green-500',
    'Shopping': 'bg-purple-500',
    'Social': 'bg-pink-500',
    'Finance': 'bg-orange-500',
    'Design': 'bg-indigo-500',
    'Newsletter': 'bg-gray-500',
    'Spam': 'bg-red-500'
  };
  return colorMap[category] || 'bg-gray-400';
}

function formatTimestamp(date) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

module.exports = router;