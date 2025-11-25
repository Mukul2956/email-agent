const fileService = require('../services/fileService');
const llmService = require('../services/llmService');
const { v4: uuidv4 } = require('uuid');

/**
 * Draft Controller
 * Handles email draft operations
 */
class DraftController {
  /**
   * Get all drafts
   * GET /api/drafts
   */
  async getAllDrafts(req, res, next) {
    try {
      const drafts = await fileService.readJSON('drafts');
      
      res.json({
        success: true,
        data: drafts,
        count: drafts.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single draft by ID
   * GET /api/drafts/:id
   */
  async getDraft(req, res, next) {
    try {
      const { id } = req.params;
      const drafts = await fileService.readJSON('drafts');
      
      const draft = drafts.find(d => d.id === id);
      if (!draft) {
        return res.status(404).json({
          error: true,
          message: `Draft with ID ${id} not found`
        });
      }

      res.json({
        success: true,
        data: draft
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new draft
   * POST /api/drafts
   */
  async createDraft(req, res, next) {
    try {
      const { to, subject, body, category, categoryColor, metadata } = req.body;
      
      // Validate required fields
      if (!to || !subject || !body) {
        return res.status(400).json({
          error: true,
          message: 'to, subject, and body are required fields'
        });
      }

      const newDraft = {
        id: uuidv4(),
        to,
        subject,
        body,
        category: category || 'Draft',
        categoryColor: categoryColor || 'bg-gray-500',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        metadata: metadata || {}
      };

      await fileService.appendJSON('drafts', newDraft);

      res.status(201).json({
        success: true,
        message: 'Draft created successfully',
        data: newDraft
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update existing draft
   * PUT /api/drafts/:id
   */
  async updateDraft(req, res, next) {
    try {
      const { id } = req.params;
      const { to, subject, body, category, categoryColor, metadata } = req.body;
      
      const updates = {
        ...(to && { to }),
        ...(subject && { subject }),
        ...(body && { body }),
        ...(category && { category }),
        ...(categoryColor && { categoryColor }),
        ...(metadata && { metadata }),
        lastModified: new Date().toISOString()
      };

      const updatedDraft = await fileService.updateById('drafts', id, updates);

      res.json({
        success: true,
        message: 'Draft updated successfully',
        data: updatedDraft
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete draft
   * DELETE /api/drafts/:id
   */
  async deleteDraft(req, res, next) {
    try {
      const { id } = req.params;
      
      await fileService.deleteById('drafts', id);

      res.json({
        success: true,
        message: 'Draft deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate reply draft from email
   * POST /api/drafts/reply/:emailId
   */
  async generateReply(req, res, next) {
    try {
      const { emailId } = req.params;
      const { tone = 'professional' } = req.body;
      
      // Get original email
      const emails = await fileService.readJSON('mock_inbox');
      const originalEmail = emails.find(e => e.id === emailId);
      
      if (!originalEmail) {
        return res.status(404).json({
          error: true,
          message: `Email with ID ${emailId} not found`
        });
      }

      // Get user prompts
      const prompts = await fileService.readJSON('prompts');
      
      // Generate reply using AI
      const replyBody = await llmService.generateReplyDraft(
        originalEmail, 
        prompts.autoReply, 
        tone
      );

      // Create draft
      const draft = {
        id: uuidv4(),
        to: originalEmail.sender.email,
        subject: `Re: ${originalEmail.subject}`,
        body: replyBody,
        category: originalEmail.category || 'Work',
        categoryColor: originalEmail.categoryColor || 'bg-blue-500',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        metadata: {
          type: 'reply',
          originalEmailId: emailId,
          tone,
          generatedBy: 'AI'
        }
      };

      await fileService.appendJSON('drafts', draft);

      res.status(201).json({
        success: true,
        message: 'Reply draft generated successfully',
        data: draft
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate new email draft from scratch
   * POST /api/drafts/generate
   */
  async generateNewDraft(req, res, next) {
    try {
      const { prompt, to, subject, tone = 'professional', context } = req.body;
      
      if (!prompt) {
        return res.status(400).json({
          error: true,
          message: 'Prompt is required to generate draft'
        });
      }

      // Get user prompts for context
      const userPrompts = await fileService.readJSON('prompts');
      
      // Generate email using AI
      const messages = [
        {
          role: 'system',
          content: `You are an email writing assistant. Generate a ${tone} email based on the user's request. Include proper structure with greeting, body, and closing. Use the context provided if available.`
        },
        {
          role: 'user',
          content: `Generate an email with the following requirements:
Prompt: ${prompt}
${to ? `To: ${to}` : ''}
${subject ? `Subject: ${subject}` : ''}
${context ? `Additional context: ${context}` : ''}`
        }
      ];

      const generatedContent = await llmService.makeRequest(messages, { temperature: 0.7, maxTokens: 500 });
      
      // Extract subject and body from generated content
      let finalSubject = subject;
      let finalBody = generatedContent;
      
      // Try to extract subject from generated content if not provided
      if (!subject && generatedContent.includes('Subject:')) {
        const lines = generatedContent.split('\n');
        const subjectLine = lines.find(line => line.startsWith('Subject:'));
        if (subjectLine) {
          finalSubject = subjectLine.replace('Subject:', '').trim();
          finalBody = lines.filter(line => !line.startsWith('Subject:')).join('\n').trim();
        }
      }

      // Create draft
      const draft = {
        id: uuidv4(),
        to: to || '[Recipient Email]',
        subject: finalSubject || 'Generated Email',
        body: finalBody,
        category: 'Draft',
        categoryColor: 'bg-gray-500',
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        metadata: {
          type: 'generated',
          prompt,
          tone,
          generatedBy: 'AI'
        }
      };

      await fileService.appendJSON('drafts', draft);

      res.status(201).json({
        success: true,
        message: 'Email draft generated successfully',
        data: draft
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Improve draft content with AI
   * POST /api/drafts/:id/improve
   */
  async improveDraft(req, res, next) {
    try {
      const { id } = req.params;
      const { instructions = 'improve clarity and professionalism' } = req.body;
      
      const drafts = await fileService.readJSON('drafts');
      const draft = drafts.find(d => d.id === id);
      
      if (!draft) {
        return res.status(404).json({
          error: true,
          message: `Draft with ID ${id} not found`
        });
      }

      // Use LLM service to improve the draft
      const improvedContent = await llmService.improveDraft(draft.content, instructions);
      
      // Update draft with improved content
      const updatedDraft = {
        ...draft,
        content: improvedContent,
        improvedAt: new Date().toISOString(),
        improvementInstructions: instructions
      };

      await fileService.updateById('drafts', id, updatedDraft);

      res.json({
        success: true,
        message: 'Draft improved successfully',
        data: updatedDraft
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send draft (mark as sent)
   * POST /api/drafts/:id/send
   */
  async sendDraft(req, res, next) {
    try {
      const { id } = req.params;
      const { to, cc, bcc } = req.body;
      
      const result = await fileService.updateById('drafts', id, {
        status: 'sent',
        sentAt: new Date().toISOString(),
        sentTo: to || [],
        sentCc: cc || [],
        sentBcc: bcc || []
      });
      
      if (!result) {
        return res.status(404).json({
          error: true,
          message: `Draft with ID ${id} not found`
        });
      }

      res.json({
        success: true,
        message: 'Draft sent successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get drafts for specific email
   * GET /api/drafts/for-email/:emailId
   */
  async getDraftsForEmail(req, res, next) {
    try {
      const { emailId } = req.params;
      const { limit = 10 } = req.query;
      
      if (!emailId) {
        return res.status(400).json({
          error: true,
          message: 'Email ID is required'
        });
      }

      const drafts = await fileService.readJSON('drafts');
      
      let emailDrafts = drafts.filter(draft => draft.originalEmailId === emailId);
      
      // Sort by creation date (newest first)
      emailDrafts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Limit results
      if (limit) {
        emailDrafts = emailDrafts.slice(0, parseInt(limit));
      }

      res.json({
        success: true,
        data: emailDrafts,
        count: emailDrafts.length,
        emailId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DraftController();