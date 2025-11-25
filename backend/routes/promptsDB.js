const express = require('express');
const router = express.Router();

// Import database services
const { 
  getPrompts,
  getPromptByType,
  updatePromptByType,
  resetToDefaultPrompts,
  getPromptsAsObject
} = require('../db/prompts');

// Import original controller for fallback
const PromptController = require('../controllers/promptController');
const promptController = new PromptController();

/**
 * Database-integrated prompt routes
 */

// GET /api/prompts - Get all prompts
router.get('/', async (req, res) => {
  try {
    const promptsObject = await getPromptsAsObject();
    
    res.json({
      success: true,
      data: promptsObject
    });
  } catch (error) {
    console.error('Database error getting prompts:', error);
    
    // Fallback to original method
    return promptController.getAllPrompts(req, res);
  }
});

// GET /api/prompts/:type - Get prompt by type
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const prompt = await getPromptByType(type);
    
    if (!prompt) {
      return res.status(404).json({
        success: false,
        message: 'Prompt not found'
      });
    }

    res.json({
      success: true,
      data: prompt
    });
  } catch (error) {
    console.error('Database error getting prompt:', error);
    
    // Fallback to original method
    return promptController.getPrompt(req, res);
  }
});

// PUT /api/prompts/:type - Update prompt by type
router.put('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { content, title } = req.body;
    
    const updates = {};
    if (content) updates.promptBody = content;
    if (title) updates.title = title;
    
    const updatedPrompt = await updatePromptByType(type, updates);
    
    res.json({
      success: true,
      data: updatedPrompt,
      message: 'Prompt updated successfully'
    });
  } catch (error) {
    console.error('Error updating prompt:', error);
    
    // Fallback to original method
    return promptController.updatePrompt(req, res);
  }
});

// POST /api/prompts/reset - Reset to default prompts
router.post('/reset', async (req, res) => {
  try {
    await resetToDefaultPrompts();
    const promptsObject = await getPromptsAsObject();
    
    res.json({
      success: true,
      data: promptsObject,
      message: 'Prompts reset to defaults successfully'
    });
  } catch (error) {
    console.error('Error resetting prompts:', error);
    
    // Fallback to original method
    return promptController.resetPrompts(req, res);
  }
});

// POST /api/prompts/export - Export prompts
router.post('/export', async (req, res) => {
  try {
    const prompts = await getPrompts();
    
    res.json({
      success: true,
      data: prompts,
      message: 'Prompts exported successfully'
    });
  } catch (error) {
    console.error('Error exporting prompts:', error);
    
    // Fallback to original method
    return promptController.exportPrompts(req, res);
  }
});

module.exports = router;