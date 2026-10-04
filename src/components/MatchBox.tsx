import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/common";
import { TutorCard } from "@/components/TutorCard";
import { findTutorMatches } from "@/services/tutors";
import { cn } from "@/lib/utils";

const EXAMPLES = [
  "Integration by parts for my A-level exam in June",
  "Python basics, I've never coded before",
  "Organic chemistry mechanisms, budget under $30",
  "IELTS speaking practice before next month",
];

/** Free-text tutor search: the student describes the need, Gemini picks from real tutors. */
export function MatchBox({ variant = "card" }: { variant?: "card" | "hero" }) {
  const [query, setQuery] = useState("");
  const match = useMutation({ mutationFn: findTutorMatches });

  const submit = (text = query) => {
    if (text.trim().length >= 8) match.mutate(text.trim());
  };

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className={cn(
          "rounded-2xl border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring",
          variant === "hero" && "shadow-xl shadow-primary/10",
        )}
      >
        <label htmlFor="match-query" className="sr-only">
          Describe what you need help with
        </label>
        <textarea
          id="match-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          maxLength={600}
          rows={2}
          placeholder="What do you need help with? e.g. integration for my A-levels, under $35"
          className="w-full resize-none bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between gap-2 px-1 pb-1">
          <span className="flex items-center gap-1.5 px-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            AI matching with Gemini
          </span>
          <Button type="submit" disabled={query.trim().length < 8 || match.isPending}>
            {match.isPending ? <Loader2 className="animate-spin" /> : <ArrowRight />}
            {match.isPending ? "Matching…" : "Find my tutor"}
          </Button>
        </div>
      </form>

      {!match.data && !match.isPending && (
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setQuery(ex);
                submit(ex);
              }}
              className="rounded-full border bg-card/80 px-3 py-1.5 text-left text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {match.error && (
        <div className="mt-4">
          <ErrorNotice error={match.error} onRetry={() => submit()} />
        </div>
      )}

      {match.data && (
        <div className="mt-6 animate-fade-up" aria-live="polite">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {match.data.summary ? (
                <>
                  Looking for: <span className="font-semibold text-foreground">{match.data.summary}</span>
                </>
              ) : (
                "Results"
              )}
            </p>
            {match.data.mode === "keyword" && (
              <span className="text-xs text-muted-foreground">AI is unavailable, so these are keyword matches.</span>
            )}
          </div>
          {match.data.matches.length ? (
            <div className="grid gap-4 md:grid-cols-3">
              {match.data.matches.map((m) => (
                <TutorCard key={m.tutor.id} tutor={m.tutor} reason={m.reason} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              No tutor on Tutorly fits that yet
              {match.data.subject ? ` for ${match.data.subject}` : ""}. Try describing it differently, or browse all tutors.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
