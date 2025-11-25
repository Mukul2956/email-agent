import { useNavigate } from "react-router";
import { Email } from "../utils/mockData";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { MessageSquare, CheckCircle2 } from "lucide-react";

interface EmailPreviewProps {
  email: Email;
}

export function EmailPreview({ email }: EmailPreviewProps) {
  const navigate = useNavigate();

  return (
    <div className="h-full p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg shadow-gray-200/50 p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white">
                {email.sender.avatar}
              </div>
              <div>
                <h3 className="text-gray-800">{email.sender.name}</h3>
                <p className="text-gray-500">{email.sender.email}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-500">{email.timestamp}</p>
              <Badge
                className={`${email.categoryColor} text-white mt-2 rounded-full`}
              >
                {email.category}
              </Badge>
            </div>
          </div>

          <h2 className="text-gray-800 mb-4">{email.subject}</h2>
        </div>

        {/* Email Body */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg shadow-gray-200/50 p-8 mb-6">
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {email.body}
          </div>
        </div>

        {/* Action Items */}
        {email.actionItems.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl shadow-lg shadow-blue-100/50 p-8 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <h3 className="text-gray-800">Action Items</h3>
            </div>
            <ul className="space-y-3">
              {email.actionItems.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-600 text-xs flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Ask Agent Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => navigate(`/email-agent/${email.id}`)}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl px-8 py-6 shadow-lg shadow-blue-200 transition-all duration-200 hover:shadow-xl"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Ask Agent about this email
          </Button>
        </div>
      </div>
    </div>
  );
}
