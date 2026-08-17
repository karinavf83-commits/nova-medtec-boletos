import React from "react";
import { cn } from "@/lib/utils";

type Variant = "warning" | "info" | "success" | "outline";

const variantClasses: Record<Variant, string> = {
  warning: "bg-warning-bg text-warning border-warning/20",
  info: "bg-info-bg text-info border-info/20",
  success: "bg-success-bg text-success border-success/20",
  outline: "bg-transparent text-foreground border-border",
};

export function Badge({
  variant = "outline",
  className,
  children,
}: {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
