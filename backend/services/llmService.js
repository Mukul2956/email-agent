const OpenAI = require('openai');

/**
 * LLM Service - Handles AI/LLM operations
 * Supports both OpenAI and OpenRouter APIs
 */
class LLMService {
  constructor() {
    // Try OpenAI first, then OpenRouter, then mock mode
    try {
      this.mode = this.initializeClient();
      console.log(`🤖 LLM Service initialized in ${this.mode} mode`);
    } catch (error) {
      console.warn('⚠️ LLM Service initialization failed, using mock mode:', error.message);
      this.mode = 'Mock';
    }
  }

  initializeClient() {
    try {
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
        this.client = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        this.model = 'gpt-4o-mini';
        return 'OpenAI';
      } 
      
      if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.startsWith('sk-or-')) {
        this.client = new OpenAI({
          apiKey: process.env.OPENROUTER_API_KEY,
          baseURL: 'https://openrouter.ai/api/v1'
        });
        this.model = 'anthropic/claude-3-5-haiku';
        return 'OpenRouter';
      }

      return 'Mock';
    } catch (error) {
      console.warn('⚠️ Client initialization failed:', error.message);
      return 'Mock';
    }
  }

  /**
   * Make API request to LLM
   * @param {Array} messages - Array of messages
   * @param {Object} options - Request options
   * @returns {Promise<string>} LLM response
   */
  async makeRequest(messages, options = {}) {
    if (this.mode === 'Mock') {
      return this.generateMockResponse(messages[messages.length - 1]?.content || '');
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 500,
        ...options
      });

      return completion.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('LLM API error:', error);
      // Fallback to mock response on error
      return this.generateMockResponse(messages[messages.length - 1]?.content || '');
    }
  }

  /**
   * Generate mock response for testing
   * @param {string} userMessage - User's message
   * @returns {string} Mock response
   */
  generateMockResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('categorize') || lowerMessage.includes('category')) {
      const categories = ['Work', 'Personal', 'Shopping', 'Social', 'Finance', 'Design', 'Education', 'Newsletter', 'Spam'];
      return categories[Math.floor(Math.random() * categories.length)];
    }
    
    if (lowerMessage.includes('action') || lowerMessage.includes('task')) {
      return '• Review the attached document\\n• Respond by end of week\\n• Schedule follow-up meeting';
    }
    
    if (lowerMessage.includes('reply') || lowerMessage.includes('response')) {
      return 'Dear [Name],\\n\\nThank you for your email. I have reviewed your message and will get back to you with a detailed response within 24 hours.\\n\\nBest regards,\\n[Your Name]';
    }

    if (lowerMessage.includes('summary') || lowerMessage.includes('summarize')) {
      return 'This email discusses important project updates and requires immediate attention for several action items.';
    }
    
    return 'I understand your request and will help you with that.';
  }

  /**
   * Run categorization prompt
   * @param {Object} email - Email object
   * @param {string} customPrompt - Custom categorization prompt
   * @returns {Promise<string>} Category
   */
  async runCategorizationPrompt(email, customPrompt) {
    const systemPrompt = customPrompt || 'Categorize this email into one of these categories: Work, Personal, Shopping, Social, Finance, Design, Education, Newsletter, Spam. Return only the category name.';
    
    // Handle both string and object sender formats
    const senderInfo = typeof email.sender === 'string' ? email.sender : `${email.sender.name} <${email.sender.email}>`;
    
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Categorize this email:\nFrom: ${senderInfo}\nSubject: ${email.subject}\nBody: ${email.body.substring(0, 1000)}`
      }
    ];

    const response = await this.makeRequest(messages, { temperature: 0.3, maxTokens: 50 });
    const category = response.trim();
    const validCategories = ['Work', 'Personal', 'Shopping', 'Social', 'Finance', 'Design', 'Education', 'Newsletter', 'Spam'];
    return validCategories.includes(category) ? category : 'Work';
  }

  /**
   * Run action item extraction prompt
   * @param {Object} email - Email object
   * @param {string} customPrompt - Custom action items prompt
   * @returns {Promise<string[]>} Array of action items
   */
  async runActionItemPrompt(email, customPrompt) {
    const systemPrompt = customPrompt || 'Extract actionable items from this email. Return a list of specific actions the recipient should take. Each item should be concise and actionable. If no action items exist, return an empty list.';
    
    // Handle both string and object sender formats
    const senderInfo = typeof email.sender === 'string' ? email.sender : email.sender.name;
    
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Extract action items from this email:\nFrom: ${senderInfo}\nSubject: ${email.subject}\nBody: ${email.body}`
      }
    ];

    const response = await this.makeRequest(messages, { temperature: 0.5, maxTokens: 300 });
    
    return response
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^[•\\-\\*\\d\\.\\)\\s]+/, '').trim())
      .filter(line => line.length > 0);
  }

  /**
   * Generate email summary
   * @param {Object} email - Email object
   * @returns {Promise<string>} Summary
   */
  async generateSummary(email) {
    // Handle both string and object sender formats
    const senderInfo = typeof email.sender === 'string' ? email.sender : email.sender.name;
    
    const messages = [
      {
        role: 'system',
        content: 'Summarize this email concisely, highlighting key points and any action items. Keep it under 2-3 sentences.'
      },
      {
        role: 'user',
        content: `Summarize this email:\nFrom: ${senderInfo}\nSubject: ${email.subject}\nBody: ${email.body}`
      }
    ];

    return await this.makeRequest(messages, { temperature: 0.5, maxTokens: 200 });
  }

  /**
   * Run agent chat prompt with email context
   * @param {string} userQuery - User's question
   * @param {Object} emailContext - Email context
   * @param {Object} prompts - User-defined prompts
   * @param {Array} conversationHistory - Previous messages
   * @returns {Promise<string>} Agent response
   */
  async runAgentPrompt(userQuery, emailContext, prompts = {}, conversationHistory = []) {
    let systemContent = 'You are an AI email assistant. Help users manage their emails effectively.';
    
    if (emailContext) {
      const knowledgeBase = this.createEmailKnowledgeBase(emailContext);
      const contextPoints = this.extractEmailContext(emailContext);
      
      systemContent = `You are an AI email assistant with access to email information.

EMAIL KNOWLEDGE BASE:
${knowledgeBase}

KEY POINTS:
${contextPoints.map(point => `• ${point}`).join('\\n')}

USER'S CUSTOM PROMPTS:
- Categorization: ${prompts.categorization || 'Default categorization rules'}
- Action Items: ${prompts.actionItems || 'Default action item extraction'}  
- Auto Reply: ${prompts.autoReply || 'Default auto-reply generation'}

INSTRUCTIONS:
- Answer questions using the email information above
- Be specific and reference actual email content
- For "what is this email about": explain sender, topic, key points, and action items
- Use the user's custom prompts when relevant
- Be helpful and detailed

Answer the user's question accurately using this information.`;
    } else {
      systemContent += '\\n\\nNo email selected. Provide general email management assistance.';
    }

    const messages = [
      {
        role: 'system',
        content: systemContent
      },
      ...conversationHistory.slice(-6).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: userQuery
      }
    ];

    return await this.makeRequest(messages, { temperature: 0.7, maxTokens: 600 });
  }

  /**
   * Generate email reply draft
   * @param {Object} email - Original email
   * @param {string} customPrompt - Custom auto-reply prompt
   * @param {string} tone - Reply tone (professional, casual, formal)
   * @returns {Promise<string>} Reply draft
   */
  async generateReplyDraft(email, customPrompt, tone = 'professional') {
    let systemPrompt = customPrompt;
    
    if (!systemPrompt) {
      systemPrompt = `Generate a ${tone} email reply. Include proper greeting, body, and closing. Address the sender's message appropriately.`;
    }

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Generate a reply to this email:\nFrom: ${email.sender.name} <${email.sender.email}>\nSubject: ${email.subject}\nBody: ${email.body}`
      }
    ];

    return await this.makeRequest(messages, { temperature: 0.7, maxTokens: 400 });
  }

  /**
   * Improve draft content
   * @param {string} draftContent - Current draft content
   * @param {string} instructions - Improvement instructions
   * @returns {Promise<string>} Improved draft
   */
  async improveDraft(draftContent, instructions = 'improve clarity and professionalism') {
    const messages = [
      {
        role: 'system',
        content: 'You are an expert email writer. Improve the provided email draft based on the given instructions while maintaining the original intent and tone.'
      },
      {
        role: 'user',
        content: `Please improve this email draft:\n\nOriginal Draft:\n${draftContent}\n\nImprovement Instructions: ${instructions}\n\nPlease provide the improved version:`
      }
    ];

    return await this.makeRequest(messages, { temperature: 0.7, maxTokens: 400 });
  }

  /**
   * Create email knowledge base for RAG
   * @param {Object} email - Email object
   * @returns {string} Formatted knowledge base
   */
  createEmailKnowledgeBase(email) {
    const knowledgeBase = [];
    
    // Handle both string and object sender formats
    let senderInfo, senderEmail;
    if (typeof email.sender === 'string') {
      const matches = email.sender.match(/(.*?)\s*<(.*)>/) || [null, email.sender, ''];
      senderInfo = matches[1] || email.sender;
      senderEmail = matches[2] || email.sender;
    } else {
      senderInfo = email.sender.name;
      senderEmail = email.sender.email;
    }
    
    knowledgeBase.push(`Email Metadata:
- From: ${senderInfo} (${senderEmail})
- Subject: ${email.subject}
- Category: ${email.category || 'Unknown'}
- Received: ${email.timestamp || 'Unknown'}`);
    
    knowledgeBase.push(`\nEmail Content:\n${email.body}`);
    
    if (email.actionItems && email.actionItems.length > 0) {
      knowledgeBase.push(`\nIdentified Action Items:\n${email.actionItems.map((item, i) => `${i + 1}. ${item}`).join('\n')}`);
    }
    
    if (email.summary) {
      knowledgeBase.push(`\nEmail Summary:\n${email.summary}`);
    }
    
    return knowledgeBase.join('\n');
  }

  /**
   * Extract key context points from email
   * @param {Object} email - Email object
   * @returns {string[]} Context points
   */
  extractEmailContext(email) {
    const context = [];
    
    // Handle both string and object sender formats
    let senderInfo, senderEmail;
    if (typeof email.sender === 'string') {
      const matches = email.sender.match(/(.*?)\s*<(.*)>/) || [null, email.sender, ''];
      senderInfo = matches[1] || email.sender;
      senderEmail = matches[2] || email.sender;
    } else {
      senderInfo = email.sender.name;
      senderEmail = email.sender.email;
    }
    
    context.push(`The sender is ${senderInfo} from ${senderEmail}`);
    context.push(`The email subject is: "${email.subject}"`);
    
    if (email.category) {
      context.push(`This is categorized as a ${email.category} email`);
    }
    
    if (email.timestamp) {
      context.push(`The email was received ${email.timestamp}`);
    }
    
    if (email.actionItems && email.actionItems.length > 0) {
      context.push(`There are ${email.actionItems.length} action items that need attention`);
    }
    
    return context;
  }
}

module.exports = new LLMService();