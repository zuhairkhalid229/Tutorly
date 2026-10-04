import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Loader2, Presentation } from "lucide-react";
import { toast } from "sonner";
import { dashboardPath, useAuth } from "@/contexts/AuthContext";
import { DEMO_ACCOUNTS } from "@/lib/demo";

/** One-click sign-in to the shared demo accounts. */
export function DemoLogins({ onDone }: { onDone?: () => void }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);

  const signIn = async (email: string) => {
    setBusy(email);
    try {
      const user = await login(email, DEMO_ACCOUNTS.password);
      onDone?.();
      navigate(dashboardPath(user.role));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't sign in to the demo.");
    } finally {
      setBusy(null);
    }
  };

  const options = [
    { email: DEMO_ACCOUNTS.student, icon: GraduationCap, title: "Demo student", body: "Sana: lessons booked, a review to leave" },
    { email: DEMO_ACCOUNTS.tutor, icon: Presentation, title: "Demo tutor", body: "Omar: a request to accept, an AI test to take" },
  ];

  return (
    <div className="grid gap-3">
      {options.map((o) => (
        <button
          key={o.email}
          onClick={() => signIn(o.email)}
          disabled={!!busy}
          className="flex items-center gap-4 rounded-xl border bg-card p-4 text-left transition hover:border-primary/50 hover:shadow-sm disabled:opacity-60"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
            {busy === o.email ? <Loader2 className="h-5 w-5 animate-spin" /> : <o.icon className="h-5 w-5" />}
          </span>
          <span>
            <span className="block font-semibold text-ink">{o.title}</span>
            <span className="block text-sm text-muted-foreground">{o.body}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
