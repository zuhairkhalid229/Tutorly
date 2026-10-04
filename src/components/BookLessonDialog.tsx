import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isSameDay } from "date-fns";
import { CalendarClock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorNotice } from "@/components/common";
import { useAuth } from "@/contexts/AuthContext";
import { requestBooking } from "@/services/bookings";
import { getBusySlots, type TutorDetail } from "@/services/tutors";
import { browserTimeZone, buildSlots, type Slot } from "@/lib/time";
import { money } from "@/lib/format";
import { errorMessage } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const DURATIONS = [30, 60, 90];
const DAYS_AHEAD = 21;

function Choice({ active, onClick, children, className }: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-lg border px-3 py-2 text-sm font-medium transition",
        active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/50",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function BookLessonDialog({ tutor }: { tutor: TutorDetail }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(tutor.subjects[0] ?? "");
  const [duration, setDuration] = useState(60);
  const [day, setDay] = useState<Date | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [notes, setNotes] = useState("");

  const busy = useQuery({
    queryKey: ["busy", tutor.id],
    queryFn: () => getBusySlots(tutor.id, new Date(), new Date(Date.now() + DAYS_AHEAD * 86_400_000)),
    enabled: open,
  });

  const slots = useMemo(
    () =>
      busy.data
        ? buildSlots({
            availability: tutor.availability ?? {},
            tutorTimeZone: tutor.timezone,
            durationMinutes: duration,
            busy: busy.data,
            days: DAYS_AHEAD,
          })
        : [],
    [busy.data, tutor.availability, tutor.timezone, duration],
  );

  const days = useMemo(() => {
    const out: Date[] = [];
    for (const s of slots) if (!out.some((d) => isSameDay(d, s.start))) out.push(s.start);
    return out;
  }, [slots]);
  const activeDay = day && days.some((d) => isSameDay(d, day)) ? day : days[0] ?? null;
  const daySlots = activeDay ? slots.filter((s) => isSameDay(s.start, activeDay)) : [];

  const book = useMutation({
    mutationFn: () => requestBooking({ tutorId: tutor.id, subject, start: slot!.start, end: slot!.end, notes }),
    onSuccess: () => {
      toast.success("Request sent", { description: `${tutor.full_name} will confirm or decline it.` });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setOpen(false);
      navigate("/student/bookings");
    },
    onError: (err) => {
      toast.error(errorMessage(err));
      busy.refetch();
      setSlot(null);
    },
  });

  const onOpenChange = (next: boolean) => {
    if (next && !user) {
      navigate(`/login?next=/tutors/${tutor.id}`);
      return;
    }
    setOpen(next);
  };

  const price = ((tutor.hourly_rate ?? 0) * duration) / 60;
  const canBook = user?.role === "student";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full">
          <CalendarClock /> Book a lesson
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Book a lesson with {tutor.full_name}</DialogTitle>
          <DialogDescription>
            Times are in your timezone ({browserTimeZone()}). {tutor.full_name.split(" ")[0]} confirms each request.
          </DialogDescription>
        </DialogHeader>

        {!canBook ? (
          <p className="rounded-xl bg-muted p-4 text-sm">
            Only student accounts can book lessons. Sign in with the demo student, or create a student account.
          </p>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Subject</Label>
              <div className="flex flex-wrap gap-2">
                {tutor.subjects.map((s) => (
                  <Choice key={s} active={s === subject} onClick={() => setSubject(s)}>
                    {s}
                  </Choice>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Length</Label>
              <div className="flex gap-2">
                {DURATIONS.map((d) => (
                  <Choice key={d} active={d === duration} onClick={() => { setDuration(d); setSlot(null); }}>
                    {d} min
                  </Choice>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Day and time</Label>
              {busy.isLoading ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Checking availability…
                </div>
              ) : busy.error ? (
                <ErrorNotice error={busy.error} onRetry={() => busy.refetch()} />
              ) : days.length === 0 ? (
                <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
                  No open times in the next three weeks. Send {tutor.full_name.split(" ")[0]} a message to arrange one.
                </p>
              ) : (
                <>
                  <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                    {days.map((d) => (
                      <Choice
                        key={d.toISOString()}
                        active={!!activeDay && isSameDay(d, activeDay)}
                        onClick={() => { setDay(d); setSlot(null); }}
                        className="flex min-w-[64px] flex-col items-center py-1.5"
                      >
                        <span className="text-xs opacity-80">{format(d, "EEE")}</span>
                        <span className="text-base font-bold">{format(d, "d")}</span>
                        <span className="text-[11px] opacity-80">{format(d, "MMM")}</span>
                      </Choice>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {daySlots.map((s) => (
                      <Choice key={s.start.toISOString()} active={slot?.start.getTime() === s.start.getTime()} onClick={() => setSlot(s)}>
                        {format(s.start, "HH:mm")}
                      </Choice>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">What would you like to cover? (optional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} rows={3}
                placeholder="Topics, exam board, anything you're stuck on" />
            </div>

            <div className="flex flex-col gap-3 rounded-xl bg-muted p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm">
                {slot ? (
                  <span className="font-semibold">{format(slot.start, "EEEE d MMMM, HH:mm")}–{format(slot.end, "HH:mm")}</span>
                ) : (
                  <span className="text-muted-foreground">Pick a time</span>
                )}
                <div className="text-muted-foreground">
                  {money(price)} · paid to the tutor directly. Tutorly takes no payments in this demo.
                </div>
              </div>
              <Button disabled={!slot || !subject || book.isPending} onClick={() => book.mutate()}>
                {book.isPending && <Loader2 className="animate-spin" />}
                Send request
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
