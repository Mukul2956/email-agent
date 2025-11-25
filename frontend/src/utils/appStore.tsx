import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Email, Draft, mockEmails, mockDrafts } from './mockData';
import { apiService } from '../services/apiService';
import { toast } from 'sonner';

// Add getCategoryColor utility function
export function getCategoryColor(category: string): string {
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

// Interfaces
export interface AppState {
  emails: Email[];
  drafts: Draft[];
  prompts: {
    categorization: string;
    actionItems: string;
    autoReply: string;
  };
  selectedEmailId: string | null;
  isLoading: boolean;
  error: string | null;
  processingProgress: {
    current: number;
    total: number;
    isProcessing: boolean;
  };
  backendConnected: boolean;
}

export type AppAction = 
  | { type: 'SET_EMAILS'; payload: Email[] }
  | { type: 'ADD_EMAIL'; payload: Email }
  | { type: 'UPDATE_EMAIL'; payload: { id: string; updates: Partial<Email> } }
  | { type: 'DELETE_EMAIL'; payload: string }
  | { type: 'SET_DRAFTS'; payload: Draft[] }
  | { type: 'ADD_DRAFT'; payload: Omit<Draft, 'id' | 'timestamp'> }
  | { type: 'UPDATE_DRAFT'; payload: { id: string; updates: Partial<Draft> } }
  | { type: 'DELETE_DRAFT'; payload: string }
  | { type: 'UPDATE_PROMPTS'; payload: Partial<AppState['prompts']> }
  | { type: 'SET_SELECTED_EMAIL'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROCESSING_PROGRESS'; payload: Partial<AppState['processingProgress']> }
  | { type: 'MARK_EMAIL_READ'; payload: string }
  | { type: 'MARK_EMAIL_UNREAD'; payload: string }
  | { type: 'SET_BACKEND_CONNECTED'; payload: boolean };

// Initial state
const initialState: AppState = {
  emails: [],
  drafts: [],
  prompts: {
    categorization: `Analyze the email content and sender information to categorize it into one of the following categories:
- Work: Professional emails, meetings, projects, tasks
- Personal: Friends, family, personal matters
- Shopping: Orders, receipts, shipping notifications
- Social: Social media, newsletters, community updates
- Finance: Banking, invoices, payments
- Design: Design-related discussions, feedback, assets

Return only the category name.`,
    actionItems: `Extract actionable items from the email that require a response or action from the recipient.

For each action item:
1. Be specific and concise
2. Include deadlines if mentioned
3. Focus on what needs to be done
4. Ignore marketing or informational content

Return a bulleted list of action items, or an empty list if none exist.`,
    autoReply: `Generate a professional and contextually appropriate email reply based on the original email content.

Guidelines:
1. Match the tone of the original email (formal/casual)
2. Address all questions or requests mentioned
3. Be concise but complete
4. Include appropriate greeting and closing
5. Leave placeholders [DETAILS] where specific information is needed

Generate a draft reply that can be edited before sending.`,
  },
  selectedEmailId: null,
  isLoading: false,
  error: null,
  processingProgress: {
    current: 0,
    total: 0,
    isProcessing: false,
  },
  backendConnected: false,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_EMAILS':
      return {
        ...state,
        emails: action.payload,
        selectedEmailId: state.selectedEmailId || action.payload[0]?.id || null,
      };
    
    case 'ADD_EMAIL':
      return {
        ...state,
        emails: [action.payload, ...state.emails],
      };
    
    case 'UPDATE_EMAIL':
      return {
        ...state,
        emails: state.emails.map(email =>
          email.id === action.payload.id
            ? { ...email, ...action.payload.updates }
            : email
        ),
      };
    
    case 'DELETE_EMAIL':
      return {
        ...state,
        emails: state.emails.filter(email => email.id !== action.payload),
        selectedEmailId: state.selectedEmailId === action.payload ? null : state.selectedEmailId,
      };
    
    case 'SET_DRAFTS':
      return {
        ...state,
        drafts: action.payload,
      };
    
    case 'ADD_DRAFT':
      const newDraft: Draft = {
        id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toLocaleString(),
        ...action.payload,
      };
      return {
        ...state,
        drafts: [newDraft, ...state.drafts],
      };
    
    case 'UPDATE_DRAFT':
      return {
        ...state,
        drafts: state.drafts.map(draft =>
          draft.id === action.payload.id
            ? { ...draft, ...action.payload.updates }
            : draft
        ),
      };
    
    case 'DELETE_DRAFT':
      return {
        ...state,
        drafts: state.drafts.filter(draft => draft.id !== action.payload),
      };
    
    case 'UPDATE_PROMPTS':
      return {
        ...state,
        prompts: { ...state.prompts, ...action.payload },
      };
    
    case 'SET_SELECTED_EMAIL':
      return {
        ...state,
        selectedEmailId: action.payload,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    
    case 'SET_PROCESSING_PROGRESS':
      return {
        ...state,
        processingProgress: { ...state.processingProgress, ...action.payload },
      };
    
    case 'MARK_EMAIL_READ':
      return {
        ...state,
        emails: state.emails.map(email =>
          email.id === action.payload
            ? { ...email, read: true }
            : email
        ),
      };
    
    case 'MARK_EMAIL_UNREAD':
      return {
        ...state,
        emails: state.emails.map(email =>
          email.id === action.payload
            ? { ...email, read: false }
            : email
        ),
      };
    
    case 'SET_BACKEND_CONNECTED':
      return {
        ...state,
        backendConnected: action.payload,
      };
    
    default:
      return state;
  }
}

// Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  processEmailWithAI: (emailId: string) => Promise<void>;
  updateEmailBackend: (emailId: string, updates: Partial<Email>) => Promise<void>;
} | null>(null);

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize backend connection and load data
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Check backend connection only
      const health = await apiService.healthCheck();
      console.log('✅ Backend connected:', health);
      dispatch({ type: 'SET_BACKEND_CONNECTED', payload: true });
      toast.success('Backend connected successfully');
      // Only load drafts and prompts, NOT emails
      await Promise.all([
        loadDraftsFromBackend(),
        loadPromptsFromBackend(),
      ]);
    } catch (error) {
      console.warn('⚠️ Backend connection failed, using mock data:', error);
      dispatch({ type: 'SET_BACKEND_CONNECTED', payload: false });
      toast.warning('Backend not available, using offline mode');
      // Load mock data as fallback
      dispatch({ type: 'SET_DRAFTS', payload: mockDrafts });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadEmailsFromBackend = async () => {
    try {
      const response = await apiService.getEmails();
      if (response.success && response.data) {
        dispatch({ type: 'SET_EMAILS', payload: response.data });
        console.log(`📧 Loaded ${response.data.length} emails from backend`);
      }
    } catch (error) {
      console.error('Failed to load emails from backend:', error);
      dispatch({ type: 'SET_EMAILS', payload: mockEmails });
    }
  };

  const loadDraftsFromBackend = async () => {
    try {
      const response = await apiService.getDrafts();
      if (response.success && response.data) {
        dispatch({ type: 'SET_DRAFTS', payload: response.data });
        console.log(`📝 Loaded ${response.data.length} drafts from backend`);
      }
    } catch (error) {
      console.error('Failed to load drafts from backend:', error);
      dispatch({ type: 'SET_DRAFTS', payload: mockDrafts });
    }
  };

  const loadPromptsFromBackend = async () => {
    try {
      const response = await apiService.getPrompts();
      if (response.success && response.data) {
        dispatch({ type: 'UPDATE_PROMPTS', payload: response.data });
        console.log('🧠 Loaded prompts from backend');
      }
    } catch (error) {
      console.error('Failed to load prompts from backend:', error);
    }
  };

  // Process email with AI (backend integration)
  const processEmailWithAI = async (emailId: string) => {
    if (!state.backendConnected) {
      toast.error('Backend not connected, AI processing unavailable');
      throw new Error('Backend not connected');
    }

    try {
      dispatch({ type: 'SET_PROCESSING_PROGRESS', payload: { isProcessing: true } });
      
      const response = await apiService.processEmail(emailId);
      if (response.success && response.data?.email) {
        dispatch({ 
          type: 'UPDATE_EMAIL', 
          payload: { id: emailId, updates: response.data.email }
        });
        toast.success('Email processed with AI successfully');
        console.log(`✅ Email ${emailId} processed with AI`);
      }
    } catch (error) {
      console.error('Failed to process email with AI:', error);
      toast.error('Failed to process email with AI');
      throw error;
    } finally {
      dispatch({ type: 'SET_PROCESSING_PROGRESS', payload: { isProcessing: false } });
    }
  };

  // Update email (with backend sync)
  const updateEmailBackend = async (emailId: string, updates: Partial<Email>) => {
    // Update local state immediately for better UX
    dispatch({ type: 'UPDATE_EMAIL', payload: { id: emailId, updates } });
    
    if (state.backendConnected) {
      try {
        await apiService.updateEmail(emailId, updates);
      } catch (error) {
        console.error('Failed to sync email update to backend:', error);
        toast.warning('Failed to sync changes to server');
      }
    }
  };

  // Initialize with mock data (keeping existing logic as fallback)
  // Remove fallback to mockEmails so inbox is always empty on reload
  useEffect(() => {
    if (!state.backendConnected) {
      dispatch({ type: 'SET_EMAILS', payload: [] });
      dispatch({ type: 'SET_DRAFTS', payload: [] });
    }
  }, [state.backendConnected]);

  // Auto-save to localStorage
  useEffect(() => {
    if (state.emails.length > 0) {
      localStorage.setItem('emailDashboard_emails', JSON.stringify(state.emails));
    }
  }, [state.emails]);

  useEffect(() => {
    if (state.drafts.length > 0) {
      localStorage.setItem('emailDashboard_drafts', JSON.stringify(state.drafts));
    }
  }, [state.drafts]);

  useEffect(() => {
    localStorage.setItem('emailDashboard_prompts', JSON.stringify(state.prompts));
  }, [state.prompts]);

  // Load from localStorage on mount
  // Remove localStorage auto-load for emails/drafts so inbox is always empty
  useEffect(() => {
    // No longer loading emails or drafts from localStorage
    try {
      const savedPrompts = localStorage.getItem('emailDashboard_prompts');
      if (savedPrompts) {
        const prompts = JSON.parse(savedPrompts);
        dispatch({ type: 'UPDATE_PROMPTS', payload: prompts });
      }
    } catch (error) {
      console.error('Error loading saved prompts:', error);
      toast.error('Error loading saved prompts, using defaults');
    }
  }, []);

  return (
    <AppContext.Provider value={{ 
      state, 
      dispatch, 
      processEmailWithAI,
      updateEmailBackend 
    }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

// Utility functions
export function generateEmailId(): string {
  return `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}