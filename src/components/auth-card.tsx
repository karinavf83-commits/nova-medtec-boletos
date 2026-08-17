import { BrandHeader } from "./brand-header";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <BrandHeader variant="public" />
      <main className="flex justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-md border border-border bg-surface p-8 shadow-sm">
          <h1 className="font-display mb-2 text-2xl font-semibold text-foreground">
            {title}
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">{subtitle}</p>
          {children}
          {footer && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {footer}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
