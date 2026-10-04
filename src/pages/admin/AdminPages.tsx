import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle2, Mail, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { EmptyState, ErrorNotice, Loading, PageHeader, PersonAvatar, StatTile, SubjectChip } from "@/components/common";
import { getAdminStats, listAllTutors, listContactMessages, markContactHandled, recentAttempts, setTutorVerified } from "@/services/admin";
import { ago, money } from "@/lib/format";
import { errorMessage } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export function AdminDashboard() {
  const queryClient = useQueryClient();
  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: getAdminStats });
  const tutors = useQuery({ queryKey: ["admin", "tutors"], queryFn: listAllTutors });
  const attempts = useQuery({ queryKey: ["admin", "attempts"], queryFn: recentAttempts });

  const verify = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) => setTutorVerified(id, verified),
    onSuccess: (_, v) => {
      toast.success(v.verified ? "Tutor listed again" : "Tutor hidden from search");
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (stats.isLoading) return <Loading />;
  if (stats.error) return <ErrorNotice error={stats.error} onRetry={() => stats.refetch()} />;
  const s = stats.data!;

  return (
    <>
      <PageHeader title="Admin" description="Live numbers from the database." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Students" value={s.students} />
        <StatTile label="Tutors" value={s.tutors} hint={`${s.verified_tutors} verified`} />
        <StatTile label="Bookings" value={s.bookings} hint={`${s.bookings_last_7_days} in the last 7 days · ${s.completed_lessons} completed`} />
        <StatTile label="AI tests taken" value={s.tests_taken} hint={s.test_pass_rate != null ? `${s.test_pass_rate}% pass rate` : undefined} />
      </div>
      {s.open_contact_messages > 0 && (
        <Link to="/admin/inbox" className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Mail className="h-4 w-4" /> {s.open_contact_messages} contact message{s.open_contact_messages === 1 ? "" : "s"} waiting
        </Link>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-ink">Tutors</h2>
        <p className="text-sm text-muted-foreground">Turn a tutor off to hide them from search and stop new bookings.</p>
        <div className="surface mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Tutor</th>
                <th className="px-4 py-3 font-semibold">Verified subjects</th>
                <th className="px-4 py-3 font-semibold">Rate</th>
                <th className="px-4 py-3 font-semibold">Rating</th>
                <th className="px-4 py-3 font-semibold">Listed</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tutors.data?.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <PersonAvatar name={t.full_name} src={t.profile_image} className="h-8 w-8 text-xs" />
                      <div>
                        <div className="font-medium">{t.full_name}</div>
                        <div className="text-xs text-muted-foreground">{t.is_demo ? "Demo" : `Joined ${ago(t.created_at)}`}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {t.subjects.length ? t.subjects.map((sub) => <SubjectChip key={sub} subject={sub} />) : <span className="text-muted-foreground">None yet</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">{money(t.hourly_rate)}</td>
                  <td className="px-4 py-3">{t.rating ? `${Number(t.rating).toFixed(1)} (${t.review_count})` : "–"}</td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={t.is_verified}
                      disabled={verify.isPending || (!t.is_verified && !t.subjects.length)}
                      onCheckedChange={(v) => verify.mutate({ id: t.id, verified: v })}
                      aria-label={`List ${t.full_name}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-ink">Recent AI tests</h2>
        <div className="surface mt-3 divide-y">
          {attempts.data?.length ? (
            attempts.data.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
                {a.passed ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <XCircle className="h-4 w-4 text-rose-500" />}
                <span className="font-medium">{a.tutor?.full_name ?? "Tutor"}</span>
                <span>{a.subject}</span>
                <span className={cn("font-semibold", a.passed ? "text-primary" : "text-rose-600")}>{a.score}%</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {a.model} · {a.submitted_at && ago(a.submitted_at)}
                </span>
              </div>
            ))
          ) : (
            <p className="p-4 text-sm text-muted-foreground">No tests taken yet.</p>
          )}
        </div>
      </section>
    </>
  );
}

export function AdminInbox() {
  const queryClient = useQueryClient();
  const messages = useQuery({ queryKey: ["admin", "inbox"], queryFn: listContactMessages });
  const toggle = useMutation({
    mutationFn: ({ id, handled }: { id: string; handled: boolean }) => markContactHandled(id, handled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (messages.isLoading) return <Loading />;
  if (messages.error) return <ErrorNotice error={messages.error} />;

  return (
    <>
      <PageHeader title="Inbox" description="Messages sent from the contact page." />
      {messages.data?.length ? (
        <ul className="space-y-3">
          {messages.data.map((m) => (
            <li key={m.id} className={cn("surface p-5", m.handled && "opacity-60")}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-semibold">{m.name}</span>
                <a href={`mailto:${m.email}`} className="text-primary hover:underline">
                  {m.email}
                </a>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{m.topic}</span>
                <span className="ml-auto text-xs text-muted-foreground">{format(new Date(m.created_at), "d MMM yyyy, HH:mm")}</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm">{m.message}</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => toggle.mutate({ id: m.id, handled: !m.handled })}>
                {m.handled ? "Mark as open" : "Mark as handled"}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={<Mail className="h-5 w-5" />} title="No messages yet" />
      )}
    </>
  );
}
