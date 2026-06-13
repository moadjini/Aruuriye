"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { commentSchema } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { Comment } from "@/types/database";

interface CommentSectionProps {
  campaignId: string;
  comments: (Comment & { profiles?: { full_name: string | null } })[];
}

export function CommentSection({ campaignId, comments }: CommentSectionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(commentSchema),
  });

  const onSubmit = async (data: { content: string }) => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    await supabase.from("comments").insert({
      campaign_id: campaignId,
      user_id: user.id,
      content: data.content,
    });

    reset();
    setLoading(false);
    router.refresh();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold">Comments ({comments.length})</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
        <Textarea placeholder="Leave a comment..." {...register("content")} error={errors.content?.message as string} />
        <Button type="submit" size="sm" loading={loading}>Post Comment</Button>
      </form>
      <div className="mt-6 space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{comment.profiles?.full_name || "User"}</span>
              <span className="text-xs text-text-muted">{formatDate(comment.created_at)}</span>
            </div>
            <p className="mt-2 text-sm text-text-muted">{comment.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
