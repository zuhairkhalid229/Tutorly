import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { BadgeCheck, CheckCircle2, Clock, Loader2, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ErrorNotice, PageHeader, SubjectChip } from "@/components/common";
import { useAuth } from "@/contexts/AuthContext";
import { myAttempts, startTest, submitTest, type StartedTest, type TestResult } from "@/services/verification";
import { cn } from "@/lib/utils";
import { PASS_MARK, QUESTIONS_PER_TEST, SUBJECTS, TEST_TIME_LIMIT_MINUTES } from "../../../shared/subjects";

export default function VerificationPage() {
  const { profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState<string | null>(null);
  const [test, setTest] = useState<StartedTest | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<TestResult | null>(null);
  const attempts = useQuery({ queryKey: ["attempts", profile?.id], queryFn: myAttempts, enabled: !!profile });

  const start = useMutation({
    mutationFn: (s: string) => startTest(s),
    onSuccess: (t) => {
      setTest(t);
      setAnswers({});
      setResult(null);
      window.scrollTo({ top: 0 });
    },
  });

  const submit = useMutation({
    mutationFn: () => submitTest(test!.attemptId, answers),
    onSuccess: async (r) => {
      setResult(r);
      setTest(null);
      window.scrollTo({ top: 0 });
      queryClient.invalidateQueries({ queryKey: ["attempts"] });
      if (r.passed) {
        await refreshProfile();
        toast.success(`You're verified to teach ${r.subject}`);
      }
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't submit the test."),
  });

  // Warn before leaving mid-test.
  useEffect(() => {
    if (!test) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [test]);

  if (!profile) return null;
  const verified = profile.subjects;

  if (test) {
    return <TestRunner test={test} answers={answers} setAnswers={setAnswers} onSubmit={() => submit.mutate()} submitting={submit.isPending} />;
  }

  return (
    <>
      <PageHeader
        title="AI verification"
        description={`Pass a ${QUESTIONS_PER_TEST}-question test with ${PASS_MARK}% or more to add a subject to your profile.`}
      />

      {result && <ResultPanel result={result} onDone={() => setResult(null)} />}

      {!result && (
        <>
          {verified.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">You're verified in</span>
              {verified.map((s) => (
                <SubjectChip key={s} subject={s} />
              ))}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <div className="surface p-6">
              <h2 className="font-semibold text-ink">Choose a subject</h2>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {SUBJECTS.filter((s) => !verified.includes(s)).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSubject(s)}
                    aria-pressed={subject === s}
                    disabled={start.isPending}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition",
                      subject === s ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/40",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {start.isPending ? (
                <Generating subject={subject!} />
              ) : (
                <>
                  {start.error && (
                    <div className="mt-5">
                      <ErrorNotice error={start.error} />
                    </div>
                  )}
                  <Button size="lg" className="mt-6 w-full sm:w-auto" disabled={!subject} onClick={() => start.mutate(subject!)}>
                    <Sparkles /> {subject ? `Start the ${subject} test` : "Pick a subject"}
                  </Button>
                </>
              )}
            </div>

            <aside className="surface h-fit space-y-4 p-6 text-sm">
              <h2 className="flex items-center gap-2 font-semibold text-ink">
                <ShieldCheck className="h-4 w-4 text-primary" /> How the test works
              </h2>
              <ul className="space-y-3 text-muted-foreground">
                <li>Gemini writes a new set of questions every time.</li>
                <li>A second AI pass answers each question on its own. Any question where it disagrees with the key is removed.</li>
                <li>The answers stay on the server until you submit. Grading happens there too.</li>
                <li>You have {TEST_TIME_LIMIT_MINUTES} minutes. You can try up to 5 tests a day.</li>
              </ul>
            </aside>
          </div>

          {!!attempts.data?.length && (
            <section className="mt-10">
              <h2 className="text-lg font-semibold text-ink">Your past tests</h2>
              <div className="surface mt-3 divide-y">
                {attempts.data.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      {a.passed ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <XCircle className="h-4 w-4 text-rose-500" />}
                      <span className="font-medium">{a.subject}</span>
                      <span className="text-muted-foreground">{format(new Date(a.created_at), "d MMM yyyy, HH:mm")}</span>
                    </div>
                    <span className={cn("font-semibold", a.passed ? "text-primary" : "text-rose-600")}>{a.score}%</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}

function Generating({ subject }: { subject: string }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setPhase(1), 9000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="mt-6 rounded-xl bg-secondary p-5 text-sm text-secondary-foreground" role="status">
      <div className="flex items-center gap-2 font-semibold">
        <Loader2 className="h-4 w-4 animate-spin" /> Building your {subject} test
      </div>
      <ol className="mt-3 space-y-1.5">
        <li className={phase > 0 ? "opacity-60" : ""}>1. Writing new questions{phase > 0 && " ✓"}</li>
        <li className={phase < 1 ? "opacity-50" : ""}>2. Double-checking the answer key with a second AI pass</li>
      </ol>
      <p className="mt-3 text-xs opacity-80">This usually takes 15–40 seconds.</p>
    </div>
  );
}

function TestRunner({
  test,
  answers,
  setAnswers,
  onSubmit,
  submitting,
}: {
  test: StartedTest;
  answers: Record<string, string>;
  setAnswers: (a: Record<string, string>) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const deadline = new Date(test.startedAt).getTime() + test.timeLimitMinutes * 60_000;
  const [left, setLeft] = useState(deadline - Date.now());
  useEffect(() => {
    const t = setInterval(() => setLeft(deadline - Date.now()), 1000);
    return () => clearInterval(t);
  }, [deadline]);

  const answered = test.questions.filter((q) => answers[q.id]).length;
  const mins = Math.max(0, Math.floor(left / 60_000));
  const secs = Math.max(0, Math.floor((left % 60_000) / 1000));

  return (
    <div className="mx-auto max-w-3xl">
      <div className="sticky top-0 z-10 -mx-4 mb-6 border-b bg-muted/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-ink">{test.subject} test</span>
          <span className={cn("inline-flex items-center gap-1.5 font-mono", left < 5 * 60_000 && "text-rose-600")}>
            <Clock className="h-4 w-4" /> {mins}:{String(secs).padStart(2, "0")}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(answered / test.questions.length) * 100}%` }} />
        </div>
      </div>

      <ol className="space-y-6">
        {test.questions.map((q, i) => (
          <li key={q.id} className="surface p-5 sm:p-6">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>Question {i + 1} of {test.questions.length}</span>
              {q.topic && <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">{q.topic}</span>}
            </div>
            <p className="mt-3 font-semibold leading-relaxed text-ink">{q.question}</p>
            <div className="mt-4 space-y-2" role="radiogroup" aria-label={`Question ${i + 1}`}>
              {q.options.map((o) => {
                const chosen = answers[q.id] === o.id;
                return (
                  <button
                    key={o.id}
                    role="radio"
                    aria-checked={chosen}
                    onClick={() => setAnswers({ ...answers, [q.id]: o.id })}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border px-3 py-3 text-left text-sm transition",
                      chosen ? "border-primary bg-secondary" : "hover:border-primary/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        chosen ? "bg-primary text-primary-foreground" : "bg-muted",
                      )}
                    >
                      {o.id}
                    </span>
                    <span className="pt-0.5">{o.text}</span>
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-col items-center gap-2">
        <Button size="lg" disabled={answered < test.questions.length || submitting || left <= 0} onClick={onSubmit}>
          {submitting && <Loader2 className="animate-spin" />} Submit test
        </Button>
        <span className="text-sm text-muted-foreground">
          {left <= 0 ? "Time's up. Start a new test." : `${answered} of ${test.questions.length} answered · ${test.passMark}% to pass`}
        </span>
      </div>
    </div>
  );
}

function ResultPanel({ result, onDone }: { result: TestResult; onDone: () => void }) {
  return (
    <div className="space-y-6">
      <div className={cn("rounded-2xl border p-6 sm:p-8", result.passed ? "border-primary/30 bg-secondary" : "border-rose-200 bg-rose-50")}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div
            className={cn(
              "flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-8 text-2xl font-extrabold",
              result.passed ? "border-primary text-primary" : "border-rose-400 text-rose-600",
            )}
          >
            {result.score}%
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink">
              {result.passed ? `You're verified to teach ${result.subject}` : `Not this time: ${result.subject}`}
            </h2>
            <p className="mt-1 text-muted-foreground">
              {result.correctCount} of {result.total} correct.{" "}
              {result.passed
                ? "It's now on your public profile, and students can book you for it."
                : `You need ${PASS_MARK}%. Read the explanations below, then try a fresh test.`}
            </p>
            <Button className="mt-4" variant={result.passed ? "default" : "outline"} onClick={onDone}>
              {result.passed ? <BadgeCheck /> : null} {result.passed ? "Verify another subject" : "Try again"}
            </Button>
          </div>
        </div>
      </div>

      <h3 className="font-semibold text-ink">Review your answers</h3>
      <ol className="space-y-3">
        {result.review.map((q, i) => (
          <li key={q.id} className="surface p-5">
            <div className="flex items-start gap-3">
              {q.isCorrect ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />}
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-ink">
                  {i + 1}. {q.question}
                </p>
                {!q.isCorrect && q.chosen && (
                  <p className="text-rose-700">Your answer: {q.options.find((o) => o.id === q.chosen)?.text}</p>
                )}
                <p className="text-primary">Correct: {q.options.find((o) => o.id === q.correct)?.text}</p>
                <p className="text-muted-foreground">{q.explanation}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
