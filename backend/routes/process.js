const express = require('express');
const router = express.Router();
const processController = require('../controllers/processController');

// Email processing operations
router.post('/email', processController.processEmail);
router.post('/batch', processController.processBatch);

// Processing history and analytics
router.get('/history', processController.getProcessingHistory);
router.get('/stats', processController.getProcessingStats);

module.exports = router;