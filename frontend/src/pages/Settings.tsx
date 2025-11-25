import { useState } from "react";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";
import { Settings as SettingsIcon, Bell, Shield, Zap } from "lucide-react";
import { toast } from "sonner@2.0.3";

export function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [autoReply, setAutoReply] = useState(false);
  const [smartCategories, setSmartCategories] = useState(true);

  const handleSave = () => {
    toast.success("Settings saved successfully!");
  };

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-gray-800">Settings</h1>
          </div>
          <p className="text-gray-600">Manage your email agent preferences</p>
        </div>

        {/* Notifications */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg shadow-gray-200/50 p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-blue-600" />
            <h3 className="text-gray-800">Notifications</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="text-gray-700">
                Enable email notifications
              </Label>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </div>
        </div>

        {/* AI Features */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg shadow-gray-200/50 p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-5 h-5 text-purple-600" />
            <h3 className="text-gray-800">AI Features</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-reply" className="text-gray-700">
                  Auto-reply suggestions
                </Label>
                <p className="text-gray-500 text-xs mt-1">
                  Get AI-generated reply drafts for incoming emails
                </p>
              </div>
              <Switch
                id="auto-reply"
                checked={autoReply}
                onCheckedChange={setAutoReply}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="smart-categories" className="text-gray-700">
                  Smart categorization
                </Label>
                <p className="text-gray-500 text-xs mt-1">
                  Automatically categorize incoming emails
                </p>
              </div>
              <Switch
                id="smart-categories"
                checked={smartCategories}
                onCheckedChange={setSmartCategories}
              />
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-lg shadow-gray-200/50 p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-green-600" />
            <h3 className="text-gray-800">Privacy & Security</h3>
          </div>

          <div className="space-y-3 text-gray-700">
            <p>
              Your emails are processed locally and securely. We use industry-standard
              encryption to protect your data.
            </p>
            <Button variant="outline" className="rounded-2xl">
              Review Privacy Policy
            </Button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl px-8 shadow-md"
          >
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
