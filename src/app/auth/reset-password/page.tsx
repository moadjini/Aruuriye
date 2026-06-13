"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  password: z.string().min(8),
  confirm_password: z.string(),
}).refine((d) => d.password === d.confirm_password, { message: "Passwords don't match", path: ["confirm_password"] });

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data: { password: string }) => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.updateUser({ password: data.password });
    router.push("/auth/login");
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Set New Password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="New Password" type="password" {...register("password")} error={errors.password?.message as string} />
            <Input label="Confirm Password" type="password" {...register("confirm_password")} error={errors.confirm_password?.message as string} />
            <Button type="submit" className="w-full" loading={loading}>Update Password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
