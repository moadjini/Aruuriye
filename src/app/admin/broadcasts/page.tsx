"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { createBroadcastAction, deleteBroadcastAction } from "@/app/actions/platform";
import { formatDate } from "@/lib/utils";
import { Trash2, Send } from "lucide-react";

export default function AdminBroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [isPopup, setIsPopup] = useState(false);
  const [popupDuration, setPopupDuration] = useState("5");
  const [targetAudience, setTargetAudience] = useState("all");

  const loadBroadcasts = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("broadcasts")
      .select("*")
      .order("created_at", { ascending: false });
    setBroadcasts(data || []);
  };

  useEffect(() => { loadBroadcasts(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const result = await createBroadcastAction({
      title,
      message,
      type,
      is_popup: isPopup,
      popup_duration: Number(popupDuration),
      target_audience: targetAudience,
      created_by: user.id,
    });

    if (result.error) {
      alert("Failed to create broadcast: " + result.error);
    } else {
      alert("Broadcast created successfully!");
      setTitle("");
      setMessage("");
      setIsPopup(false);
      setPopupDuration("5");
      setShowForm(false);
      loadBroadcasts();
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this broadcast?")) return;

    const result = await deleteBroadcastAction(id);
    if (result.error) {
      alert("Failed to delete broadcast: " + result.error);
    } else {
      loadBroadcasts();
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text">Broadcasts & Announcements</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Send className="mr-2 h-4 w-4" />
          Create Broadcast
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Create New Broadcast</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
            <Input
              label="Title"
              placeholder="Broadcast title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div>
              <label className="block text-sm font-medium mb-1.5">Message</label>
              <textarea
                className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20"
                rows={4}
                placeholder="Broadcast message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
            <Select
              label="Type"
              options={[
                { value: "info", label: "Info" },
                { value: "success", label: "Success" },
                { value: "warning", label: "Warning" },
                { value: "error", label: "Error" },
              ]}
              value={type}
              onChange={(e) => setType(e.target.value)}
            />
            <Select
              label="Target Audience"
              options={[
                { value: "all", label: "All Users" },
                { value: "fundraisers", label: "Fundraisers Only" },
                { value: "donors", label: "Donors Only" },
              ]}
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPopup"
                checked={isPopup}
                onChange={(e) => setIsPopup(e.target.checked)}
                className="rounded border-gray-300 text-secondary focus:ring-secondary"
              />
              <label htmlFor="isPopup" className="text-sm">Show as popup</label>
            </div>
            {isPopup && (
              <Input
                label="Popup Duration (seconds)"
                type="number"
                value={popupDuration}
                onChange={(e) => setPopupDuration(e.target.value)}
                min="1"
                max="60"
              />
            )}
            <div className="flex gap-3">
              <Button type="submit" loading={loading}>Send Broadcast</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {broadcasts.map((broadcast) => (
          <Card key={broadcast.id} className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={
                    broadcast.type === "success" ? "bg-green-100 text-green-700" :
                    broadcast.type === "warning" ? "bg-yellow-100 text-yellow-700" :
                    broadcast.type === "error" ? "bg-red-100 text-red-700" :
                    "bg-blue-100 text-blue-700"
                  }>{broadcast.type}</Badge>
                  {broadcast.is_popup && <Badge className="bg-purple-100 text-purple-700">Popup ({broadcast.popup_duration}s)</Badge>}
                  {broadcast.target_audience !== "all" && <Badge className="bg-gray-100 text-gray-700">{broadcast.target_audience}</Badge>}
                  {!broadcast.is_active && <Badge className="bg-gray-200 text-gray-600">Inactive</Badge>}
                </div>
                <h3 className="font-semibold text-text">{broadcast.title}</h3>
                <p className="text-sm text-text-muted mt-1">{broadcast.message}</p>
                <p className="text-xs text-text-muted mt-2">{formatDate(broadcast.created_at)}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(broadcast.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
        {broadcasts.length === 0 && <p className="text-center py-12 text-text-muted">No broadcasts yet</p>}
      </div>
    </div>
  );
}
