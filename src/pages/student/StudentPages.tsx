import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorNotice, Loading, PageHeader, StatTile } from "@/components/common";
import { LessonList } from "@/components/LessonList";
import { MatchBox } from "@/components/MatchBox";
import { useAuth } from "@/contexts/AuthContext";
import { groupBookings, myBookings } from "@/services/bookings";

export function useMyBookings() {
  const { user } = useAuth();
  return useQuery({ queryKey: ["bookings", user?.id], queryFn: myBookings, enabled: !!user, refetchInterval: 60_000 });
}

export function StudentDashboard() {
  const { user } = useAuth();
  const bookings = useMyBookings();
  if (bookings.isLoading) return <Loading />;
  if (bookings.error) return <ErrorNotice error={bookings.error} onRetry={() => bookings.refetch()} />;
  const g = groupBookings(bookings.data ?? []);
  const toReview = g.past.filter((b) => b.status === "completed" && !b.reviewed);

  return (
    <>
      <PageHeader
        title={`Hi ${user?.name.split(" ")[0]}`}
        description="Your lessons at a glance."
        action={
          <Button asChild>
            <Link to="/tutors">
              <Search /> Find a tutor
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Upcoming lessons" value={g.upcoming.length} />
        <StatTile label="Waiting for a tutor" value={g.requests.length} />
        <StatTile label="Lessons completed" value={g.past.filter((b) => b.status === "completed").length} />
      </div>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-ink">Coming up</h2>
        <LessonList role="student" bookings={[...g.upcoming, ...g.requests].slice(0, 4)} empty="Nothing booked yet. Find a tutor below." />
      </section>

      {toReview.length > 0 && (
        <section className="mt-10 space-y-3">
          <h2 className="text-lg font-semibold text-ink">How did it go?</h2>
          <LessonList role="student" bookings={toReview} empty="" />
        </section>
      )}

      <section className="mt-10 surface p-6">
        <h2 className="text-lg font-semibold text-ink">Need help with something new?</h2>
        <p className="mb-4 mt-1 text-sm text-muted-foreground">Describe it and AI will suggest tutors.</p>
        <MatchBox />
      </section>
    </>
  );
}

export function StudentBookingsPage() {
  const bookings = useMyBookings();
  if (bookings.isLoading) return <Loading />;
  if (bookings.error) return <ErrorNotice error={bookings.error} onRetry={() => bookings.refetch()} />;
  const g = groupBookings(bookings.data ?? []);

  return (
    <>
      <PageHeader title="Lessons" description="Join a lesson up to 15 minutes before it starts." />
      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({g.upcoming.length + g.awaitingCompletion.length})</TabsTrigger>
          <TabsTrigger value="requests">Requests ({g.requests.length})</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4">
          <LessonList role="student" bookings={[...g.awaitingCompletion, ...g.upcoming]} empty="No confirmed lessons coming up." />
        </TabsContent>
        <TabsContent value="requests" className="mt-4">
          <LessonList role="student" bookings={g.requests} empty="No requests waiting for a tutor." />
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          <LessonList role="student" bookings={g.past} empty="No past lessons yet." />
        </TabsContent>
      </Tabs>
      {!bookings.data?.length && (
        <div className="mt-6 text-center">
          <Button asChild>
            <Link to="/tutors">
              <CalendarDays /> Book your first lesson
            </Link>
          </Button>
        </div>
      )}
    </>
  );
}
