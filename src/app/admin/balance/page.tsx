"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { adjustUserBalanceAction } from "@/app/actions/platform";

export default function AdminBalancePage() {
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [selectedUser, setSelectedUser] = useState<Record<string, unknown> | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadUsers = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading users:", error);
      alert("Failed to load users");
      return;
    }

    setUsers(data || []);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("userId", selectedUser.id as string);
    formData.append("amount", amount);
    formData.append("reason", reason);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in");
      setLoading(false);
      return;
    }

    formData.append("adminId", user.id);

    const result = await adjustUserBalanceAction(formData);

    if (result.error) {
      setError(result.error);
    } else {
      alert("Balance adjusted successfully!");
      setAmount("");
      setReason("");
      setSelectedUser(null);
    }

    setLoading(false);
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-text mb-6">Adjust User Balances</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Selection */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Select User</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.map((user) => (
              <button
                key={user.id as string}
                onClick={() => setSelectedUser(user)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedUser?.id === user.id
                    ? "border-secondary bg-secondary-light/50"
                    : "border-gray-200 hover:border-secondary hover:bg-secondary-light/40"
                }`}
              >
                <p className="font-medium">{user.full_name as string}</p>
                <p className="text-sm text-text-muted">{user.email as string}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Balance Adjustment Form */}
        {selectedUser && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Adjust Balance</h2>
            <p className="text-sm text-text-muted mb-4">
              Selected: <strong>{selectedUser.full_name as string}</strong>
            </p>
            <form onSubmit={handleAdjustBalance} className="space-y-4">
              <Input
                label="Amount"
                type="number"
                step="0.01"
                placeholder="Enter amount (positive to increase, negative to decrease)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <Input
                label="Reason"
                placeholder="Reason for adjustment"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
              {error && <p className="text-sm text-red-600 rounded-lg bg-red-50 p-3">{error}</p>}
              <Button type="submit" className="w-full" loading={loading}>
                Adjust Balance
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setSelectedUser(null)}
              >
                Cancel
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
