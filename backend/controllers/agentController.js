const { PrismaClient } = require('@prisma/client');
const llmService = require('../services/llmService');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

/**
 * Agent Controller
 * Handles Email Agent chat and AI interactions using Prisma/Supabase
 */
class AgentController {
  /**
   * Chat with email agent
   * POST /api/agent/chat
   * Body: { emailId?, query, conversationHistory? }
   */
  async chat(req, res, next) {
    try {
      const { emailId, query, conversationHistory = [] } = req.body;
      
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(400).json({
          error: true,
          message: 'Query is required and must be a non-empty string'
        });
      }

      let emailContext = null;
      // Get email context if emailId provided
      if (emailId && typeof emailId === 'string' && emailId.length === 36) {
        emailContext = await prisma.email.findUnique({
          where: { id: emailId },
          include: {
            drafts: true,
            chatHistory: {
              orderBy: { timestamp: 'desc' },
              take: 5
            }
          }
        });
        if (!emailContext) {
          return res.status(404).json({
            error: true,
            message: `Email with ID ${emailId} not found`
          });
        }
        // Parse sender string for name and email
        if (emailContext.sender) {
          const senderParts = emailContext.sender.match(/(.*?)\s*<(.*)>/) || [null, emailContext.sender, emailContext.sender];
          emailContext.senderName = senderParts[1] || emailContext.sender;
          emailContext.senderEmail = senderParts[2] || emailContext.sender;
        } else {
          emailContext.senderName = "Unknown";
          emailContext.senderEmail = "";
        }
      } else {
        emailContext = null;
      }

      // Get user prompts for context
      const prompts = await prisma.prompt.findMany();
      
      // Generate AI response using LLM service
      let agentResponse;
      try {
        if (emailContext) {
          // Get user prompts for context
          const prompts = await prisma.prompt.findMany();
          const promptsObj = {};
          prompts.forEach(p => {
            promptsObj[p.type] = p.content;
          });
          
          agentResponse = await llmService.runAgentPrompt(
            query,
            emailContext,
            promptsObj,
            conversationHistory
          );
        } else {
          // General query without specific email context
          agentResponse = await llmService.runAgentPrompt(
            query,
            null,
            {},
            conversationHistory
          );
        }
      } catch (llmError) {
        console.error('LLM Error:', llmError);
        agentResponse = "I apologize, but I'm having trouble processing your request right now. Please try again.";
      }
      
      // Save conversation to database if emailId is provided
      if (emailId && emailContext) {
        try {
          await prisma.chatHistory.create({
            data: {
              emailId,
              role: 'user',
              message: query.trim()
            }
          });
          
          await prisma.chatHistory.create({
            data: {
              emailId,
              role: 'assistant', 
              message: agentResponse
            }
          });
        } catch (dbError) {
          console.error('Error saving chat history:', dbError);
          // Continue even if saving fails
        }
      }

      res.json({
        success: true,
        data: {
          query: query.trim(),
          response: agentResponse,
          emailContext: emailContext ? {
            id: emailContext.id,
            subject: emailContext.subject,
            sender: {
              name: emailContext.senderName,
              email: emailContext.senderEmail
            },
            category: emailContext.category
          } : null,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get conversation history
   * GET /api/agent/conversations
   */
  async getConversations(req, res, next) {
    try {
      const { emailId, limit = 50, page = 1 } = req.query;
      
      let whereClause = {};
      if (emailId) {
        whereClause = { emailId };
      }
      
      // Get conversations from database
      const conversations = await prisma.chatHistory.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        include: {
          email: {
            select: {
              id: true,
              subject: true,
              sender: true
            }
          }
        }
      });
      
      // Get total count for pagination
      const total = await prisma.chatHistory.count({
        where: whereClause
      });
      
      res.json({
        success: true,
        data: conversations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('Error getting conversations:', error);
      next(error);
    }
  }

  /**
   * Summarize email
   * POST /api/agent/summarize
   * Body: { emailId }
   */
  async summarizeEmail(req, res, next) {
    try {
      const { emailId } = req.body;
      
      if (!emailId) {
        return res.status(400).json({
          error: true,
          message: 'emailId is required'
        });
      }

      const email = await prisma.email.findUnique({
        where: { id: emailId }
      });
      
      if (!email) {
        return res.status(404).json({
          error: true,
          message: `Email with ID ${emailId} not found`
        });
      }

      const summary = await llmService.generateSummary(email);
      
      // Update email with summary
      await prisma.email.update({
        where: { id: emailId },
        data: {
          summary,
          summarizedAt: new Date()
        }
      });

      res.json({
        success: true,
        data: {
          emailId,
          summary,
          email: {
            id: email.id,
            subject: email.subject,
            sender: email.sender
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Extract action items from email
   * POST /api/agent/action-items
   * Body: { emailId, customPrompt? }
   */
  async extractActionItems(req, res, next) {
    try {
      const { emailId, customPrompt } = req.body;
      
      if (!emailId) {
        return res.status(400).json({
          error: true,
          message: 'emailId is required'
        });
      }

      const email = await prisma.email.findUnique({
        where: { id: emailId }
      });
      
      if (!email) {
        return res.status(404).json({
          error: true,
          message: `Email with ID ${emailId} not found`
        });
      }

      const prompts = await prisma.prompt.findMany();
      const actionItemsPrompt = prompts.find(p => p.type === 'actionItems');
      
      const actionItems = await llmService.runActionItemPrompt(
        email, 
        customPrompt || actionItemsPrompt?.content || 'Extract action items from this email'
      );
      
      // Update email with action items
      await prisma.email.update({
        where: { id: emailId },
        data: {
          actionItems,
          actionItemsExtractedAt: new Date()
        }
      });

      res.json({
        success: true,
        data: {
          emailId,
          actionItems,
          email: {
            id: email.id,
            subject: email.subject,
            sender: email.sender
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Categorize email
   * POST /api/agent/categorize
   * Body: { emailId, customPrompt? }
   */
  async categorizeEmail(req, res, next) {
    try {
      const { emailId, customPrompt } = req.body;
      
      if (!emailId) {
        return res.status(400).json({
          error: true,
          message: 'emailId is required'
        });
      }

      const email = await prisma.email.findUnique({
        where: { id: emailId }
      });
      
      if (!email) {
        return res.status(404).json({
          error: true,
          message: `Email with ID ${emailId} not found`
        });
      }

      const prompts = await prisma.prompt.findMany();
      const categorizationPrompt = prompts.find(p => p.type === 'categorization');
      
      const category = await llmService.runCategorizationPrompt(
        email, 
        customPrompt || categorizationPrompt?.content || 'Categorize this email'
      );
      
      const categoryColor = this.getCategoryColor(category);
      
      // Update email with category
      await prisma.email.update({
        where: { id: emailId },
        data: {
          category,
          categoryColor,
          categorizedAt: new Date()
        }
      });

      res.json({
        success: true,
        data: {
          emailId,
          category,
          categoryColor,
          email: {
            id: email.id,
            subject: email.subject,
            sender: email.sender
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get agent capabilities and status
   * GET /api/agent/status
   */
  async getStatus(req, res, next) {
    try {
      // Get data from database
      const [emails, prompts, conversations] = await Promise.all([
        prisma.email.findMany(),
        prisma.prompt.findMany(),
        prisma.chatHistory.findMany()
      ]);

      res.json({
        success: true,
        data: {
          status: 'active',
          capabilities: [
            'Email summarization',
            'Action item extraction',
            'Email categorization',
            'Reply draft generation',
            'RAG-powered Q&A',
            'Conversation history',
            'Custom prompt support'
          ],
          statistics: {
            totalEmails: emails.length,
            processedEmails: emails.filter(e => e.processed).length,
            totalConversations: conversations.length
          },
          prompts: {
            categorization: prompts.some(p => p.type === 'categorization'),
            actionItems: prompts.some(p => p.type === 'actionItems'),
            autoReply: prompts.some(p => p.type === 'autoReply'),
            lastUpdated: prompts.length > 0 ? Math.max(...prompts.map(p => new Date(p.updatedAt).getTime())) : null
          },
          llmService: {
            mode: llmService.mode,
            model: llmService.model
          }
        }
      });
    } catch (error) {
      next(error);
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

module.exports = new AgentController();