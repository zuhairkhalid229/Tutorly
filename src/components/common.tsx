import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Loader2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import { errorMessage } from "@/lib/supabase";
import type { BookingStatus } from "@/types/database";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link to="/" className={cn("inline-flex items-center gap-2 font-extrabold tracking-tight", className)}>
      <svg viewBox="0 0 64 64" className="h-7 w-7" aria-hidden>
        <rect width="64" height="64" rx="16" fill={light ? "#fff" : "hsl(var(--primary))"} />
        <path d="M18 22h28v7H35.5v19h-7V29H18z" fill={light ? "hsl(var(--primary))" : "#fff"} />
        <circle cx="46" cy="44" r="6" fill="hsl(var(--highlight))" />
      </svg>
      <span className={cn("text-lg", light ? "text-white" : "text-ink")}>Tutorly</span>
    </Link>
  );
}

// Deterministic soft colours so each person keeps the same avatar.
const AVATAR_TONES = [
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-800",
  "bg-sky-100 text-sky-800",
  "bg-rose-100 text-rose-800",
  "bg-violet-100 text-violet-800",
  "bg-teal-100 text-teal-800",
];

export function PersonAvatar({
  name,
  src,
  className,
}: {
  name: string | null | undefined;
  src?: string | null;
  className?: string;
}) {
  const tone = AVATAR_TONES[[...(name ?? "")].reduce((n, c) => n + c.charCodeAt(0), 0) % AVATAR_TONES.length];
  return src ? (
    <img src={src} alt="" className={cn("h-10 w-10 shrink-0 rounded-full object-cover", className)} />
  ) : (
    <div
      aria-hidden
      className={cn("flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full font-bold", tone, className)}
    >
      {initials(name)}
    </div>
  );
}

export function Stars({ rating, count, className }: { rating: number | null; count?: number; className?: string }) {
  if (rating == null) {
    return <span className={cn("text-sm text-muted-foreground", className)}>New tutor</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", className)}>
      <Star className="h-4 w-4 fill-highlight text-highlight" aria-hidden />
      <span className="font-semibold">{Number(rating).toFixed(1)}</span>
      {count != null && <span className="text-muted-foreground">({count})</span>}
      <span className="sr-only">out of 5</span>
    </span>
  );
}

export function SubjectChip({ subject, verified = true }: { subject: string; verified?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
      {verified && <BadgeCheck className="h-3.5 w-3.5" aria-hidden />}
      {subject}
    </span>
  );
}

const STATUS: Record<BookingStatus | "expired", { label: string; className: string }> = {
  pending: { label: "Awaiting tutor", className: "bg-amber-100 text-amber-900" },
  confirmed: { label: "Confirmed", className: "bg-emerald-100 text-emerald-900" },
  completed: { label: "Completed", className: "bg-slate-100 text-slate-700" },
  cancelled: { label: "Cancelled", className: "bg-rose-50 text-rose-700" },
  declined: { label: "Declined", className: "bg-rose-50 text-rose-700" },
  expired: { label: "Expired", className: "bg-slate-100 text-slate-500" },
};

export function StatusBadge({ status, start }: { status: BookingStatus; start?: string }) {
  const key = status === "pending" && start && new Date(start) <= new Date() ? "expired" : status;
  const s = STATUS[key];
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", s.className)}>{s.label}</span>;
}

export function PageHeader({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card/50 px-6 py-12 text-center">
      {icon && <div className="mb-3 rounded-full bg-secondary p-3 text-primary">{icon}</div>}
      <h3 className="font-semibold text-ink">{title}</h3>
      {children && <div className="mt-1 max-w-md text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function Loading({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2 py-16 text-muted-foreground", className)} role="status">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function ErrorNotice({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = errorMessage(error);
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900" role="alert">
      {message}
      {onRetry && (
        <button onClick={onRetry} className="ml-2 font-semibold underline underline-offset-2">
          Try again
        </button>
      )}
    </div>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="surface p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold text-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
