"use client";
import { useRouter } from "next/navigation";
import { AuthView } from "@/components/auth-view";
import { useAuth } from "@/lib/auth-context";
import { useEffect } from "react";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  return <AuthView initialMode="login" onSuccess={() => router.push("/")} />;
}
