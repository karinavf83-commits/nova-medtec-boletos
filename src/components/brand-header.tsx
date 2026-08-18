"use client";

import Link from "next/link";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useCurrentUser } from "@/lib/use-current-user";

export function BrandHeader({ variant = "public" }: { variant?: "public" | "admin" }) {
  const { user, logout } = useCurrentUser();

  return (
    <header className="flex items-center justify-between gap-4 border-b-[3px] border-accent bg-primary px-6 py-4">
      <div className="flex items-center gap-3">
        <Image
          src="/nova-medtec-logo.jpg"
          alt="Nova Medtec Cirúrgica"
          width={88}
          height={88}
          className="flex-shrink-0 rounded-md"
          priority
        />
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
