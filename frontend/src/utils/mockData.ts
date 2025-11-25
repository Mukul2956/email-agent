export interface Email {
  id: string;
  sender: {
    name: string;
    email: string;
    avatar: string;
  };
  subject: string;
  body: string;
  timestamp: string;
  category: string;
  categoryColor: string;
  actionItems: string[];
  read: boolean;
  summary?: string;
}

export interface Draft {
  id: string;
  subject: string;
  body: string;
  category: string;
  categoryColor: string;
  timestamp: string;
  to: string;
}

export const mockEmails: Email[] = [
  {
    id: "1",
    sender: {
      name: "Sarah Chen",
      email: "sarah.chen@company.com",
      avatar: "SC",
    },
    subject: "Q4 Marketing Campaign Review",
    body: "Hi team,\n\nI wanted to follow up on our Q4 marketing campaign. Can we schedule a meeting this week to review the performance metrics? I've attached the preliminary data.\n\nPlease let me know your availability for Tuesday or Wednesday afternoon.\n\nBest regards,\nSarah",
    timestamp: "2 hours ago",
    category: "Work",
    categoryColor: "bg-blue-500",
    actionItems: [
      "Schedule meeting for Tuesday or Wednesday afternoon",
      "Review Q4 marketing performance metrics",
      "Check attached preliminary data",
    ],
    read: false,
  },
  {
    id: "2",
    sender: {
      name: "Amazon",
      email: "no-reply@amazon.com",
      avatar: "A",
    },
    subject: "Your order has been shipped",
    body: "Hello,\n\nGood news! Your order #12345-67890 has been shipped and is on its way to you.\n\nTracking number: 1Z999AA10123456784\nEstimated delivery: November 26, 2025\n\nYou can track your package at any time.\n\nThank you for shopping with Amazon.",
    timestamp: "5 hours ago",
    category: "Shopping",
    categoryColor: "bg-purple-500",
    actionItems: ["Track package with tracking number 1Z999AA10123456784"],
    read: false,
  },
  {
    id: "3",
    sender: {
      name: "Michael Torres",
      email: "m.torres@techcorp.io",
      avatar: "MT",
    },
    subject: "Project Alpha - Code Review Needed",
    body: "Hey,\n\nI've just pushed the new authentication module to the dev branch. Would appreciate if you could review the PR before EOD.\n\nThe main changes include:\n- OAuth2 integration\n- Token refresh mechanism\n- User session management\n\nLet me know if you have any questions.\n\nCheers,\nMichael",
    timestamp: "1 day ago",
    category: "Work",
    categoryColor: "bg-blue-500",
    actionItems: [
      "Review PR for authentication module before EOD",
      "Check OAuth2 integration implementation",
      "Verify token refresh mechanism",
    ],
    read: true,
  },
  {
    id: "4",
    sender: {
      name: "Emma Wilson",
      email: "emma.w@design.studio",
      avatar: "EW",
    },
    subject: "Design System Updates - V2.0",
    body: "Hi everyone,\n\nWe've finalized the design system V2.0! The new component library includes updated color palettes, typography scales, and spacing tokens.\n\nPlease review the Figma file and let me know if you have any feedback by Friday.\n\nLink: [Design System V2.0]\n\nThanks!\nEmma",
    timestamp: "2 days ago",
    category: "Design",
    categoryColor: "bg-pink-500",
    actionItems: [
      "Review Figma file for Design System V2.0",
      "Provide feedback by Friday",
    ],
    read: true,
  },
  {
    id: "5",
    sender: {
      name: "LinkedIn",
      email: "notifications@linkedin.com",
      avatar: "L",
    },
    subject: "You appeared in 15 searches this week",
    body: "Your profile is getting noticed!\n\nYou appeared in 15 searches this week. People are looking for professionals with your skills and experience.\n\nUpgrade to Premium to see who's viewing your profile and unlock additional insights.\n\nBest,\nThe LinkedIn Team",
    timestamp: "3 days ago",
    category: "Social",
    categoryColor: "bg-green-500",
    actionItems: [],
    read: true,
  },
];

export const mockDrafts: Draft[] = [
  {
    id: "d1",
    subject: "Re: Q4 Marketing Campaign Review",
    body: "Hi Sarah,\n\nThanks for reaching out. I'm available on Wednesday afternoon, 2-4 PM works best for me. I'll review the preliminary data before our meeting.\n\nLooking forward to discussing the campaign performance.\n\nBest,",
    category: "Work",
    categoryColor: "bg-blue-500",
    timestamp: "1 hour ago",
  },
  {
    id: "d2",
    subject: "Re: Project Alpha - Code Review Needed",
    body: "Hey Michael,\n\nI've reviewed the PR and left some comments on the OAuth2 implementation. Overall looks solid, but I have a few suggestions regarding error handling in the token refresh mechanism.\n\nLet's sync up tomorrow to discuss.\n\nThanks,",
    category: "Work",
    categoryColor: "bg-blue-500",
    timestamp: "1 day ago",
  },
  {
    id: "d3",
    subject: "Design Feedback - System V2.0",
    body: "Hi Emma,\n\nThe new design system looks fantastic! The updated color palette is much more accessible. I have a few minor suggestions about the spacing tokens that I'll add to the Figma comments.\n\nGreat work on this!\n\nBest,",
    category: "Design",
    categoryColor: "bg-pink-500",
    timestamp: "2 days ago",
  },
  {
    id: "d4",
    subject: "Meeting Request - Product Roadmap Discussion",
    body: "Hi team,\n\nI'd like to schedule a meeting to discuss our product roadmap for 2026. We should align on priorities and resource allocation.\n\nProposed agenda:\n1. Review 2025 achievements\n2. Discuss 2026 priorities\n3. Resource planning\n4. Q1 milestones\n\nPlease let me know your availability for next week.\n\nThanks,",
    category: "Work",
    categoryColor: "bg-blue-500",
    timestamp: "3 days ago",
  },
];

export const defaultPrompts = {
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
};
