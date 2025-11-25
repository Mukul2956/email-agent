const express = require('express');
const router = express.Router();
const draftController = require('../controllers/draftController');

// Draft CRUD operations
router.get('/', draftController.getAllDrafts);
router.get('/:id', draftController.getDraft);
router.post('/', draftController.createDraft);
router.put('/:id', draftController.updateDraft);
router.delete('/:id', draftController.deleteDraft);

// Draft AI operations
router.post('/generate', draftController.generateReply);
router.post('/:id/improve', draftController.improveDraft);
router.post('/:id/send', draftController.sendDraft);

// Draft management
router.get('/for-email/:emailId', draftController.getDraftsForEmail);

module.exports = router;