import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, CalendarCheck2, CheckCircle2, MessagesSquare, PenLine, ShieldCheck, Sparkles } from "lucide-react";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { MatchBox } from "@/components/MatchBox";
import { TutorCard } from "@/components/TutorCard";
import { PersonAvatar } from "@/components/common";
import { DemoLogins } from "@/components/DemoLogins";
import { listTutors } from "@/services/tutors";
import { SUBJECTS } from "../../shared/subjects";

const STEPS = [
  {
    icon: Sparkles,
    title: "Describe what you need",
    body: "Write it the way you'd tell a friend. Gemini reads every tutor's subjects, bio and rates and picks the best three, with a reason for each.",
  },
  {
    icon: CalendarCheck2,
    title: "Book a time that works",
    body: "See open slots from the tutor's real weekly hours, shown in your own timezone. The tutor confirms, and double-booking is impossible.",
  },
  {
    icon: PenLine,
    title: "Learn on a shared whiteboard",
    body: "Join the lesson room for a live whiteboard and chat, plus a video call. Afterwards, leave a review that updates the tutor's rating.",
  },
];

export default function HomePage() {
  const tutors = useQuery({ queryKey: ["tutors"], queryFn: listTutors });
  const counts = new Map<string, number>();
  for (const t of tutors.data ?? []) for (const s of t.subjects) counts.set(s, (counts.get(s) ?? 0) + 1);
  const subjects = SUBJECTS.filter((s) => counts.get(s)).sort((a, b) => counts.get(b)! - counts.get(a)!);

  return (
    <MainLayout>
      {/* Hero */}
      <section className="dot-grid relative overflow-hidden border-b">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
        <div className="tutorly-container relative py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-primary shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" /> Every tutor passed an AI-generated subject test
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] text-ink sm:text-6xl">
              Find a tutor who has <span className="text-primary">passed the test.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              Tell us what you're stuck on. We'll match you with a verified tutor in seconds, and you can book a time that
              suits you.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-4xl">
            <MatchBox variant="hero" />
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Rather browse?{" "}
            <Link to="/tutors" className="font-semibold text-primary hover:underline">
              See all {tutors.data?.length || ""} tutors →
            </Link>
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="tutorly-container py-20">
        <p className="eyebrow">How it works</p>
        <h2 className="mt-2 max-w-xl text-3xl font-bold text-ink">From “I'm stuck” to a booked lesson in a few minutes</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="surface p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-muted-foreground">Step {i + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Verification */}
      <section className="bg-ink text-white">
        <div className="tutorly-container grid items-center gap-12 py-20 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-highlight">AI verification</p>
            <h2 className="mt-2 text-3xl font-bold">A tutor can't list a subject until they pass a test in it</h2>
            <ul className="mt-8 space-y-4 text-white/80">
              {[
                "Gemini writes a fresh 8-question test every time, so answers can't be shared.",
                "A second, independent AI pass re-answers every question. Any question where the two disagree is thrown out, so nobody fails because of a bad answer key.",
                "The answers never reach the browser. Tests are graded on the server, and 75% is needed to pass.",
                "Only a pass recorded by the server can add a subject. The database blocks tutors from editing it themselves.",
              ].map((line) => (
                <li key={line} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-highlight" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <Button size="lg" variant="secondary" className="mt-8" asChild>
              <Link to="/register/tutor">
                Take a test and start teaching <ArrowRight />
              </Link>
            </Button>
          </div>
          <TestPreview />
        </div>
      </section>

      {/* Tutors */}
      <section className={tutors.data?.length || tutors.isLoading ? "tutorly-container py-20" : "hidden"}>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Top rated</p>
            <h2 className="mt-2 text-3xl font-bold text-ink">Tutors students rate highest</h2>
          </div>
          <Button variant="outline" asChild>
            <Link to="/tutors">
              All tutors <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(tutors.data ?? []).slice(0, 6).map((t) => (
            <TutorCard key={t.id} tutor={t} />
          ))}
          {tutors.isLoading &&
            Array.from({ length: 3 }, (_, i) => <div key={i} className="surface h-52 animate-pulse bg-muted/60" />)}
        </div>
      </section>

      {/* Subjects */}
      {subjects.length > 0 && (
        <section className="tutorly-container pb-20">
          <p className="eyebrow">Subjects</p>
          <h2 className="mt-2 text-3xl font-bold text-ink">Verified tutors by subject</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {subjects.map((s) => (
              <Link
                key={s}
                to={`/tutors?subject=${encodeURIComponent(s)}`}
                className="surface flex items-center justify-between px-4 py-3 text-sm font-semibold transition hover:border-primary/40 hover:text-primary"
              >
                {s}
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">{counts.get(s)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Demo */}
      <section className="tutorly-container">
        <div className="surface grid gap-8 overflow-hidden p-8 md:grid-cols-[1.2fr_1fr] md:p-10">
          <div>
            <p className="eyebrow">Try it now</p>
            <h2 className="mt-2 text-2xl font-bold text-ink">Look around as a student or a tutor</h2>
            <p className="mt-3 text-muted-foreground">
              The demo accounts come with lessons, messages and reviews already in place. Book a lesson, accept a request,
              take an AI test or draw on the whiteboard. Everything resets every night.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-primary" /> Real database, real rules
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessagesSquare className="h-4 w-4 text-primary" /> Live messages
              </span>
            </div>
          </div>
          <DemoLogins />
        </div>
      </section>
    </MainLayout>
  );
}

function TestPreview() {
  const options = ["f′(x) = 2x·cos(x²)", "f′(x) = cos(x²)", "f′(x) = 2x·sin(x²)", "f′(x) = −2x·cos(x²)"];
  return (
    <div className="relative" aria-hidden>
      <div className="rounded-2xl bg-white p-6 text-ink shadow-2xl">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>Mathematics · Question 3 of 8</span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">Calculus</span>
        </div>
        <p className="mt-4 font-semibold">If f(x) = sin(x²), what is f′(x)?</p>
        <div className="mt-4 space-y-2">
          {options.map((o, i) => (
            <div key={o} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${i === 0 ? "border-primary bg-secondary" : ""}`}>
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? "bg-primary text-white" : "bg-muted"}`}
              >
                {"ABCD"[i]}
              </span>
              {o}
            </div>
          ))}
        </div>
      </div>
      <div className="absolute -bottom-6 -left-2 flex items-center gap-3 rounded-xl bg-white p-3 pr-5 text-ink shadow-xl sm:-left-8">
        <PersonAvatar name="Ayesha Khan" className="h-10 w-10 text-sm" />
        <div>
          <div className="text-sm font-semibold">Ayesha passed Mathematics</div>
          <div className="text-xs text-muted-foreground">88% · 7 of 8 correct</div>
        </div>
        <BadgeCheck className="h-5 w-5 text-primary" />
      </div>
    </div>
  );
}
