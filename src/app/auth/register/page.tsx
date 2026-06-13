"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { APP_NAME } from "@/lib/constants";
import { registerUserAction } from "@/app/actions/auth";
import { GoogleSignInButton } from "@/components/ui/google-button";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    setError("");

    // 1. Call server action to create confirmed visitor user (no rate limit/SMTP limit)
    const res = await registerUserAction(data);

    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    // 2. Log in immediately since email is auto-confirmed!
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/campaigns");
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=/campaigns`,
      },
    });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold text-center text-text">Join {APP_NAME}</h1>
      <p className="mt-1 text-center text-sm text-text-muted">Create your account</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <Input label="Full Name" {...register("full_name")} error={errors.full_name?.message} />
        <Input label="Email" type="email" {...register("email")} error={errors.email?.message} />
        <Input label="Phone" {...register("phone_number")} error={errors.phone_number?.message} />
        <Input label="City" {...register("city")} error={errors.city?.message} />
        <Input label="Password" type="password" {...register("password")} error={errors.password?.message} />
        <Input label="Confirm Password" type="password" {...register("confirm_password")} error={errors.confirm_password?.message} />
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Create Account
        </Button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
        <div className="relative flex justify-center text-sm"><span className="bg-white px-2 text-text-muted font-medium">or</span></div>
      </div>

      <GoogleSignInButton onClick={handleGoogleLogin} loading={loading} />

      <p className="mt-6 text-center text-sm text-text-muted">
        Have an account?{" "}
        <Link href="/auth/login" className="font-medium text-secondary hover:underline">Sign in</Link>
      </p>
    </div>
  );
}

