"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

export function BroadcastPopup() {
  const [broadcast, setBroadcast] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Check for dismissed broadcasts in localStorage
    const dismissedIds = JSON.parse(localStorage.getItem("dismissed_broadcasts") || "[]");

    // Fetch active broadcasts
    const fetchBroadcasts = async () => {
      const { data } = await supabase
        .from("broadcasts")
        .select("*")
        .eq("is_active", true)
        .or("expires_at.is.null,expires_at.gt.now()")
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const latest = data[0];
        if (!dismissedIds.includes(latest.id)) {
          setBroadcast(latest);
        }
      }
    };

    fetchBroadcasts();

    // Subscribe to new broadcasts
    const channel = supabase
      .channel("broadcasts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "broadcasts",
        },
        (payload) => {
          if (payload.new.is_active && !dismissedIds.includes(payload.new.id)) {
            setBroadcast(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDismiss = () => {
    if (broadcast) {
      const dismissedIds = JSON.parse(localStorage.getItem("dismissed_broadcasts") || "[]");
      dismissedIds.push(broadcast.id);
      localStorage.setItem("dismissed_broadcasts", JSON.stringify(dismissedIds));
      setDismissed(true);
    }
  };

  if (!broadcast || dismissed || !broadcast.is_popup) return null;

  const Icon = broadcast.type === "success" ? CheckCircle :
               broadcast.type === "warning" ? AlertTriangle :
               broadcast.type === "error" ? AlertCircle : Info;

  const bgColor = broadcast.type === "success" ? "bg-green-50 border-green-200" :
                  broadcast.type === "warning" ? "bg-yellow-50 border-yellow-200" :
                  broadcast.type === "error" ? "bg-red-50 border-red-200" :
                  "bg-blue-50 border-blue-200";

  const iconColor = broadcast.type === "success" ? "text-green-600" :
                   broadcast.type === "warning" ? "text-yellow-600" :
                   broadcast.type === "error" ? "text-red-600" :
                   "text-blue-600";

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4 rounded-lg border shadow-2xl ${bgColor} animate-fade-in`}>
      <div className="flex items-start gap-3 p-4">
        <Icon className={`h-5 w-5 mt-0.5 ${iconColor} shrink-0`} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-900">{broadcast.title}</h3>
          <p className="text-sm text-gray-700 mt-1">{broadcast.message}</p>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
