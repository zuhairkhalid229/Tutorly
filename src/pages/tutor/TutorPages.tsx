import { Link } from "react-router-dom";
import { BadgeCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorNotice, Loading, PageHeader, StatTile, SubjectChip } from "@/components/common";
import { LessonList } from "@/components/LessonList";
import { useAuth } from "@/contexts/AuthContext";
import { groupBookings } from "@/services/bookings";
import { useMyBookings } from "@/pages/student/StudentPages";
import { money } from "@/lib/format";
import { teachingDays } from "@/lib/time";

export function TutorDashboard() {
  const { user, profile } = useAuth();
  const bookings = useMyBookings();
  if (bookings.isLoading || !profile) return <Loading />;
  if (bookings.error) return <ErrorNotice error={bookings.error} onRetry={() => bookings.refetch()} />;
  const g = groupBookings(bookings.data ?? []);
  const completed = g.past.filter((b) => b.status === "completed");
  const earned = completed.reduce((sum, b) => sum + Number(b.price), 0);
  const days = teachingDays(profile.availability);

  return (
    <>
      <PageHeader
        title={`Hi ${user?.name.split(" ")[0]}`}
        description="Requests, lessons and your verification status."
        action={
          profile.is_verified && (
            <Button variant="outline" asChild>
              <Link to={`/tutors/${profile.id}`}>
                <ExternalLink /> View public profile
              </Link>
            </Button>
          )
        }
      />

      {!profile.is_verified || !days.length || !profile.hourly_rate ? (
        <div className="mb-8 rounded-2xl border border-primary/30 bg-secondary p-5">
          <h2 className="font-semibold text-secondary-foreground">Finish setting up to get booked</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <Step done={profile.is_verified} to="/tutor/verification" label="Pass an AI test in a subject you teach" />
            <Step done={!!profile.hourly_rate} to="/tutor/profile" label="Set your hourly rate" />
            <Step done={days.length > 0} to="/tutor/profile" label="Add your weekly hours" />
          </ul>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="New requests" value={g.requests.length} />
        <StatTile label="Upcoming lessons" value={g.upcoming.length} />
        <StatTile label="Earned on Tutorly" value={money(earned)} hint={`${completed.length} completed lessons`} />
        <StatTile label="Rating" value={profile.rating ? `${Number(profile.rating).toFixed(1)} ★` : "–"} hint={`${profile.review_count} reviews`} />
      </div>

      {profile.subjects.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Verified in</span>
          {profile.subjects.map((s) => (
            <SubjectChip key={s} subject={s} />
          ))}
          <Link to="/tutor/verification" className="text-sm font-semibold text-primary hover:underline">
            + Add a subject
          </Link>
        </div>
      )}

      {g.awaitingCompletion.length > 0 && (
        <section className="mt-10 space-y-3">
          <h2 className="text-lg font-semibold text-ink">Did these lessons happen?</h2>
          <LessonList role="tutor" bookings={g.awaitingCompletion} empty="" />
        </section>
      )}

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-ink">Requests</h2>
        <LessonList role="tutor" bookings={g.requests} empty="No requests waiting for you." />
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-ink">Upcoming</h2>
        <LessonList role="tutor" bookings={g.upcoming.slice(0, 5)} empty="No confirmed lessons yet." />
      </section>
    </>
  );
}

function Step({ done, to, label }: { done: boolean; to: string; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <BadgeCheck className={done ? "h-4 w-4 text-primary" : "h-4 w-4 text-muted-foreground/50"} />
      {done ? (
        <span className="text-muted-foreground line-through">{label}</span>
      ) : (
        <Link to={to} className="font-medium text-ink underline-offset-2 hover:underline">
          {label}
        </Link>
      )}
    </li>
  );
}

export function TutorBookingsPage() {
  const bookings = useMyBookings();
  if (bookings.isLoading) return <Loading />;
  if (bookings.error) return <ErrorNotice error={bookings.error} onRetry={() => bookings.refetch()} />;
  const g = groupBookings(bookings.data ?? []);

  return (
    <>
      <PageHeader title="Lessons" description="Accept requests, join lessons and mark them completed afterwards." />
      <Tabs defaultValue={g.requests.length ? "requests" : "upcoming"}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="requests">Requests ({g.requests.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({g.upcoming.length})</TabsTrigger>
          <TabsTrigger value="complete">To complete ({g.awaitingCompletion.length})</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        <TabsContent value="requests" className="mt-4">
          <LessonList role="tutor" bookings={g.requests} empty="No requests waiting for you." />
        </TabsContent>
        <TabsContent value="upcoming" className="mt-4">
          <LessonList role="tutor" bookings={g.upcoming} empty="No confirmed lessons coming up." />
        </TabsContent>
        <TabsContent value="complete" className="mt-4">
          <LessonList role="tutor" bookings={g.awaitingCompletion} empty="Nothing to mark completed." />
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          <LessonList role="tutor" bookings={g.past} empty="No past lessons yet." />
        </TabsContent>
      </Tabs>
    </>
  );
}
