const { PrismaClient } = require('@prisma/client');
const llmService = require('../services/llmService');

const prisma = new PrismaClient();

/**
 * Email Controller
 * Handles email-related operations using Prisma/Supabase
 */
class EmailController {
  /**
   * Get all emails from inbox
   * GET /api/emails
   */
  async getAllEmails(req, res, next) {
    try {
      const { processed, category, limit } = req.query;
      
      const where = {};
      if (processed !== undefined) {
        where.processed = processed === 'true';
      }
      if (category) {
        where.category = category;
      }

      const emails = await prisma.email.findMany({
        where,
        orderBy: [
          { starred: 'desc' },
          { receivedAt: 'desc' }
        ],
        take: limit ? parseInt(limit) : undefined
      });
      
      res.json({
        success: true,
        data: emails,
        count: emails.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single email by ID
   * GET /api/emails/:id
   */
  async getEmailById(req, res, next) {
    try {
      const { id } = req.params;
      
      const email = await prisma.email.findUnique({
        where: { id },
        include: {
          drafts: true,
          chatHistory: {
            orderBy: { timestamp: 'desc' }
          }
        }
      });
      
      if (!email) {
        return res.status(404).json({
          error: true,
          message: `Email with ID ${id} not found`
        });
      }

      res.json({
        success: true,
        data: email
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Load inbox (for demonstration purposes)
   * POST /api/emails/load-inbox
   */
  async loadInbox(req, res, next) {
    try {
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const emails = await prisma.email.findMany({
        orderBy: [
          { starred: 'desc' },
          { receivedAt: 'desc' }
        ]
      });
      
      res.json({
        success: true,
        message: 'Inbox loaded successfully',
        data: emails,
        count: emails.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process all emails with AI
   * POST /api/emails/process-all
   */
  async processAllEmails(req, res, next) {
    try {
      // Get unprocessed emails
      const emails = await prisma.email.findMany({
        where: { processed: false }
      });

      if (emails.length === 0) {
        return res.json({
          success: true,
          message: 'No unprocessed emails found',
          data: [],
          count: 0
        });
      }

      const processedEmails = [];

      // Process each email
      for (const email of emails) {
        try {
          // Get categorization prompt
          const prompt = await prisma.prompt.findUnique({
            where: { type: 'email_categorization' }
          });

          let category = 'Other';
          let actionItems = [];

          if (prompt) {
            // Use proper LLM service method
            category = await llmService.runCategorizationPrompt(email, prompt.content);
            
            // Extract action items using LLM service
            const actionPrompt = await prisma.prompt.findUnique({
              where: { type: 'action_items' }
            });
            
            if (actionPrompt) {
              actionItems = await llmService.runActionItemPrompt(email, actionPrompt.content);
            } else {
              // Fallback action item extraction
              actionItems = this.extractActionItems(email.body);
            }
          } else {
            // Fallback categorization
            category = this.categorizeByKeywords(email.body);
            actionItems = this.extractActionItems(email.body);
          }

          // Update email in database
          const updatedEmail = await prisma.email.update({
            where: { id: email.id },
            data: {
              category,
              actionItems,
              processed: true
            }
          });

          processedEmails.push(updatedEmail);

          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (emailError) {
          console.error(`Error processing email ${email.id}:`, emailError);
          // Continue processing other emails
        }
      }

      res.json({
        success: true,
        message: `Processed ${processedEmails.length} emails successfully`,
        data: processedEmails,
        count: processedEmails.length
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Extract category from AI response
   */
  extractCategory(response) {
    const categories = ['Work', 'Personal', 'Shopping', 'Social', 'Finance', 'Design', 'Education', 'Newsletter', 'Spam'];
    const responseText = response.toLowerCase();
    
    for (const category of categories) {
      if (responseText.includes(category.toLowerCase())) {
        return category;
      }
    }
    return 'Other';
  }

  /**
   * Extract action items from email body
   */
  extractActionItems(body) {
    const actionKeywords = [
      'please', 'can you', 'could you', 'would you', 'need to', 'should', 'must',
      'review', 'check', 'confirm', 'schedule', 'call', 'meeting', 'deadline'
    ];
    
    const sentences = body.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const actionItems = [];
    
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      if (actionKeywords.some(keyword => lowerSentence.includes(keyword))) {
        actionItems.push(sentence.trim());
      }
    }
    
    return actionItems.slice(0, 3); // Limit to 3 action items
  }

  /**
   * Create new email
   * POST /api/emails
   */
  async createEmail(req, res, next) {
    try {
      const { sender, receiver, subject, body, category } = req.body;
      
      if (!sender || !subject || !body) {
        return res.status(400).json({
          error: true,
          message: 'sender, subject, and body are required'
        });
      }

      const newEmail = await prisma.email.create({
        data: {
          sender,
          receiver: receiver || 'user@example.com',
          subject,
          body,
          category,
          receivedAt: new Date()
        }
      });

      res.status(201).json({
        success: true,
        message: 'Email created successfully',
        data: newEmail
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update email by ID
   * PUT /api/emails/:id
   */
  async updateEmail(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedEmail = await prisma.email.update({
        where: { id },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Email updated successfully',
        data: updatedEmail
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: true,
          message: 'Email not found'
        });
      }
      next(error);
    }
  }

  /**
   * Delete email by ID
   * DELETE /api/emails/:id
   */
  async deleteEmail(req, res, next) {
    try {
      const { id } = req.params;
      
      await prisma.email.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Email deleted successfully',
        data: { id }
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: true,
          message: 'Email not found'
        });
      }
      next(error);
    }
  }

  /**
   * Search emails
   * GET /api/emails/search/:query
   */
  async searchEmails(req, res, next) {
    try {
      const { query } = req.params;
      const { category, limit = 50 } = req.query;
      
      if (!query || query.trim().length === 0) {
        return res.status(400).json({
          error: true,
          message: 'Search query is required'
        });
      }

      const where = {
        OR: [
          { subject: { contains: query, mode: 'insensitive' } },
          { body: { contains: query, mode: 'insensitive' } },
          { sender: { contains: query, mode: 'insensitive' } }
        ]
      };

      if (category) {
        where.category = category;
      }

      const emails = await prisma.email.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        take: parseInt(limit)
      });

      res.json({
        success: true,
        data: emails,
        count: emails.length,
        query: { searchTerm: query, category, limit }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get emails by category
   * GET /api/emails/category/:category
   */
  async getEmailsByCategory(req, res, next) {
    try {
      const { category } = req.params;
      const { limit = 50 } = req.query;

      const emails = await prisma.email.findMany({
        where: { category },
        orderBy: { receivedAt: 'desc' },
        take: parseInt(limit)
      });

      res.json({
        success: true,
        data: emails,
        count: emails.length,
        category
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark email as read
   * POST /api/emails/:id/read
   */
  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      
      const updatedEmail = await prisma.email.update({
        where: { id },
        data: { read: true }
      });

      res.json({
        success: true,
        message: 'Email marked as read',
        data: updatedEmail
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: true,
          message: 'Email not found'
        });
      }
      next(error);
    }
  }

  /**
   * Mark email as unread
   * POST /api/emails/:id/unread
   */
  async markAsUnread(req, res, next) {
    try {
      const { id } = req.params;
      
      const updatedEmail = await prisma.email.update({
        where: { id },
        data: { read: false }
      });

      res.json({
        success: true,
        message: 'Email marked as unread',
        data: updatedEmail
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: true,
          message: 'Email not found'
        });
      }
      next(error);
    }
  }

  /**
   * Star email
   * POST /api/emails/:id/star
   */
  async starEmail(req, res, next) {
    try {
      const { id } = req.params;
      
      const updatedEmail = await prisma.email.update({
        where: { id },
        data: { starred: true }
      });

      res.json({
        success: true,
        message: 'Email starred',
        data: updatedEmail
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: true,
          message: 'Email not found'
        });
      }
      next(error);
    }
  }

  /**
   * Unstar email
   * POST /api/emails/:id/unstar
   */
  async unstarEmail(req, res, next) {
    try {
      const { id } = req.params;
      
      const updatedEmail = await prisma.email.update({
        where: { id },
        data: { starred: false }
      });

      res.json({
        success: true,
        message: 'Email unstarred',
        data: updatedEmail
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: true,
          message: 'Email not found'
        });
      }
      next(error);
    }
  }

  /**
   * Move email to trash (soft delete)
   * DELETE /api/emails/:id/trash
   */
  async moveToTrash(req, res, next) {
    try {
      const { id } = req.params;
      
      // For now, we'll just delete the email
      // In production, you might add a 'deleted' field for soft deletes
      await prisma.email.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Email moved to trash'
      });
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({
          error: true,
          message: 'Email not found'
        });
      }
      next(error);
    }
  }

  /**
   * Restore email from trash (placeholder)
   * POST /api/emails/:id/restore
   */
  async restoreFromTrash(req, res, next) {
    try {
      res.json({
        success: true,
        message: 'Restore functionality not implemented yet'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new EmailController();