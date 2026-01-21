import { cn } from "@/lib/utils";
import BackArrowButton from "@/components/BackArrowButton";

export default function KioskChrome({
  title,
  subtitle,
  right,
  children,
  onBack,
  showBack,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  onBack?: () => void;
  showBack?: boolean;
}) {
  return (
    <div className="min-h-screen nexora-surface">
      <header className="mx-auto w-full max-w-6xl px-6 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {showBack && onBack ? (
              <BackArrowButton
                ariaLabel="Go back"
                onBack={onBack}
                className="mt-0.5"
              />
            ) : null}

            <div className="space-y-1">
              <div className="text-sm tracking-[0.28em] uppercase text-muted-foreground">Nexora</div>
              <h1 className="text-2xl font-semibold leading-tight text-foreground">{title}</h1>
              {subtitle ? <p className="max-w-xl text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
          </div>
          <div className={cn("flex items-center gap-3", !right && "hidden")}>{right}</div>
        </div>
        <div className="mt-5 h-px w-full bg-border/80" />
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 pb-10 pt-10">
        <div
          className={cn(
            "rounded-3xl border bg-card/70 text-card-foreground shadow-elevated",
            "backdrop-blur supports-[backdrop-filter]:bg-card/55",
          )}
        >
          <div className="p-6 sm:p-10">{children}</div>
        </div>
      </main>
    </div>
  );
}
