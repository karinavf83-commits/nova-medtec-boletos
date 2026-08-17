import React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
