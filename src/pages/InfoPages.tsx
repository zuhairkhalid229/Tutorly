import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Database, Github, Linkedin, Loader2, ShieldCheck, Sparkles, Zap } from "lucide-react";
import MainLayout, { AUTHOR_URL, GITHUB_URL } from "@/components/layouts/MainLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/common";
import { sendContactMessage } from "@/services/admin";
import { listTutors } from "@/services/tutors";
import { errorMessage } from "@/lib/supabase";
import { PASS_MARK, QUESTIONS_PER_TEST, SUBJECTS, TEST_TIME_LIMIT_MINUTES } from "../../shared/subjects";

function Page({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <MainLayout>
      <div className="tutorly-container max-w-3xl py-14">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">{title}</h1>
        {intro && <p className="mt-4 text-lg text-muted-foreground">{intro}</p>}
        <div className="mt-10 space-y-10">{children}</div>
      </div>
    </MainLayout>
  );
}

const Prose = ({ children }: { children: ReactNode }) => (
  <div className="space-y-4 leading-relaxed text-muted-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_strong]:text-foreground">
    {children}
  </div>
);

export function AboutPage() {
  const stack: [typeof Zap, string, string][] = [
    [Zap, "Frontend", "React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui and TanStack Query, deployed on Vercel."],
    [Database, "Data and auth", "Supabase Postgres, Auth, Storage and Realtime. Every rule lives in the database as row-level security policies and SQL functions, covered by 33 tests."],
    [Sparkles, "AI", "Gemini with structured JSON output, called only from Vercel serverless functions. The API key never reaches the browser."],
    [ShieldCheck, "Security", "Answer keys stay on the server, prices are computed in SQL, a Postgres exclusion constraint stops double-booking, and every AI endpoint is rate limited."],
  ];
  return (
    <Page
      eyebrow="About"
      title="A tutoring marketplace where tutors prove what they know"
      intro="Tutorly is a full-stack portfolio project by Zuhair Khalid, a full-stack and AI engineer in Lahore. It works end to end, but the tutors are sample profiles and no payments are taken."
    >
      <Prose>
        <h2>The idea</h2>
        <p>
          Tutoring sites ask you to trust a tutor's own description of themselves. Tutorly makes every tutor pass an
          AI-generated test before they can list a subject. Students then describe what they need in plain words and get
          matched with the tutors who fit best.
        </p>
        <h2>What's real</h2>
        <p>
          Sign-up, AI tests, AI matching, booking against real availability, tutor confirmation, live messaging, a shared
          whiteboard, reviews and the admin dashboard all run against a live database. The demo accounts on the{" "}
          <Link to="/login" className="font-semibold text-primary">sign-in page</Link> let you try both sides. Demo data
          resets every night.
        </p>
      </Prose>

      <div className="grid gap-4 sm:grid-cols-2">
        {stack.map(([Icon, title, body]) => (
          <div key={title} className="surface p-5">
            <Icon className="h-5 w-5 text-primary" />
            <h3 className="mt-3 font-semibold text-ink">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer">
            <Github /> Read the code
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href={AUTHOR_URL} target="_blank" rel="noreferrer">
            <Linkedin /> Zuhair on LinkedIn
          </a>
        </Button>
      </div>
    </Page>
  );
}

export function HowItWorksPage() {
  return (
    <Page eyebrow="How it works" title="How Tutorly works" intro="For students, for tutors, and what happens under the hood.">
      <Prose>
        <h2>For students</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li><strong>Describe what you need.</strong> AI matching reads every verified tutor's subjects, bio, qualification, rate and rating, then returns up to three with a one-line reason. If the AI is unavailable, keyword matching takes over.</li>
          <li><strong>Pick a time.</strong> The booking calendar turns the tutor's weekly hours (in their timezone) into open slots in yours, hiding anything already booked.</li>
          <li><strong>Wait for confirmation.</strong> Your request is pending until the tutor accepts. If two students go for the same slot, the database lets only one through.</li>
          <li><strong>Join the lesson room.</strong> It opens 15 minutes before the start, with a shared whiteboard, chat and a video call link.</li>
          <li><strong>Leave a review.</strong> Once the tutor marks the lesson completed, your review updates their public rating.</li>
        </ol>
      </Prose>
      <div id="verification" className="scroll-mt-24">
        <Prose>
          <h2>For tutors: AI verification</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Choose a subject. Gemini writes a fresh set of multiple-choice questions for it.</li>
            <li>A second, independent AI pass answers every question without seeing the key. Questions where the two disagree are dropped, leaving up to {QUESTIONS_PER_TEST}.</li>
            <li>Options are shuffled on the server and the answer key is stored there. Your browser only ever receives the questions.</li>
            <li>You have {TEST_TIME_LIMIT_MINUTES} minutes. The server grades your answers. Score {PASS_MARK}% or more and the subject is added to your profile.</li>
            <li>You then see every question with the correct answer and an explanation, pass or fail.</li>
          </ol>
          <p>
            Tutors can't add subjects any other way. The database only accepts subject changes from the server, so even a
            modified browser can't fake a pass.
          </p>
        </Prose>
      </div>
      <Button asChild>
        <Link to="/register/tutor">Become a tutor</Link>
      </Button>
    </Page>
  );
}

const FAQS: [string, string][] = [
  ["How are tutors verified?", `Each tutor passes an AI-generated test of ${QUESTIONS_PER_TEST} questions in every subject they list, scoring at least ${PASS_MARK}%. The test is generated fresh each time, double-checked by a second AI pass and graded on the server.`],
  ["How do I book a lesson?", "Open a tutor's profile, choose Book a lesson, pick a subject, length and time, and send the request. The tutor accepts or declines it, and you'll see the result under Lessons."],
  ["How do payments work?", "Tutorly is a portfolio project and takes no payments. The price shown is what the tutor charges for that lesson."],
  ["Can I message a tutor before booking?", "Yes. Use Message on any tutor's profile. Tutors can reply, but they can't message students who haven't contacted them or booked with them."],
  ["How do I cancel?", "Open Lessons and choose Cancel on any pending or confirmed lesson that hasn't started yet."],
  ["Where do lessons happen?", "In the lesson room, which has a shared whiteboard and chat, plus a link to a video call. It opens 15 minutes before the lesson starts."],
  ["Which timezone are times shown in?", "Yours. Tutors set their weekly hours in their own timezone, and Tutorly converts them for you."],
  ["Is my data safe?", "Every table is protected by row-level security in the database. Other users can't see your bookings or messages, and students' profiles aren't public."],
];

export function FAQsPage() {
  return (
    <Page eyebrow="FAQs" title="Questions and answers">
      <Accordion type="single" collapsible className="surface px-5">
        {FAQS.map(([q, a]) => (
          <AccordionItem key={q} value={q}>
            <AccordionTrigger className="text-left font-semibold">{q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <p className="text-muted-foreground">
        Still stuck? <Link to="/contact" className="font-semibold text-primary">Send us a message</Link>.
      </p>
    </Page>
  );
}

export function ContactPage() {
  const [sent, setSent] = useState(false);
  const send = useMutation({ mutationFn: sendContactMessage, onSuccess: () => setSent(true) });

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    send.mutate({
      name: String(f.get("name")).trim(),
      email: String(f.get("email")).trim(),
      topic: String(f.get("topic")),
      message: String(f.get("message")).trim(),
    });
  };

  return (
    <Page eyebrow="Contact" title="Get in touch" intro="Questions, feedback or a bug to report. Messages go straight to the admin inbox.">
      {sent ? (
        <div className="surface flex items-start gap-3 p-6">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" />
          <div>
            <h2 className="font-semibold text-ink">Message sent</h2>
            <p className="text-sm text-muted-foreground">Thanks. You'll get a reply by email.</p>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="surface space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required maxLength={120} autoComplete="name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required maxLength={200} autoComplete="email" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="topic">Topic</Label>
            <select id="topic" name="topic" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="general">General question</option>
              <option value="bookings">Bookings</option>
              <option value="tutoring">Becoming a tutor</option>
              <option value="bug">Report a bug</option>
              <option value="hiring">Hiring Zuhair</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" name="message" required rows={6} maxLength={5000} />
          </div>
          {send.error && <p className="text-sm text-rose-700" role="alert">{errorMessage(send.error)}</p>}
          <Button type="submit" disabled={send.isPending}>
            {send.isPending && <Loader2 className="animate-spin" />} Send message
          </Button>
        </form>
      )}
    </Page>
  );
}

export function TermsPage() {
  return (
    <Page eyebrow="Terms" title="Terms of use" intro="Short, because Tutorly is a demonstration project.">
      <Prose>
        <p>Tutorly is a portfolio project. It's provided as is, without any guarantee of availability, and it may change or go offline at any time.</p>
        <p>Tutor profiles marked as sample profiles are fictional. No payments are processed, and prices are for illustration.</p>
        <p>Don't post anything unlawful, abusive or personal in profiles, messages or reviews. Content that breaks this may be removed and accounts closed.</p>
        <p>Demo accounts are shared with every visitor and are reset every night.</p>
      </Prose>
    </Page>
  );
}

export function PrivacyPage() {
  return (
    <Page eyebrow="Privacy" title="Privacy notice">
      <Prose>
        <p><strong>What's stored:</strong> your email and password (handled by Supabase Auth, passwords are hashed), your profile, bookings, messages, reviews and test results.</p>
        <p><strong>Who can see it:</strong> tutor profiles and reviews are public. Student profiles are visible only to tutors you book or message. Bookings and messages are visible only to the two people involved, and to the admin.</p>
        <p><strong>AI:</strong> what you type into AI matching, and the tutor profiles it's compared against, are sent to Google's Gemini API to produce matches. Tests are generated by Gemini too. Don't include personal details in your search.</p>
        <p><strong>Deleting your data:</strong> use the <Link to="/contact" className="font-semibold text-primary">contact form</Link> and your account and everything linked to it will be deleted.</p>
      </Prose>
    </Page>
  );
}

export function SubjectsPage() {
  const tutors = useQuery({ queryKey: ["tutors"], queryFn: listTutors });
  return (
    <Page eyebrow="Subjects" title="What you can learn on Tutorly" intro="Tutors can verify in any of these subjects. Numbers show verified tutors right now.">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SUBJECTS.map((s) => {
          const n = tutors.data?.filter((t) => t.subjects.includes(s)).length ?? 0;
          return (
            <Link
              key={s}
              to={n ? `/tutors?subject=${encodeURIComponent(s)}` : "/register/tutor"}
              className="surface flex items-center justify-between p-4 transition hover:border-primary/40"
            >
              <span className="font-semibold text-ink">{s}</span>
              <span className="text-sm text-muted-foreground">{n ? `${n} tutor${n === 1 ? "" : "s"}` : "Teach it?"}</span>
            </Link>
          );
        })}
      </div>
    </Page>
  );
}

export function NotFoundPage() {
  return (
    <MainLayout>
      <div className="tutorly-container max-w-lg py-24">
        <EmptyState title="Page not found">
          That link doesn't go anywhere. <Link to="/" className="font-semibold text-primary">Go home</Link>
        </EmptyState>
      </div>
    </MainLayout>
  );
}
