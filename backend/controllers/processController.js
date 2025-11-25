const fileService = require('../services/fileService');
const llmService = require('../services/llmService');
const { v4: uuidv4 } = require('uuid');

/**
 * Process Controller
 * Handles AI-powered email processing operations
 */
class ProcessController {
  /**
   * Process single email with AI
   * POST /api/process/email
   * Body: { emailId, prompts?, options? }
   */
  async processEmail(req, res, next) {
    try {
      const { emailId, prompts, options = {} } = req.body;
      
      if (!emailId) {
        return res.status(400).json({
          error: true,
          message: 'emailId is required'
        });
      }

      // Get email
      const emails = await fileService.readJSON('mock_inbox');
      const email = emails.find(e => e.id === emailId);
      
      if (!email) {
        return res.status(404).json({
          error: true,
          message: `Email with ID ${emailId} not found`
        });
      }

      // Get prompts (use provided or load from file)
      const userPrompts = prompts || await fileService.readJSON('prompts');
      
      // Process email with AI
      const results = await this.runEmailProcessing(email, userPrompts, options);
      
      // Save processing result
      const processResult = {
        id: uuidv4(),
        emailId,
        originalEmail: email,
        results,
        prompts: userPrompts,
        options,
        timestamp: new Date().toISOString()
      };

      await fileService.appendJSON('processed_emails', processResult);
      
      // Update email in inbox
      await fileService.updateById('mock_inbox', emailId, {
        category: results.category,
        categoryColor: results.categoryColor,
        actionItems: results.actionItems,
        summary: results.summary,
        processed: true,
        processedAt: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Email processed successfully',
        data: {
          email: {
            ...email,
            ...results,
            processed: true,
            processedAt: new Date().toISOString()
          },
          processing: processResult
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process multiple emails in batch
   * POST /api/process/batch
   * Body: { emailIds, prompts?, options? }
   */
  async processBatch(req, res, next) {
    try {
      const { emailIds, prompts, options = {} } = req.body;
      
      if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
        return res.status(400).json({
          error: true,
          message: 'emailIds array is required and must not be empty'
        });
      }

      const emails = await fileService.readJSON('mock_inbox');
      const userPrompts = prompts || await fileService.readJSON('prompts');
      
      const results = [];
      const errors = [];
      
      // Process each email
      for (const emailId of emailIds) {
        try {
          const email = emails.find(e => e.id === emailId);
          
          if (!email) {
            errors.push({ emailId, error: 'Email not found' });
            continue;
          }

          const processingResults = await this.runEmailProcessing(email, userPrompts, options);
          
          // Update email
          await fileService.updateById('mock_inbox', emailId, {
            category: processingResults.category,
            categoryColor: processingResults.categoryColor,
            actionItems: processingResults.actionItems,
            summary: processingResults.summary,
            processed: true,
            processedAt: new Date().toISOString()
          });
          
          results.push({
            emailId,
            email: { ...email, ...processingResults },
            success: true
          });
          
          // Small delay to prevent rate limiting
          if (options.delay) {
            await new Promise(resolve => setTimeout(resolve, options.delay));
          }
        } catch (error) {
          errors.push({ emailId, error: error.message });
        }
      }

      // Save batch processing result
      const batchResult = {
        id: uuidv4(),
        type: 'batch',
        emailIds,
        results,
        errors,
        prompts: userPrompts,
        options,
        timestamp: new Date().toISOString()
      };

      await fileService.appendJSON('processed_emails', batchResult);

      res.json({
        success: true,
        message: `Batch processing completed. ${results.length} successful, ${errors.length} failed.`,
        data: {
          processed: results.length,
          failed: errors.length,
          results,
          errors,
          batchId: batchResult.id
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get processing history
   * GET /api/process/history
   */
  async getProcessingHistory(req, res, next) {
    try {
      const { limit = 50, type, emailId } = req.query;
      let history = await fileService.readJSON('processed_emails');
      
      // Filter by type
      if (type) {
        history = history.filter(item => item.type === type);
      }
      
      // Filter by email ID
      if (emailId) {
        history = history.filter(item => 
          item.emailId === emailId || 
          (item.emailIds && item.emailIds.includes(emailId))
        );
      }
      
      // Sort by timestamp (newest first)
      history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Limit results
      if (limit) {
        history = history.slice(0, parseInt(limit));
      }

      res.json({
        success: true,
        data: history,
        count: history.length,
        filters: { limit, type, emailId }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get processing statistics
   * GET /api/process/stats
   */
  async getProcessingStats(req, res, next) {
    try {
      const history = await fileService.readJSON('processed_emails');
      const emails = await fileService.readJSON('mock_inbox');
      
      const totalEmails = emails.length;
      const processedEmails = emails.filter(e => e.processed).length;
      const unprocessedEmails = totalEmails - processedEmails;
      
      // Category distribution
      const categoryStats = emails.reduce((acc, email) => {
        if (email.category) {
          acc[email.category] = (acc[email.category] || 0) + 1;
        }
        return acc;
      }, {});
      
      // Processing activity by day
      const activityStats = history.reduce((acc, item) => {
        const date = new Date(item.timestamp).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          overview: {
            totalEmails,
            processedEmails,
            unprocessedEmails,
            processingRate: totalEmails > 0 ? (processedEmails / totalEmails * 100).toFixed(2) : 0
          },
          categories: categoryStats,
          activity: activityStats,
          totalProcessingOperations: history.length
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Run AI processing on email
   * @param {Object} email - Email to process
   * @param {Object} prompts - User prompts
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processing results
   */
  async runEmailProcessing(email, prompts, options = {}) {
    try {
      const { includeCategories = true, includeActionItems = true, includeSummary = true } = options;
      
      const promises = [];
      
      // Run categorization
      if (includeCategories) {
        promises.push(llmService.runCategorizationPrompt(email, prompts.categorization));
      } else {
        promises.push(Promise.resolve(email.category || 'Uncategorized'));
      }
      
      // Run action item extraction
      if (includeActionItems) {
        promises.push(llmService.runActionItemPrompt(email, prompts.actionItems));
      } else {
        promises.push(Promise.resolve(email.actionItems || []));
      }
      
      // Run summary generation
      if (includeSummary) {
        promises.push(llmService.generateSummary(email));
      } else {
        promises.push(Promise.resolve(email.summary || ''));
      }
      
      const [category, actionItems, summary] = await Promise.all(promises);
      
      return {
        category,
        categoryColor: this.getCategoryColor(category),
        actionItems,
        summary
      };
    } catch (error) {
      console.error('Error in runEmailProcessing:', error);
      throw error;
    }
  }

  /**
   * Get category color mapping
   * @param {string} category - Email category
   * @returns {string} CSS color class
   */
  getCategoryColor(category) {
    const colorMap = {
      'Work': 'bg-blue-500',
      'Personal': 'bg-green-500',
      'Shopping': 'bg-purple-500',
      'Social': 'bg-pink-500',
      'Finance': 'bg-orange-500',
      'Design': 'bg-indigo-500',
      'Education': 'bg-teal-500',
      'Newsletter': 'bg-gray-500',
      'Spam': 'bg-red-500'
    };
    return colorMap[category] || 'bg-gray-500';
  }
}

module.exports = new ProcessController();