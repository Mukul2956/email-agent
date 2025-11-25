const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');

// Agent chat and interactions
router.post('/chat', agentController.chat);
router.get('/conversations', agentController.getConversations);

// Agent AI operations
router.post('/summarize', agentController.summarizeEmail);
router.post('/action-items', agentController.extractActionItems);
router.post('/categorize', agentController.categorizeEmail);

// Agent status and capabilities
router.get('/status', agentController.getStatus);

module.exports = router;