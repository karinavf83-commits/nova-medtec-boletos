"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha no login");
      router.push("/painel");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Painel administrativo"
      subtitle="Acesso restrito às administradoras da Nova Medtec."
      footer={
        <>
          Primeiro acesso?{" "}
          <Link href="/registrar" className="font-medium text-accent">
            Criar minha conta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-md border border-error/20 bg-error-bg px-3 py-2 text-sm text-error">
            {error}
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">E-mail</label>
          <Input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Senha</label>
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={isLoading} className="mt-2">
          {isLoading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </AuthCard>
  );
}
