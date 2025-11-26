
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
};

type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: boolean;
};

/**
 * API Service for Email Productivity Backend
 * Handles all API calls to the Node.js backend
 */
class ApiService {
  /**
   * Generic API request method
   */
  async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      method: options.method || 'GET',
      ...options,
    };
    if (options.body !== undefined) {
      config.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }
    try {
      const response = await fetch(url, config);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      return data;
    } catch (error: any) {
      console.error(`API request failed for ${endpoint}:`, error);
      return { success: false, message: error.message || 'Unknown error', error: true };
    }
  }

  // Health Check
  async healthCheck() {
    return this.request('/health');
  }

  // Email endpoints
  async getEmails() {
    return this.request('/emails');
  }
  async getEmail(id: string) {
    return this.request(`/emails/${id}`);
  }
  async createEmail(emailData: any) {
    return this.request('/emails', { method: 'POST', body: emailData });
  }
  async updateEmail(id: string, updates: any) {
    return this.request(`/emails/${id}`, { method: 'PUT', body: updates });
  }
  async deleteEmail(id: string) {
    return this.request(`/emails/${id}`, { method: 'DELETE' });
  }
  async markEmailAsRead(id: string) {
    return this.request(`/emails/${id}/read`, { method: 'POST' });
  }
  async markEmailAsUnread(id: string) {
    return this.request(`/emails/${id}/unread`, { method: 'POST' });
  }
  async starEmail(id: string) {
    return this.request(`/emails/${id}/star`, { method: 'POST' });
  }
  async unstarEmail(id: string) {
    return this.request(`/emails/${id}/unstar`, { method: 'POST' });
  }
  async moveEmailToTrash(id: string) {
    return this.request(`/emails/${id}/trash`, { method: 'DELETE' });
  }
  async restoreEmailFromTrash(id: string) {
    return this.request(`/emails/${id}/restore`, { method: 'POST' });
  }
  async searchEmails(query: string, options: Record<string, any> = {}) {
    const params = new URLSearchParams(options as Record<string, string>);
    return this.request(`/emails/search/${encodeURIComponent(query)}?${params}`);
  }
  async getEmailsByCategory(category: string, options: Record<string, any> = {}) {
    const params = new URLSearchParams(options as Record<string, string>);
    return this.request(`/emails/category/${category}?${params}`);
  }

  // Prompt endpoints
  async getPrompts() {
    return this.request('/prompts');
  }
  async getPrompt(type: string) {
    return this.request(`/prompts/${type}`);
  }
  async createPrompt(promptData: any) {
    return this.request('/prompts', { method: 'POST', body: promptData });
  }
  async updatePrompt(type: string, content: string) {
    return this.request(`/prompts/${type}`, { method: 'PUT', body: { content } });
  }
  async deletePrompt(type: string) {
    return this.request(`/prompts/${type}`, { method: 'DELETE' });
  }
  async resetPromptsToDefaults() {
    return this.request('/prompts/reset', { method: 'POST' });
  }
  async exportPrompts() {
    return this.request('/prompts/export', { method: 'POST' });
  }
  async importPrompts(prompts: any) {
    return this.request('/prompts/import', { method: 'POST', body: { prompts } });
  }
  async testPrompt(type: string, opts: { sampleEmail?: any; prompt?: string } = {}) {
    return this.request(`/prompts/test/${type}`, { method: 'POST', body: opts });
  }

  // Draft endpoints
  async getDrafts() {
    return this.request('/drafts');
  }
  async getDraft(id: string) {
    return this.request(`/drafts/${id}`);
  }
  async createDraft(draftData: any) {
    return this.request('/drafts', { method: 'POST', body: draftData });
  }
  async updateDraft(id: string, updates: any) {
    return this.request(`/drafts/${id}`, { method: 'PUT', body: updates });
  }
  async deleteDraft(id: string) {
    return this.request(`/drafts/${id}`, { method: 'DELETE' });
  }
  async generateReply(emailData: any, options: Record<string, any> = {}) {
    return this.request('/drafts/generate', { method: 'POST', body: { ...emailData, ...options } });
  }
  async improveDraft(id: string, instructions: string = 'improve clarity and professionalism') {
    return this.request(`/drafts/${id}/improve`, { method: 'POST', body: { instructions } });
  }
  async sendDraft(id: string, recipients: Record<string, any> = {}) {
    return this.request(`/drafts/${id}/send`, { method: 'POST', body: recipients });
  }
  async getDraftsForEmail(emailId: string, limit: number = 10) {
    return this.request(`/drafts/for-email/${emailId}?limit=${limit}`);
  }

  // Agent endpoints
  async chatWithAgent(query: string, emailId: string | null = null, conversationHistory: any[] = []) {
    return this.request('/agent/chat', { method: 'POST', body: { query, emailId, conversationHistory } });
  }
  async getConversations(options: Record<string, any> = {}) {
    const params = new URLSearchParams(options as Record<string, string>);
    return this.request(`/agent/conversations?${params}`);
  }
  async summarizeEmail(emailId: string) {
    return this.request('/agent/summarize', { method: 'POST', body: { emailId } });
  }
  async extractActionItems(emailId: string, customPrompt: string | null = null) {
    return this.request('/agent/action-items', { method: 'POST', body: { emailId, customPrompt } });
  }
  async categorizeEmail(emailId: string, customPrompt: string | null = null) {
    return this.request('/agent/categorize', { method: 'POST', body: { emailId, customPrompt } });
  }
  async getAgentStatus() {
    return this.request('/agent/status');
  }

  // Process endpoints
  async processEmail(emailId: string, prompts: any = null, options: Record<string, any> = {}) {
    return this.request('/process/email', { method: 'POST', body: { emailId, prompts, options } });
  }
  async processBatch(emailIds: string[], prompts: any = null, options: Record<string, any> = {}) {
    return this.request('/process/batch', { method: 'POST', body: { emailIds, prompts, options } });
  }
  async getProcessingHistory(options: Record<string, any> = {}) {
    const params = new URLSearchParams(options as Record<string, string>);
    return this.request(`/process/history?${params}`);
  }
  async getProcessingStats() {
    return this.request('/process/stats');
  }
}

export const apiService = new ApiService();
export default apiService;