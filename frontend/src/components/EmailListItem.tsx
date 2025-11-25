import { Email } from "../utils/mockData";
import { Badge } from "./ui/badge";

interface EmailListItemProps {
  email: Email;
  isSelected: boolean;
  onClick: () => void;
}

export function EmailListItem({ email, isSelected, onClick }: EmailListItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl transition-all duration-200 ${
        isSelected
          ? "bg-white shadow-lg shadow-blue-100 border-2 border-blue-200"
          : "bg-white/60 hover:bg-white hover:shadow-md"
      } ${!email.read ? "border-l-4 border-l-blue-500" : ""}`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white flex-shrink-0">
          {email.sender.avatar}
        </div>

        {/* Email Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className={`text-gray-800 truncate ${!email.read ? "" : ""}`}>
              {email.sender.name}
            </p>
            <span className="text-gray-400 text-xs flex-shrink-0">
              {email.timestamp}
            </span>
          </div>

          <p className={`text-gray-700 truncate mb-2 ${!email.read ? "" : ""}`}>
            {email.subject}
          </p>

          <Badge
            variant="secondary"
            className={`${email.categoryColor} text-white text-xs rounded-full`}
          >
            {email.category}
          </Badge>
        </div>
      </div>
    </button>
  );
}
