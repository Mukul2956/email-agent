const fileService = require('../services/fileService');

/**
 * Prompt Controller
 * Handles user-defined prompts for AI operations
 */
class PromptController {
  /**
   * Get all prompts
   * GET /api/prompts
   */
  async getAllPrompts(req, res, next) {
    try {
      const prompts = await fileService.readJSON('prompts');
      
      res.json({
        success: true,
        data: prompts,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get specific prompt by type
   * GET /api/prompts/:type
   */
  async getPrompt(req, res, next) {
    try {
      const { type } = req.params;
      const prompts = await fileService.readJSON('prompts');
      
      if (!prompts[type]) {
        return res.status(404).json({
          error: true,
          message: `Prompt type '${type}' not found`
        });
      }

      res.json({
        success: true,
        data: {
          type,
          prompt: prompts[type]
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create/Update prompts
   * POST /api/prompts
   */
  async createPrompt(req, res, next) {
    try {
      const { categorization, actionItems, autoReply } = req.body;
      
      // Validate required fields
      if (!categorization && !actionItems && !autoReply) {
        return res.status(400).json({
          error: true,
          message: 'At least one prompt field is required'
        });
      }

      // Get current prompts
      const currentPrompts = await fileService.readJSON('prompts');
      
      // Merge with updates
      const updatedPrompts = {
        ...currentPrompts,
        ...(categorization && { categorization }),
        ...(actionItems && { actionItems }),
        ...(autoReply && { autoReply }),
        lastUpdated: new Date().toISOString()
      };

      // Save updated prompts
      await fileService.writeJSON('prompts', updatedPrompts);

      res.json({
        success: true,
        message: 'Prompts updated successfully',
        data: updatedPrompts
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset prompts to default
   * POST /api/prompts/reset
   */
  async resetPrompts(req, res, next) {
    try {
      const defaultPrompts = {
        categorization: "Analyze the email content and sender information to categorize it into one of the following categories: Work, Personal, Shopping, Social, Finance, Design, Education, Newsletter, Spam. Return only the category name.",
        actionItems: "Extract actionable items from the email that require a response or action from the recipient. For each action item: 1. Be specific and concise 2. Include deadlines if mentioned 3. Focus on what needs to be done 4. Ignore marketing or informational content. Return a bulleted list of action items, or an empty list if none exist.",
        autoReply: "Generate a professional and contextually appropriate email reply based on the original email content. Guidelines: 1. Match the tone of the original email (formal/casual) 2. Address all questions or requests mentioned 3. Be concise but complete 4. Include appropriate greeting and closing 5. Leave placeholders [DETAILS] where specific information is needed. Generate a draft reply that can be edited before sending.",
        lastUpdated: new Date().toISOString()
      };

      await fileService.writeJSON('prompts', defaultPrompts);

      res.json({
        success: true,
        message: 'Prompts reset to default successfully',
        data: defaultPrompts
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get prompt by type
   * GET /api/prompts/:type
   */
  async getPromptByType(req, res, next) {
    try {
      const { type } = req.params;
      const validTypes = ['categorization', 'actionItems', 'autoReply'];
      
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          error: true,
          message: `Invalid prompt type. Must be one of: ${validTypes.join(', ')}`
        });
      }

      const prompts = await fileService.readJSON('prompts');
      const promptValue = prompts[type];

      if (!promptValue) {
        return res.status(404).json({
          error: true,
          message: `Prompt type '${type}' not found`
        });
      }

      res.json({
        success: true,
        data: {
          type,
          content: promptValue,
          lastUpdated: prompts.lastUpdated
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update specific prompt type
   * PUT /api/prompts/:type
   */
  async updatePromptByType(req, res, next) {
    try {
      const { type } = req.params;
      const { content } = req.body;
      const validTypes = ['categorization', 'actionItems', 'autoReply'];
      
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          error: true,
          message: `Invalid prompt type. Must be one of: ${validTypes.join(', ')}`
        });
      }

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({
          error: true,
          message: 'Content is required and must be a non-empty string'
        });
      }

      const currentPrompts = await fileService.readJSON('prompts');
      const updatedPrompts = {
        ...currentPrompts,
        [type]: content.trim(),
        lastUpdated: new Date().toISOString()
      };

      await fileService.writeJSON('prompts', updatedPrompts);

      res.json({
        success: true,
        message: `${type} prompt updated successfully`,
        data: {
          type,
          content: content.trim(),
          lastUpdated: updatedPrompts.lastUpdated
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update specific prompt
   * PUT /api/prompts/:type
   */
  async updatePrompt(req, res, next) {
    try {
      const { type } = req.params;
      const { content } = req.body;
      
      const validTypes = ['categorization', 'actionItems', 'autoReply'];
      
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          error: true,
          message: `Invalid prompt type. Must be one of: ${validTypes.join(', ')}`
        });
      }

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({
          error: true,
          message: 'Content is required and must be a non-empty string'
        });
      }

      const currentPrompts = await fileService.readJSON('prompts');
      const updatedPrompts = {
        ...currentPrompts,
        [type]: content.trim(),
        lastUpdated: new Date().toISOString()
      };

      await fileService.writeJSON('prompts', updatedPrompts);

      res.json({
        success: true,
        message: `${type} prompt updated successfully`,
        data: {
          type,
          content: content.trim(),
          lastUpdated: updatedPrompts.lastUpdated
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete specific prompt (reset to default)
   * DELETE /api/prompts/:type
   */
  async deletePrompt(req, res, next) {
    try {
      const { type } = req.params;
      
      const defaultPrompts = {
        categorization: 'Categorize this email into one of these categories: Work, Personal, Shopping, Social, Finance, Design, Education, Newsletter, Spam. Consider the sender, subject, and content. Return only the category name.',
        actionItems: 'Extract actionable items from this email. List specific tasks that need to be completed. If no action items exist, return an empty list.',
        autoReply: 'Generate a professional auto-reply acknowledging receipt of the email and indicating when they can expect a response.',
      };

      if (!defaultPrompts[type]) {
        return res.status(400).json({
          error: true,
          message: `Invalid prompt type. Must be one of: ${Object.keys(defaultPrompts).join(', ')}`
        });
      }

      const currentPrompts = await fileService.readJSON('prompts');
      const updatedPrompts = {
        ...currentPrompts,
        [type]: defaultPrompts[type],
        lastUpdated: new Date().toISOString()
      };

      await fileService.writeJSON('prompts', updatedPrompts);

      res.json({
        success: true,
        message: `${type} prompt reset to default`,
        data: {
          type,
          content: defaultPrompts[type],
          lastUpdated: updatedPrompts.lastUpdated
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset all prompts to defaults
   * POST /api/prompts/reset
   */
  async resetToDefaults(req, res, next) {
    try {
      const defaultPrompts = {
        categorization: 'Categorize this email into one of these categories: Work, Personal, Shopping, Social, Finance, Design, Education, Newsletter, Spam. Consider the sender, subject, and content. Return only the category name.',
        actionItems: 'Extract actionable items from this email. List specific tasks that need to be completed. If no action items exist, return an empty list.',
        autoReply: 'Generate a professional auto-reply acknowledging receipt of the email and indicating when they can expect a response.',
        lastUpdated: new Date().toISOString()
      };

      await fileService.writeJSON('prompts', defaultPrompts);

      res.json({
        success: true,
        message: 'All prompts reset to defaults',
        data: defaultPrompts
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export prompts
   * POST /api/prompts/export
   */
  async exportPrompts(req, res, next) {
    try {
      const prompts = await fileService.readJSON('prompts');
      
      res.json({
        success: true,
        message: 'Prompts exported successfully',
        data: prompts,
        exportedAt: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Import prompts
   * POST /api/prompts/import
   */
  async importPrompts(req, res, next) {
    try {
      const { prompts } = req.body;
      
      if (!prompts || typeof prompts !== 'object') {
        return res.status(400).json({
          error: true,
          message: 'Prompts object is required'
        });
      }

      const validTypes = ['categorization', 'actionItems', 'autoReply'];
      const validPrompts = {};

      // Validate imported prompts
      for (const [type, content] of Object.entries(prompts)) {
        if (validTypes.includes(type) && typeof content === 'string' && content.trim()) {
          validPrompts[type] = content.trim();
        }
      }

      if (Object.keys(validPrompts).length === 0) {
        return res.status(400).json({
          error: true,
          message: 'No valid prompts found to import'
        });
      }

      const currentPrompts = await fileService.readJSON('prompts');
      const updatedPrompts = {
        ...currentPrompts,
        ...validPrompts,
        lastUpdated: new Date().toISOString()
      };

      await fileService.writeJSON('prompts', updatedPrompts);

      res.json({
        success: true,
        message: `Imported ${Object.keys(validPrompts).length} prompts successfully`,
        data: {
          imported: validPrompts,
          importedAt: updatedPrompts.lastUpdated
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Test prompt with sample email
   * POST /api/prompts/test/:type
   */
  async testPrompt(req, res, next) {
    try {
      const { type } = req.params;
      const { sampleEmail, prompt } = req.body;

      const validTypes = ['categorization', 'actionItems', 'autoReply'];
      
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          error: true,
          message: `Invalid prompt type. Must be one of: ${validTypes.join(', ')}`
        });
      }

      // Use provided sample email or default
      const testEmail = sampleEmail || {
        sender: { name: 'John Doe', email: 'john@example.com' },
        subject: 'Test Email Subject',
        body: 'This is a test email body for prompt testing purposes.'
      };

      // Use provided prompt or get from file
      let testPrompt = prompt;
      if (!testPrompt) {
        const prompts = await fileService.readJSON('prompts');
        testPrompt = prompts[type];
      }

      if (!testPrompt) {
        return res.status(400).json({
          error: true,
          message: 'Prompt not found and no test prompt provided'
        });
      }

      const llmService = require('../services/llmService');
      
      let result;
      switch (type) {
        case 'categorization':
          result = await llmService.runCategorizationPrompt(testEmail, testPrompt);
          break;
        case 'actionItems':
          result = await llmService.runActionItemPrompt(testEmail, testPrompt);
          break;
        case 'autoReply':
          result = await llmService.generateReplyDraft(testEmail, testPrompt);
          break;
        default:
          throw new Error('Invalid prompt type');
      }

      res.json({
        success: true,
        message: 'Prompt test completed',
        data: {
          type,
          prompt: testPrompt,
          testEmail,
          result,
          testedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PromptController();