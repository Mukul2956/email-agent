-- Email Productivity Agent Database Schema
-- PostgreSQL Database Schema

-- Create database (run this manually)
-- CREATE DATABASE email_productivity_agent;

-- Use the database
-- \c email_productivity_agent;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Emails table - stores all email data
CREATE TABLE emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender TEXT NOT NULL,
    receiver TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT DEFAULT NULL,
    action_items JSONB DEFAULT '[]'::jsonb,
    received_at TIMESTAMP WITH TIME ZONE NOT NULL,
    processed BOOLEAN DEFAULT false,
    starred BOOLEAN DEFAULT false,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prompts table - stores AI prompts
CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT UNIQUE NOT NULL, -- 'categorization', 'action_items', 'auto_reply'
    title TEXT NOT NULL,
    prompt_body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drafts table - stores email drafts
CREATE TABLE drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
    draft_body TEXT NOT NULL,
    subject TEXT,
    recipient TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat history table - stores AI conversation history
CREATE TABLE chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    message TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_emails_category ON emails(category);
CREATE INDEX idx_emails_processed ON emails(processed);
CREATE INDEX idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX idx_emails_sender ON emails(sender);
CREATE INDEX idx_prompts_type ON prompts(type);
CREATE INDEX idx_drafts_email_id ON drafts(email_id);
CREATE INDEX idx_chat_history_email_id ON chat_history(email_id);
CREATE INDEX idx_chat_history_timestamp ON chat_history(timestamp DESC);

-- Insert default prompts
INSERT INTO prompts (type, title, prompt_body) VALUES 
(
    'categorization',
    'Email Categorization',
    'Analyze the email content and sender information to categorize it into one of the following categories:
- Work: Professional emails, meetings, projects, tasks
- Personal: Friends, family, personal matters
- Shopping: Orders, receipts, shipping notifications
- Social: Social media, newsletters, community updates
- Finance: Banking, invoices, payments
- Design: Design-related discussions, feedback, assets
- Newsletter: Newsletters, updates, announcements

Return only the category name.'
),
(
    'action_items',
    'Action Items Extraction',
    'Extract actionable items from the email that require a response or action from the recipient.

For each action item:
1. Be specific and concise
2. Include deadlines if mentioned
3. Focus on what needs to be done
4. Ignore marketing or informational content

Return a JSON array of action items, or an empty array if none exist.'
),
(
    'auto_reply',
    'Auto Reply Generation',
    'Generate a professional and contextually appropriate email reply based on the original email content.

Guidelines:
1. Match the tone of the original email (formal/casual)
2. Address all questions or requests mentioned
3. Be concise but complete
4. Include appropriate greeting and closing
5. Leave placeholders [DETAILS] where specific information is needed

Generate a draft reply that can be edited before sending.'
);