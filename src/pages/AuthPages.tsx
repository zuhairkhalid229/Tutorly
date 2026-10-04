import { useState, type FormEvent, type ReactNode } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { BadgeCheck, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/common";
import { DemoLogins } from "@/components/DemoLogins";
import { dashboardPath, useAuth } from "@/contexts/AuthContext";
import { errorMessage } from "@/lib/supabase";

function AuthShell({ title, subtitle, children, aside }: { title: string; subtitle: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-2xl font-bold text-ink">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <div className="dot-grid hidden border-l bg-muted/50 lg:flex lg:items-center lg:justify-center lg:p-12">{aside}</div>
    </div>
  );
}

function Field({ id, label, hint, ...props }: { id: string; label: string; hint?: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} {...props} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function FormError({ error }: { error: string | null }) {
  return error ? (
    <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
      {error}
    </p>
  ) : null;
}

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to={next || dashboardPath(user.role)} replace />;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const u = await login(String(form.get("email")), String(form.get("password")));
      navigate(next || dashboardPath(u.role), { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle={<>New here? <Link to="/register/student" className="font-semibold text-primary">Create an account</Link></>}
      aside={
        <div className="w-full max-w-sm">
          <p className="eyebrow">No account needed</p>
          <h2 className="mt-2 text-2xl font-bold text-ink">Try the demo</h2>
          <p className="mb-6 mt-2 text-sm text-muted-foreground">
            Shared accounts with lessons, messages and reviews already set up. Everything resets nightly.
          </p>
          <DemoLogins />
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field id="email" label="Email" type="email" autoComplete="email" required />
        <Field id="password" label="Password" type="password" autoComplete="current-password" required />
        <FormError error={error} />
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />} Sign in
        </Button>
      </form>
      <div className="mt-8 lg:hidden">
        <p className="mb-3 text-sm font-semibold">Or try a demo account</p>
        <DemoLogins />
      </div>
    </AuthShell>
  );
}

export function RegisterPage({ role }: { role: "student" | "tutor" }) {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  if (user) return <Navigate to={dashboardPath(user.role)} replace />;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    if (password.length < 8) return setError("Use at least 8 characters for your password.");
    setBusy(true);
    setError(null);
    try {
      const email = String(form.get("email"));
      const { needsConfirmation } = await register(
        { name: String(form.get("name")), email, password, bio: String(form.get("bio") ?? "") },
        role,
      );
      if (needsConfirmation) setSentTo(email);
      else navigate(role === "tutor" ? "/tutor/verification" : "/tutors", { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const tutor = role === "tutor";

  if (sentTo) {
    return (
      <AuthShell title="Check your email" subtitle={`We sent a confirmation link to ${sentTo}.`}>
        <div className="flex items-start gap-3 rounded-xl bg-secondary p-4 text-sm text-secondary-foreground">
          <MailCheck className="mt-0.5 h-5 w-5 shrink-0" />
          Open the link to activate your account, then sign in.
        </div>
        <Button className="mt-6 w-full" asChild>
          <Link to="/login">Go to sign in</Link>
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={tutor ? "Teach on Tutorly" : "Create your account"}
      subtitle={
        tutor ? (
          <>Want to learn instead? <Link to="/register/student" className="font-semibold text-primary">Join as a student</Link></>
        ) : (
          <>Want to teach? <Link to="/register/tutor" className="font-semibold text-primary">Join as a tutor</Link></>
        )
      }
      aside={
        <div className="max-w-sm space-y-5">
          <h2 className="text-2xl font-bold text-ink">{tutor ? "How tutors get verified" : "Why Tutorly"}</h2>
          {(tutor
            ? [
                "Create your account and set your rate and weekly hours.",
                "Take an 8-question AI-generated test for a subject. You have 30 minutes.",
                "Score 75% or more and the subject is added to your profile. Students can find and book you straight away.",
              ]
            : [
                "Every tutor passed an AI-generated test in each subject they teach.",
                "Describe what you need and AI picks the best tutors for you.",
                "Book from real open slots in your own timezone.",
              ]
          ).map((line) => (
            <p key={line} className="flex gap-3 text-sm text-muted-foreground">
              <BadgeCheck className="h-5 w-5 shrink-0 text-primary" /> {line}
            </p>
          ))}
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field id="name" label="Full name" autoComplete="name" required maxLength={120} />
        <Field id="email" label="Email" type="email" autoComplete="email" required />
        <Field id="password" label="Password" type="password" autoComplete="new-password" required hint="At least 8 characters." />
        {tutor && (
          <div className="space-y-1.5">
            <Label htmlFor="bio">Short bio</Label>
            <Textarea id="bio" name="bio" rows={3} maxLength={2000} placeholder="What you teach, who you teach, and how." />
          </div>
        )}
        <FormError error={error} />
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />} {tutor ? "Create tutor account" : "Create account"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          By signing up you agree to the <Link to="/terms" className="underline">terms</Link> and{" "}
          <Link to="/privacy" className="underline">privacy notice</Link>.
        </p>
      </form>
    </AuthShell>
  );
}
