import { useState, useEffect } from "react";
import { useApp } from "../utils/appStore";
import { emailProcessor } from "../utils/emailProcessor";
import { EmailListItem } from "../components/EmailListItem";
import { EmailPreview } from "../components/EmailPreview";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { Sparkles, Search, Filter, Archive, Trash2, CheckCircle, Bot, Download, Inbox as InboxIcon } from "lucide-react";
import { toast } from "sonner";
import { apiService } from "../services/apiService";

export function Inbox() {
  const { state, dispatch } = useApp();
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(
    state.emails[0]?.id || null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingInbox, setIsLoadingInbox] = useState(false);

  const selectedEmail = state.emails.find((email) => email.id === selectedEmailId);

  // Set prompts in emailProcessor whenever they change
  useEffect(() => {
    emailProcessor.setPrompts(state.prompts);
  }, [state.prompts]);

  // Filter emails based on search and category
  const filteredEmails = state.emails.filter((email) => {
    const matchesSearch = 
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.sender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.body.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || email.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Load inbox from database
  const loadInboxFromDatabase = async () => {
    setIsLoadingInbox(true);
    try {
      const response = await apiService.request('/emails/load-inbox', { method: 'POST' });
      if (response.success) {
        // Transform the emails to match frontend format
        const transformedEmails = response.data.map((email: any) => {
          // Extract name and email from sender field
          const senderParts = email.sender.match(/(.*?)\s*<(.*)>/) || [null, email.sender, email.sender];
          const senderName = senderParts[1] || email.sender;
          const senderEmail = senderParts[2] || email.sender;
          
          // Generate avatar initials
          const avatar = senderName.split(' ')
            .map((name: string) => name[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
          
          return {
            id: email.id,
            sender: {
              name: senderName,
              email: senderEmail,
              avatar: avatar
            },
            subject: email.subject,
            body: email.body,
            timestamp: new Date(email.receivedAt).toLocaleString(),
            category: email.category || 'Uncategorized',
            categoryColor: getCategoryColor(email.category),
            actionItems: email.actionItems || [],
            read: email.read,
            summary: '',
            processed: email.processed
          };
        });
        
        // Clear existing emails and load new ones
        dispatch({ type: 'SET_EMAILS', payload: transformedEmails });
        toast.success(`Loaded ${response.count} emails from database!`);
        
        // Set first email as selected if none selected
        if (transformedEmails.length > 0 && !selectedEmailId) {
          setSelectedEmailId(transformedEmails[0].id);
        }
      } else {
        toast.error("Failed to load inbox");
      }
    } catch (error) {
      console.error('Error loading inbox:', error);
      toast.error("Failed to load inbox from database");
    } finally {
      setIsLoadingInbox(false);
    }
  };

  // Helper function for category colors
  const getCategoryColor = (category: string | null) => {
    const colorMap: Record<string, string> = {
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
    return colorMap[category || 'Other'] || 'bg-gray-500';
  };

  const processEmailsWithAI = async () => {
    const unprocessedEmails = state.emails.filter(email => 
      !email.processed || email.category === 'Uncategorized'
    );

    if (unprocessedEmails.length === 0) {
      toast.info("All emails are already processed!");
      return;
    }

    setIsProcessing(true);
    try {
      toast.info(`Processing ${unprocessedEmails.length} emails with AI...`);
      
      // Use the backend API for processing
      const response = await apiService.request('/emails/process-all', { method: 'POST' });
      if (response.success) {
        // Reload emails to get updated categories
        await loadInboxFromDatabase();
        toast.success(`✨ Successfully processed ${response.count} emails with AI categorization!`);
      } else {
        toast.error("Failed to process emails with AI");
      }
    } catch (error) {
      console.error('Error processing emails:', error);
      toast.error("Failed to process emails with AI");
    } finally {
      setIsProcessing(false);
    }
  };

  const generateReplyDraft = async (email: any) => {
    try {
      const draft = await emailProcessor.generateDraftFromEmail(email);
      dispatch({ type: 'ADD_DRAFT', payload: draft });
      toast.success("Reply draft created!");
    } catch (error) {
      console.error('Error creating draft:', error);
      toast.error("Failed to create draft");
    }
  };

  const markAsRead = (emailId: string) => {
    dispatch({ 
      type: 'UPDATE_EMAIL', 
      payload: { 
        id: emailId,
        updates: { read: true }
      } 
    });
  };

  const archiveEmail = (emailId: string) => {
    dispatch({ type: 'DELETE_EMAIL', payload: emailId });
    toast.success("Email archived");
  };

  const deleteEmail = (emailId: string) => {
    dispatch({ type: 'DELETE_EMAIL', payload: emailId });
    toast.success("Email deleted");
  };

  return (
    <div className="h-full flex">
      {/* Email List - Left Column */}
      <div className="w-96 bg-white/50 backdrop-blur-sm border-r border-white/20 overflow-y-auto">
        <div className="p-6 border-b border-gray-200 bg-white/70">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Inbox</h2>
              <p className="text-sm text-gray-500">
                {filteredEmails.filter((e) => !e.read).length} unread of {filteredEmails.length} emails
              </p>
            </div>
            <div className="flex gap-2">
              {/* Show Load Inbox button when inbox is empty */}
              {state.emails.length === 0 && (
                <Button
                  onClick={loadInboxFromDatabase}
                  disabled={isLoadingInbox}
                  size="sm"
                  variant="outline"
                  className="border-blue-200 hover:bg-blue-50"
                >
                  {isLoadingInbox ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </div>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Load Inbox
                    </>
                  )}
                </Button>
              )}
              <Button
                onClick={processEmailsWithAI}
                disabled={isProcessing || state.emails.length === 0}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Process
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="space-y-3">{}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search emails..."
                className="pl-10 bg-white/80 border-gray-200"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-white border-gray-200">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 text-gray-800">
                <SelectItem value="all" className="my-1">All Categories</SelectItem>
                <SelectItem value="Work" className="my-1">Work</SelectItem>
                <SelectItem value="Personal" className="my-1">Personal</SelectItem>
                <SelectItem value="Shopping" className="my-1">Shopping</SelectItem>
                <SelectItem value="Social" className="my-1">Social</SelectItem>
                <SelectItem value="Finance" className="my-1">Finance</SelectItem>
                <SelectItem value="Design" className="my-1">Design</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4 space-y-2">
          {filteredEmails.map((email) => (
            <EmailListItem
              key={email.id}
              email={email}
              isSelected={email.id === selectedEmailId}
              onClick={() => setSelectedEmailId(email.id)}
            />
          ))}
          {filteredEmails.length === 0 && state.emails.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <InboxIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Your inbox is empty</h3>
              <p className="mb-4">Click "Load Inbox" to fetch emails from the database</p>
              <Button
                onClick={loadInboxFromDatabase}
                disabled={isLoadingInbox}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                {isLoadingInbox ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </div>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Load Inbox
                  </>
                )}
              </Button>
            </div>
          )}
          {filteredEmails.length === 0 && state.emails.length > 0 && (
            <div className="text-center text-gray-500 py-8">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No emails found matching your search</p>
            </div>
          )}
        </div>
      </div>

      {/* Email Preview - Right Column */}
      <div className="flex-1 flex flex-col">
        {selectedEmail ? (
          <>
            <div className="bg-white/70 backdrop-blur-sm border-b border-white/20 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={`${selectedEmail.categoryColor} text-white`}>
                    {selectedEmail.category || 'Uncategorized'}
                  </Badge>
                  {!selectedEmail.read && (
                    <Badge variant="secondary">Unread</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => generateReplyDraft(selectedEmail)}
                    size="sm"
                    variant="outline"
                  >
                    <Bot className="w-4 h-4 mr-2" />
                    AI Reply
                  </Button>
                  
                  {!selectedEmail.read && (
                    <Button
                      onClick={() => markAsRead(selectedEmail.id)}
                      size="sm"
                      variant="outline"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Read
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => archiveEmail(selectedEmail.id)}
                    size="sm"
                    variant="outline"
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </Button>
                  
                  <Button
                    onClick={() => deleteEmail(selectedEmail.id)}
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <EmailPreview email={selectedEmail} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50/50">
            <div className="text-center text-gray-500">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium mb-2">No email selected</h3>
              <p>Choose an email from the list to view its contents</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
