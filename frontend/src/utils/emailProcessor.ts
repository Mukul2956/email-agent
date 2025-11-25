import { aiClient } from './openrouter';
import { Email, Draft } from './mockData';

interface ProcessingResult {
  success: boolean;
  email: Email;
  error?: string;
}

interface ProcessingProgress {
  current: number;
  total: number;
  isProcessing: boolean;
}

export class EmailProcessor {
  private static instance: EmailProcessor;
  private prompts?: {
    categorization: string;
    actionItems: string;
    autoReply: string;
  };

  static getInstance(): EmailProcessor {
    if (!EmailProcessor.instance) {
      EmailProcessor.instance = new EmailProcessor();
    }
    return EmailProcessor.instance;
  }

  // Set custom prompts from app state
  setPrompts(prompts: { categorization: string; actionItems: string; autoReply: string }) {
    this.prompts = prompts;
  }

  async processEmail(
    email: Email, 
    progressCallback?: (progress: ProcessingProgress) => void
  ): Promise<ProcessingResult> {
    try {
      progressCallback?.({ current: 0, total: 3, isProcessing: true });

      // Step 1: Categorize email using custom prompt
      const category = await aiClient.categorizeEmail(email, this.prompts?.categorization);
      email.category = category;
      email.categoryColor = this.getCategoryColor(category);
      
      progressCallback?.({ current: 1, total: 3, isProcessing: true });

      // Step 2: Extract action items using custom prompt
      const actionItems = await aiClient.extractActionItems(email, this.prompts?.actionItems);
      email.actionItems = actionItems;

      progressCallback?.({ current: 2, total: 3, isProcessing: true });

      // Step 3: Generate summary
      const summary = await aiClient.summarizeEmail(email);
      email.summary = summary;

      progressCallback?.({ current: 3, total: 3, isProcessing: false });

      return { success: true, email };
    } catch (error) {
      console.error('Error processing email:', error);
      return { 
        success: false, 
        email, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async processBatch(
    emails: Email[],
    progressCallback?: (progress: ProcessingProgress) => void
  ): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];
    
    for (let i = 0; i < emails.length; i++) {
      progressCallback?.({ 
        current: i, 
        total: emails.length, 
        isProcessing: true 
      });

      const result = await this.processEmail(emails[i]);
      results.push(result);

      // Small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    progressCallback?.({ 
      current: emails.length, 
      total: emails.length, 
      isProcessing: false 
    });

    return results;
  }

  async generateReply(
    email: Email, 
    tone: 'professional' | 'casual' | 'formal' = 'professional'
  ): Promise<string> {
    try {
      return await aiClient.generateReply(email, tone, this.prompts?.autoReply);
    } catch (error) {
      console.error('Error generating reply:', error);
      return `Dear ${email.sender.name},\n\nThank you for your email. I'll review it and get back to you soon.\n\nBest regards`;
    }
  }

  async generateDraftFromEmail(email: Email): Promise<Draft> {
    try {
      let replyContent = '';
      if (email.actionItems.length > 0) {
        const customPrompt = `Generate a reply addressing these action items: ${email.actionItems.join(', ')}`;
        replyContent = await aiClient.chatWithAgent(
          customPrompt,
          [],
          email
        );
      } else {
        replyContent = await this.generateReply(email);
      }

      return {
        id: `draft-${Date.now()}`,
        to: email.sender.email,
        subject: `Re: ${email.subject}`,
        body: replyContent,
        category: email.category || 'Work',
        categoryColor: email.categoryColor || 'bg-blue-500',
        timestamp: new Date().toLocaleString(),
      };
    } catch (error) {
      console.error('Error generating draft:', error);
      return {
        id: `draft-${Date.now()}`,
        to: email.sender.email,
        subject: `Re: ${email.subject}`,
        body: `Dear ${email.sender.name},\n\nThank you for your email regarding "${email.subject}". I'll review the details and get back to you soon.\n\nBest regards`,
        category: email.category || 'Work',
        categoryColor: email.categoryColor || 'bg-blue-500',
        timestamp: new Date().toLocaleString(),
      };
    }
  }

  async enhanceEmail(email: Email): Promise<string> {
    try {
      return await aiClient.summarizeEmail(email);
    } catch (error) {
      console.error('Error enhancing email:', error);
      return email.body;
    }
  }

  private getCategoryColor(category: string): string {
    const colorMap: Record<string, string> = {
      'Work': 'bg-blue-500',
      'Personal': 'bg-green-500',
      'Shopping': 'bg-purple-500',
      'Social': 'bg-pink-500',
      'Finance': 'bg-orange-500',
      'Design': 'bg-indigo-500',
      'Newsletter': 'bg-gray-500',
      'Spam': 'bg-red-500',
    };
    return colorMap[category] || 'bg-gray-500';
  }
}

export const emailProcessor = EmailProcessor.getInstance();
