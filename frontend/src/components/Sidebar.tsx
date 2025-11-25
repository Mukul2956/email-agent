import { NavLink } from "react-router";
import { Inbox, Brain, MessageSquare, FileText, Settings } from "lucide-react";

const navItems = [
  { to: "/", icon: Inbox, label: "Inbox" },
  { to: "/prompt-brain", icon: Brain, label: "Prompt Brain" },
  { to: "/email-agent", icon: MessageSquare, label: "Email Agent" },
  { to: "/drafts", icon: FileText, label: "Drafts" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-white/70 backdrop-blur-xl border-r border-white/20 shadow-lg flex flex-col p-6">
      <div className="mb-8">
        <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
          Email Agent
        </h1>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-200"
                  : "text-gray-600 hover:bg-white/80 hover:shadow-md"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-gray-200">
        <div className="flex items-center gap-3 px-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white">
            AI
          </div>
          <div>
            <p className="text-gray-700">AI Agent</p>
            <p className="text-gray-500 text-xs">Active</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
