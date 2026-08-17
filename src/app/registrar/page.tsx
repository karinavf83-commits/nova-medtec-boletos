"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, displayName, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha no cadastro");
      router.push("/painel");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no cadastro");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCard
      title="Criar conta de administradora"
      subtitle="Restrito aos e-mails autorizados da Nova Medtec (Karina Vieira e Renata Maciel)."
      footer={
        <>
          Já tem uma conta?{" "}
          <Link href="/login" className="font-medium text-accent">
            Entrar
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
          <label className="text-sm font-medium text-foreground">Nome</label>
          <Input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Senha</label>
          <Input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="text-xs text-muted-foreground">
            Mínimo de 8 caracteres.
          </span>
        </div>
        <Button type="submit" disabled={isLoading} className="mt-2">
          {isLoading ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>
    </AuthCard>
  );
}
