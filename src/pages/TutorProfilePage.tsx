import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, BadgeCheck, Clock, GraduationCap, MessageSquare, Star } from "lucide-react";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { BookLessonDialog } from "@/components/BookLessonDialog";
import { EmptyState, ErrorNotice, Loading, PersonAvatar, Stars, SubjectChip } from "@/components/common";
import { useAuth } from "@/contexts/AuthContext";
import { getTutor, getTutorReviews } from "@/services/tutors";
import { money } from "@/lib/format";
import { WEEKDAYS } from "@/lib/time";

export default function TutorProfilePage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const tutor = useQuery({ queryKey: ["tutor", id], queryFn: () => getTutor(id) });
  const reviews = useQuery({ queryKey: ["reviews", id], queryFn: () => getTutorReviews(id) });

  if (tutor.isLoading) return <MainLayout><Loading /></MainLayout>;
  if (tutor.error) return <MainLayout><div className="tutorly-container py-16"><ErrorNotice error={tutor.error} /></div></MainLayout>;
  const t = tutor.data;
  if (!t) {
    return (
      <MainLayout>
        <div className="tutorly-container py-16">
          <EmptyState title="Tutor not found">
            This tutor may no longer be verified. <Link to="/tutors" className="font-semibold text-primary">Browse tutors</Link>
          </EmptyState>
        </div>
      </MainLayout>
    );
  }

  const first = t.full_name.split(" ")[0];
  const messageLink = user ? `/${user.role === "tutor" ? "tutor" : "student"}/messages?with=${t.id}` : `/login?next=/tutors/${t.id}`;
  const isSelf = user?.id === t.id;

  return (
    <MainLayout>
      <div className="tutorly-container py-10">
        <Link to="/tutors" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All tutors
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-8">
            <section className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <PersonAvatar name={t.full_name} src={t.profile_image} className="h-24 w-24 text-2xl" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold text-ink">{t.full_name}</h1>
                  {t.is_demo && <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">Sample profile</span>}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <Stars rating={t.rating} count={t.review_count} />
                  {t.education && (
                    <span className="inline-flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4" /> {t.education}
                    </span>
                  )}
                  <span>Joined {format(new Date(t.created_at), "MMMM yyyy")}</span>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink">About {first}</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-muted-foreground">{t.about || "No bio yet."}</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink">Verified subjects</h2>
              <p className="mt-1 text-sm text-muted-foreground">{first} passed Tutorly's AI-generated test in each of these.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {t.subjects.map((s) => (
                  <SubjectChip key={s} subject={s} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-ink">Weekly hours</h2>
              <p className="mt-1 text-sm text-muted-foreground">In {first}'s timezone ({t.timezone}). The booking calendar converts them to yours.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {WEEKDAYS.filter((d) => t.availability?.[d]?.length).map((d) => (
                  <div key={d} className="flex items-center justify-between rounded-lg border bg-card px-4 py-2.5 text-sm">
                    <span className="font-medium capitalize">{d}</span>
                    <span className="text-muted-foreground">{t.availability[d]!.map((r) => `${r.start}–${r.end}`).join(", ")}</span>
                  </div>
                ))}
                {!WEEKDAYS.some((d) => t.availability?.[d]?.length) && (
                  <p className="text-sm text-muted-foreground">{first} hasn't published hours yet.</p>
                )}
              </div>
            </section>

            <section>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-ink">
                <Star className="h-5 w-5 fill-highlight text-highlight" /> Reviews
              </h2>
              <div className="mt-3 space-y-3">
                {reviews.data?.length ? (
                  reviews.data.map((r) => (
                    <figure key={r.id} className="surface p-4">
                      <div className="flex items-center justify-between">
                        <figcaption className="text-sm font-semibold">{r.reviewer_name}</figcaption>
                        <span className="text-sm text-highlight" aria-label={`${r.rating} out of 5`}>
                          {"★".repeat(r.rating)}
                          <span className="text-muted">{"★".repeat(5 - r.rating)}</span>
                        </span>
                      </div>
                      {r.comment && <blockquote className="mt-2 text-sm text-muted-foreground">{r.comment}</blockquote>}
                      <div className="mt-2 text-xs text-muted-foreground">{format(new Date(r.created_at), "d MMM yyyy")}</div>
                    </figure>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No reviews yet. Students can review after a completed lesson.</p>
                )}
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="surface space-y-4 p-6">
              <div>
                <span className="text-3xl font-bold text-ink">{money(t.hourly_rate)}</span>
                <span className="text-muted-foreground"> per hour</span>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-primary" /> Passed AI subject tests</li>
                <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> 30, 60 or 90 minute lessons</li>
              </ul>
              {isSelf ? (
                <Button className="w-full" variant="outline" asChild>
                  <Link to="/tutor/profile">Edit your profile</Link>
                </Button>
              ) : (
                <>
                  <BookLessonDialog tutor={t} />
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={messageLink}>
                      <MessageSquare /> Message {first}
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </MainLayout>
  );
}
