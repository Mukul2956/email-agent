const express = require('express');
const router = express.Router();
const promptController = require('../controllers/promptController');

// Prompt CRUD operations
router.get('/', promptController.getAllPrompts);
router.get('/:type', promptController.getPrompt);
router.post('/', promptController.createPrompt);
router.put('/:type', promptController.updatePrompt);
router.delete('/:type', promptController.deletePrompt);

// Prompt management
router.post('/reset', promptController.resetToDefaults);
router.post('/export', promptController.exportPrompts);
router.post('/import', promptController.importPrompts);

// Prompt testing
router.post('/test/:type', promptController.testPrompt);

module.exports = router;