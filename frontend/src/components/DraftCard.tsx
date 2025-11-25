import { useState } from "react";
import { Draft } from "../utils/mockData";
import { useApp } from "../utils/appStore";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Edit, Clock, Save, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface DraftCardProps {
  draft: Draft;
}

export function DraftCard({ draft }: DraftCardProps) {
  const { dispatch } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState(draft.subject);
  const [editedBody, setEditedBody] = useState(draft.body);

  const handleSave = () => {
    dispatch({
      type: 'UPDATE_DRAFT',
      payload: {
        id: draft.id,
        updates: {
          subject: editedSubject,
          body: editedBody,
          timestamp: new Date().toLocaleString(),
        },
      },
    });
    setIsEditing(false);
    toast.success("Draft saved successfully!");
  };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_DRAFT', payload: draft.id });
    toast.success("Draft deleted");
  };

  const handleCancel = () => {
    setEditedSubject(draft.subject);
    setEditedBody(draft.body);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg shadow-gray-200/50 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <Badge className={`${draft.categoryColor} text-white rounded-full`}>
            {draft.category}
          </Badge>
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <Clock className="w-3 h-3" />
            <span>{draft.timestamp}</span>
          </div>
        </div>

        {/* Edit Mode */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">To</label>
            <Input value={draft.to} disabled className="bg-gray-50" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Subject</label>
            <Input
              value={editedSubject}
              onChange={(e) => setEditedSubject(e.target.value)}
              className="bg-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Body</label>
            <Textarea
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              rows={10}
              className="bg-white resize-none"
            />
          </div>
        </div>

        {/* Edit Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl shadow-md"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
          <Button
            onClick={handleCancel}
            variant="outline"
            className="rounded-2xl"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg shadow-gray-200/50 p-6 hover:shadow-xl hover:shadow-gray-300/50 transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <Badge className={`${draft.categoryColor} text-white rounded-full`}>
          {draft.category}
        </Badge>
        <div className="flex items-center gap-1 text-gray-400 text-xs">
          <Clock className="w-3 h-3" />
          <span>{draft.timestamp}</span>
        </div>
      </div>

      {/* To */}
      <div className="text-xs text-gray-500 mb-1">To: {draft.to}</div>

      {/* Subject */}
      <h3 className="text-gray-800 mb-3">{draft.subject}</h3>

      {/* Body Preview */}
      <p className="text-gray-600 text-sm line-clamp-4 mb-6 leading-relaxed">
        {draft.body}
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={() => setIsEditing(true)}
          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl shadow-md"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Draft
        </Button>
        <Button
          onClick={handleDelete}
          variant="outline"
          className="rounded-2xl text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
