// OpenRouter AI integration
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
// Using Claude 3.5 Haiku - most reliable model
const MODEL = 'anthropic/claude-3-5-haiku';

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface AIRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

class OpenRouterClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = OPENROUTER_API_KEY;
    this.baseUrl = OPENROUTER_BASE_URL;
    this.model = MODEL;
  }

  private async makeRequest(request: AIRequest): Promise<string> {
    if (!this.apiKey) {
      console.warn('OpenRouter API key not found, using mock response');
      return this.generateMockResponse(request.messages[request.messages.length - 1]?.content || '');
    }

    try {
      const requestBody = {
        model: this.model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.max_tokens || 500,
      };

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://localhost:3000',
          'X-Title': 'AI Email Dashboard'
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        throw new Error(`API error: ${response.status}`);
      }

      const data: OpenRouterResponse = await response.json();
      return data.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      console.error('OpenRouter error:', error);
      return this.generateMockResponse(request.messages[request.messages.length - 1]?.content || '');
    }
  }

  private generateMockResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('categorize')) {
      const categories = ['Work', 'Personal', 'Shopping', 'Social', 'Finance', 'Design'];
      return categories[Math.floor(Math.random() * categories.length)];
    }
    
    if (lowerMessage.includes('action') || lowerMessage.includes('task')) {
      return '• Review the attached document\n• Respond by end of week\n• Schedule follow-up meeting';
    }
    
    if (lowerMessage.includes('reply') || lowerMessage.includes('response')) {
      return 'Dear [Name],\n\nThank you for your email. I have reviewed your message and will get back to you with a detailed response within 24 hours.\n\nBest regards,\n[Your Name]';
    }
    
    return 'I understand your request and will help you with that.';
  }

  /**
   * Create a knowledge base from email content for RAG
   * Breaks down email into semantic chunks and metadata
   */
  private createEmailKnowledgeBase(email: any): string {
    const knowledgeBase = [];
    
    // Basic email metadata
    knowledgeBase.push(`Email Metadata:
- From: ${email.sender.name} (${email.sender.email})
- Subject: ${email.subject}
- Category: ${email.category || 'Unknown'}
- Received: ${email.timestamp || 'Unknown'}`);
    
    // Email body content
    knowledgeBase.push(`\nEmail Content:\n${email.body}`);
    
    // Action items if available
    if (email.actionItems && email.actionItems.length > 0) {
      knowledgeBase.push(`\nIdentified Action Items:\n${email.actionItems.map((item: string, i: number) => `${i + 1}. ${item}`).join('\n')}`);
    }
    
    // Summary if available
    if (email.summary) {
      knowledgeBase.push(`\nEmail Summary:\n${email.summary}`);
    }
    
    return knowledgeBase.join('\n');
  }

  /**
   * Extract key entities and topics from email for better context
   */
  private extractEmailContext(email: any): string[] {
    const context = [];
    
    // Sender information
    context.push(`The sender is ${email.sender.name} from ${email.sender.email}`);
    
    // Subject analysis
    context.push(`The email subject is: "${email.subject}"`);
    
    // Category context
    if (email.category) {
      context.push(`This is categorized as a ${email.category} email`);
    }
    
    // Time context
    if (email.timestamp) {
      context.push(`The email was received ${email.timestamp}`);
    }
    
    // Action items context
    if (email.actionItems && email.actionItems.length > 0) {
      context.push(`There are ${email.actionItems.length} action items that need attention`);
    }
    
    return context;
  }

  async categorizeEmail(email: { subject: string; body: string; sender: any }, customPrompt?: string): Promise<string> {
    const systemPrompt = customPrompt || 'You are an email categorization assistant. Categorize emails into exactly one of these categories: Work, Personal, Shopping, Social, Finance, Design, Newsletter, Spam. Respond with only the category name.';
    
    const response = await this.makeRequest({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Categorize this email:
Subject: ${email.subject}
From: ${email.sender.email}
Body: ${email.body.substring(0, 500)}`
        }
      ],
      temperature: 0.3,
      max_tokens: 10
    });
    
    const category = response.trim();
    const validCategories = ['Work', 'Personal', 'Shopping', 'Social', 'Finance', 'Design', 'Newsletter', 'Spam'];
    return validCategories.includes(category) ? category : 'Work';
  }

  async extractActionItems(email: { subject: string; body: string }, customPrompt?: string): Promise<string[]> {
    const systemPrompt = customPrompt || 'Extract actionable items from emails. Return a list of specific actions the recipient should take. Each item should be concise and actionable. If no action items exist, return an empty list.';
    
    const response = await this.makeRequest({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Extract action items from this email:
Subject: ${email.subject}
Body: ${email.body}`
        }
      ],
      temperature: 0.5,
      max_tokens: 200
    });
    
    return response
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^[•\-\*\d\.]\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  async generateReply(email: { subject: string; body: string; sender: any }, tone: 'professional' | 'casual' | 'formal' = 'professional', customPrompt?: string): Promise<string> {
    let systemPrompt = customPrompt;
    
    if (!systemPrompt) {
      if (tone === 'casual') {
        systemPrompt = 'You are an email assistant that generates casual, friendly email replies.';
      } else if (tone === 'formal') {
        systemPrompt = 'You are an email assistant that generates formal, business email replies.';
      } else {
        systemPrompt = 'You are an email assistant that generates professional email replies.';
      }
      systemPrompt += ` Generate a complete email reply that addresses the sender's message appropriately. Include a proper greeting, body, and professional closing. The tone should be ${tone}.`;
    }

    const response = await this.makeRequest({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Generate a reply to this email:
From: ${email.sender.name} <${email.sender.email}>
Subject: ${email.subject}
Body: ${email.body}`
        }
      ],
      temperature: 0.7,
      max_tokens: 400
    });
    
    return response;
  }

  async generateEmailDraft(
    prompt: string, 
    tone: string = 'professional', 
    context?: { to?: string; subject?: string }
  ): Promise<string> {
    const response = await this.makeRequest({
      messages: [
        {
          role: 'system',
          content: `You are an expert email writer. Generate professional email drafts based on user requests. 
          
          Tone: ${tone}
          ${context?.to ? `Recipient: ${context.to}` : ''}
          ${context?.subject ? `Subject context: ${context.subject}` : ''}
          
          Format your response as a complete email with:
          - Subject: [subject line]
          - [email body with proper greeting, content, and closing]
          
          Make the email clear, concise, and appropriate for the specified tone.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 400
    });
    
    return response;
  }

  async enhanceEmailDraft(draftContent: string, tone: string = 'professional'): Promise<string> {
    const response = await this.makeRequest({
      messages: [
        {
          role: 'system',
          content: `You are an expert email editor. Enhance the given email draft to be more ${tone}, clear, and effective while maintaining the original intent and key information. 
          
          Improve:
          - Clarity and readability
          - Professional tone and language
          - Structure and flow
          - Grammar and spelling
          - Impact and persuasiveness
          
          Return only the enhanced email content without additional commentary.`
        },
        {
          role: 'user',
          content: `Please enhance this email draft:\n\n${draftContent}`
        }
      ],
      temperature: 0.6,
      max_tokens: 500
    });
    
    return response;
  }

  async chatWithAgent(
    userMessage: string,
    conversationHistory: Array<{ role: string; content: string }>,
    emailContext?: any
  ): Promise<string> {
    let systemContent = 'You are an AI email assistant. Help users manage their emails effectively.';
    
    // RAG Implementation: Create knowledge base if email context exists
    if (emailContext) {
      const knowledgeBase = this.createEmailKnowledgeBase(emailContext);
      const contextPoints = this.extractEmailContext(emailContext);
      
      systemContent = `You are an AI email assistant with access to the complete email information below.

═══════════════════════════════════════
EMAIL KNOWLEDGE BASE (Use this to answer ALL questions)
═══════════════════════════════════════

${knowledgeBase}

═══════════════════════════════════════
KEY CONTEXT POINTS:
═══════════════════════════════════════
${contextPoints.map(point => `• ${point}`).join('\n')}

═══════════════════════════════════════
YOUR CAPABILITIES:
═══════════════════════════════════════
You can help with:
- Answering ANY question about this specific email
- Explaining what the email is about, its purpose, and content
- Summarizing the email content
- Extracting specific information from the email
- Identifying action items and deadlines
- Drafting appropriate replies
- Suggesting follow-up actions
- Analyzing tone, urgency, and importance
- Finding specific details mentioned in the email

═══════════════════════════════════════
INSTRUCTIONS:
═══════════════════════════════════════
1. ALWAYS reference the knowledge base above to answer questions
2. Be specific and cite actual content from the email
3. If asked "what is this email about", provide a comprehensive explanation including:
   - Who sent it and why
   - The main topic/purpose
   - Key points from the content
   - Any requests or action items
   - The context and category
4. For ANY question, search through the entire email content and metadata
5. Be helpful, accurate, and detailed
6. If information isn't in the email, clearly state that

Now, use the knowledge base to answer the user's question accurately.`;
    } else {
      systemContent += '\n\nNo specific email selected. Provide general email management assistance.\n\nYou can help with:\n- General email management advice\n- Productivity tips\n- Email best practices\n- Organizational strategies';
    }

    const systemMessage = {
      role: 'system' as const,
      content: systemContent
    };

    // Include conversation history for context
    const messages = [
      systemMessage,
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: userMessage
      }
    ];

    const response = await this.makeRequest({
      messages,
      temperature: 0.7,
      max_tokens: 600
    });
    
    return response;
  }

  async summarizeEmail(email: { subject: string; body: string }): Promise<string> {
    const response = await this.makeRequest({
      messages: [
        {
          role: 'system',
          content: 'Summarize emails concisely, highlighting key points and any action items. Keep it under 2-3 sentences.'
        },
        {
          role: 'user',
          content: `Summarize this email:
Subject: ${email.subject}
Body: ${email.body}`
        }
      ],
      temperature: 0.5,
      max_tokens: 150
    });
    
    return response;
  }
}

// Export singleton instance
export const openRouterClient = new OpenRouterClient();
export const aiClient = openRouterClient; // Legacy alias
