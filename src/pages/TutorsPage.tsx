import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import MainLayout from "@/components/layouts/MainLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MatchBox } from "@/components/MatchBox";
import { TutorCard } from "@/components/TutorCard";
import { EmptyState, ErrorNotice } from "@/components/common";
import { listTutors } from "@/services/tutors";
import { SUBJECTS } from "../../shared/subjects";

const PRICES = [
  { value: "all", label: "Any price" },
  { value: "25", label: "Up to $25/hr" },
  { value: "30", label: "Up to $30/hr" },
  { value: "40", label: "Up to $40/hr" },
];

export default function TutorsPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [showAi, setShowAi] = useState(false);
  const subject = params.get("subject") ?? "all";
  const maxPrice = params.get("max") ?? "all";
  const tutors = useQuery({ queryKey: ["tutors"], queryFn: listTutors });

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value === "all") next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (tutors.data ?? []).filter(
      (t) =>
        (subject === "all" || t.subjects.includes(subject)) &&
        (maxPrice === "all" || (t.hourly_rate ?? 0) <= Number(maxPrice)) &&
        (!q || [t.full_name, t.about, t.education, ...t.subjects].some((f) => f?.toLowerCase().includes(q))),
    );
  }, [tutors.data, subject, maxPrice, search]);

  const offered = SUBJECTS.filter((s) => tutors.data?.some((t) => t.subjects.includes(s)));
  const filtersOn = subject !== "all" || maxPrice !== "all" || search;

  return (
    <MainLayout>
      <div className="tutorly-container py-12">
        <p className="eyebrow">Tutors</p>
        <h1 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">Find your tutor</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every tutor here passed an AI-generated test in each subject they list. Filter yourself, or describe what you need
          and let AI pick.
        </p>

        <div className="mt-8 surface p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_200px_180px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search names, subjects, bios"
                className="pl-9"
                aria-label="Search tutors"
              />
            </div>
            <Select value={subject} onValueChange={(v) => setParam("subject", v)}>
              <SelectTrigger aria-label="Subject">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {offered.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={maxPrice} onValueChange={(v) => setParam("max", v)}>
              <SelectTrigger aria-label="Price">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRICES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={() => setShowAi(!showAi)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-primary/30 bg-secondary px-4 text-sm font-semibold text-secondary-foreground hover:border-primary"
              aria-expanded={showAi}
            >
              <Sparkles className="h-4 w-4" /> Ask AI
            </button>
          </div>
          {showAi && (
            <div className="mt-4 border-t pt-4">
              <MatchBox />
            </div>
          )}
        </div>

        <div className="mb-4 mt-8 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {tutors.error ? "" : tutors.isLoading ? "Loading tutors…" : `${filtered.length} tutor${filtered.length === 1 ? "" : "s"}`}
          </span>
          {filtersOn && (
            <button
              onClick={() => {
                setSearch("");
                setParams({}, { replace: true });
              }}
              className="inline-flex items-center gap-1 font-medium hover:text-foreground"
            >
              <X className="h-4 w-4" /> Clear filters
            </button>
          )}
        </div>

        {tutors.error ? (
          <ErrorNotice error={tutors.error} onRetry={() => tutors.refetch()} />
        ) : tutors.isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="surface h-52 animate-pulse bg-muted/60" />
            ))}
          </div>
        ) : filtered.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <TutorCard key={t.id} tutor={t} />
            ))}
          </div>
        ) : (
          <EmptyState icon={<SlidersHorizontal className="h-5 w-5" />} title="No tutors match those filters">
            Try another subject or a higher price, or describe what you need with Ask AI.
          </EmptyState>
        )}
      </div>
    </MainLayout>
  );
}
