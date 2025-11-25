import { useApp } from "../utils/appStore";
import { DraftCard } from "../components/DraftCard";
import { FileText } from "lucide-react";

export function Drafts() {
  const { state } = useApp();
  const drafts = state.drafts;

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-gray-800">Drafts</h1>
          </div>
          <p className="text-gray-600">
            {drafts.length} saved draft{drafts.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Drafts Grid */}
        {drafts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {drafts.map((draft) => (
              <DraftCard key={draft.id} draft={draft} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No drafts yet</h3>
            <p className="text-gray-600">Use the AI Reply button in your inbox to create drafts</p>
          </div>
        )}
      </div>
    </div>
  );
}
