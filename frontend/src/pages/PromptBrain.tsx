import { useState, useEffect } from "react";
import { useApp } from "../utils/appStore";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Save, Sparkles, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const defaultPrompts = {
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

export function PromptBrain() {
  const { state, dispatch } = useApp();
  const [prompts, setPrompts] = useState(state.prompts);

  useEffect(() => {
    setPrompts(state.prompts);
  }, [state.prompts]);

  const handleSave = (promptType: keyof typeof state.prompts) => {
    dispatch({ type: 'UPDATE_PROMPTS', payload: { [promptType]: prompts[promptType] } });
    toast.success(`${promptType.charAt(0).toUpperCase() + promptType.slice(1).replace(/([A-Z])/g, ' $1')} prompt saved successfully!`);
  };

  const handleReset = (promptType: keyof typeof state.prompts) => {
    const resetValue = defaultPrompts[promptType];
    setPrompts((prev) => ({ ...prev, [promptType]: resetValue }));
    dispatch({ type: 'UPDATE_PROMPTS', payload: { [promptType]: resetValue } });
    toast.info(`${promptType.charAt(0).toUpperCase() + promptType.slice(1).replace(/([A-Z])/g, ' $1')} prompt reset to default`);
  };

  const updatePrompt = (
    key: keyof typeof state.prompts,
    value: string
  ) => {
    setPrompts((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-gray-800">Prompt Brain</h1>
          </div>
          <p className="text-gray-600">
            Configure how your AI agent processes and responds to emails
          </p>
        </div>

        {/* Categorization Prompt */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg shadow-gray-200/50 p-8 mb-6">
          <div className="mb-4">
            <h3 className="text-gray-800 mb-2">Categorization Prompt</h3>
            <p className="text-gray-500">
              Define how emails should be automatically categorized
            </p>
          </div>
          <Textarea
            value={prompts.categorization}
            onChange={(e) => updatePrompt("categorization", e.target.value)}
            rows={8}
            className="font-mono text-xs bg-gray-50 border-gray-200 rounded-2xl mb-4 resize-none"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => handleSave("categorization")}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl shadow-md"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Prompt
            </Button>
            <Button
              onClick={() => handleReset("categorization")}
              variant="outline"
              className="rounded-2xl"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
          </div>
        </div>

        {/* Action Items Prompt */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg shadow-gray-200/50 p-8 mb-6">
          <div className="mb-4">
            <h3 className="text-gray-800 mb-2">Action-Item Prompt</h3>
            <p className="text-gray-500">
              Configure how action items are extracted from emails
            </p>
          </div>
          <Textarea
            value={prompts.actionItems}
            onChange={(e) => updatePrompt("actionItems", e.target.value)}
            rows={10}
            className="font-mono text-xs bg-gray-50 border-gray-200 rounded-2xl mb-4 resize-none"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => handleSave("actionItems")}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl shadow-md"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Prompt
            </Button>
            <Button
              onClick={() => handleReset("actionItems")}
              variant="outline"
              className="rounded-2xl"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
          </div>
        </div>

        {/* Auto-Reply Prompt */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg shadow-gray-200/50 p-8 mb-6">
          <div className="mb-4">
            <h3 className="text-gray-800 mb-2">Auto-Reply Draft Prompt</h3>
            <p className="text-gray-500">
              Set guidelines for generating email reply drafts
            </p>
          </div>
          <Textarea
            value={prompts.autoReply}
            onChange={(e) => updatePrompt("autoReply", e.target.value)}
            rows={10}
            className="font-mono text-xs bg-gray-50 border-gray-200 rounded-2xl mb-4 resize-none"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => handleSave("autoReply")}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl shadow-md"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Prompt
            </Button>
            <Button
              onClick={() => handleReset("autoReply")}
              variant="outline"
              className="rounded-2xl"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
