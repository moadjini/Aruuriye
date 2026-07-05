"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { Bell, Check, CheckCheck, Send } from "lucide-react";
import { sendNotification } from "@/app/actions/platform";

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSendForm, setShowSendForm] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setNotifications(data || []);
      setLoading(false);
    };

    const fetchUsers = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("created_at", { ascending: false });
      setUsers(data || []);
    };

    fetchNotifications();
    fetchUsers();

    // Real-time subscription for new notifications
    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async (id: string) => {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
  };

  const markAllAsRead = async () => {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .is("is_read", false);
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !title || !message) return;

    setSending(true);
    const result = await sendNotification(selectedUser, title, message, type, link || undefined);

    if (result.error) {
      alert("Failed to send notification: " + result.error);
    } else {
      alert("Notification sent successfully!");
      setTitle("");
      setMessage("");
      setLink("");
      setSelectedUser("");
      setShowSendForm(false);
    }

    setSending(false);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">Admin Notifications</h1>
        <div className="flex gap-3">
          <Button onClick={() => setShowSendForm(!showSendForm)}>
            <Send className="mr-2 h-4 w-4" />
            Send Notification
          </Button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 text-sm font-semibold text-secondary hover:text-secondary-dark transition-colors"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {showSendForm && (
        <Card className="mt-6 p-6">
          <h2 className="text-lg font-semibold mb-4">Send Notification</h2>
          <form onSubmit={handleSendNotification} className="space-y-4 max-w-2xl">
            <Select
              label="Select User"
              options={[{ value: "", label: "Select a user" }, ...users.map((u) => ({ value: u.id, label: `${u.full_name} (${u.email})` }))]}
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            />
            <Input
              label="Title"
              placeholder="Notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <div>
              <label className="block text-sm font-medium mb-1.5">Message</label>
              <textarea
                className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20"
                rows={4}
                placeholder="Notification message"
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
            <Input
              label="Link (optional)"
              placeholder="https://example.com"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <div className="flex gap-3">
              <Button type="submit" loading={sending}>Send</Button>
              <Button type="button" variant="outline" onClick={() => setShowSendForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}
      
      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {notifications.map((n, index) => (
            <div key={n.id} style={{ animationDelay: `${index * 0.05}s` } as React.CSSProperties}>
              <Card
                className={`transition-all duration-300 hover:shadow-premium-hover animate-slide-in-right ${!n.is_read ? "border-secondary/30 bg-secondary-light/20" : ""}`}
              >
                <div className="flex items-start gap-3 p-4">
                  <div className={`rounded-full p-2 ${!n.is_read ? "bg-secondary/10" : "bg-gray-100"}`}>
                    <Bell className={`h-4 w-4 ${!n.is_read ? "text-secondary" : "text-gray-400"}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${!n.is_read ? "text-text" : "text-text-muted"}`}>{n.title}</p>
                    <p className="text-sm text-text-muted mt-1">{n.message}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <p className="text-xs text-text-muted">{formatDate(n.created_at)}</p>
                      {!n.is_read && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="flex items-center gap-1 text-xs font-semibold text-secondary hover:text-secondary-dark transition-colors"
                        >
                          <Check className="h-3 w-3" />
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-text-muted">No notifications yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
