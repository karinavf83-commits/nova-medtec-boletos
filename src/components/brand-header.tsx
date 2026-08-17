"use client";

import Link from "next/link";
import { Stethoscope, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useCurrentUser } from "@/lib/use-current-user";

export function BrandHeader({ variant = "public" }: { variant?: "public" | "admin" }) {
  const { user, logout } = useCurrentUser();

  return (
    <header className="flex items-center justify-between gap-4 border-b-[3px] border-accent bg-primary px-6 py-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <Stethoscope size={20} />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="font-display text-xl font-semibold text-primary-foreground">
            Nova Medtec
          </span>
          <span className="text-[0.6875rem] uppercase tracking-wide text-primary-foreground/70">
            Cirúrgica
          </span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        {variant === "admin" && user ? (
          <>
            <span className="text-sm font-medium text-primary-foreground">
              {user.displayName}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={() => logout()}
            >
              <LogOut size={16} />
              Sair
            </Button>
          </>
        ) : (
          <Button asChild variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
            <Link href="/login">Área administrativa</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
