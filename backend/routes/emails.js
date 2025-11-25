const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

// Email management routes
router.post('/load-inbox', emailController.loadInbox);
router.post('/process-all', emailController.processAllEmails);

// Basic email routes
router.get('/', emailController.getAllEmails);
router.get('/:id', emailController.getEmailById);
router.post('/', emailController.createEmail);
router.put('/:id', emailController.updateEmail);
router.delete('/:id', emailController.deleteEmail);

// Email management
router.post('/:id/read', emailController.markAsRead);
router.post('/:id/unread', emailController.markAsUnread);
router.post('/:id/star', emailController.starEmail);
router.post('/:id/unstar', emailController.unstarEmail);
router.delete('/:id/trash', emailController.moveToTrash);
router.post('/:id/restore', emailController.restoreFromTrash);

// Search and filter
router.get('/search/:query', emailController.searchEmails);
router.get('/category/:category', emailController.getEmailsByCategory);

module.exports = router;