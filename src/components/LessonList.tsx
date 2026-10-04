import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, MessageSquare, Star, Video, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, PersonAvatar, StatusBadge } from "@/components/common";
import { isJoinable, setBookingStatus, submitReview, type BookingWithPeople } from "@/services/bookings";
import { durationMinutes, lessonRange, money } from "@/lib/format";
import { errorMessage } from "@/lib/supabase";
import type { BookingStatus } from "@/types/database";
import { cn } from "@/lib/utils";

type Role = "student" | "tutor";

export function LessonList({ bookings, role, empty }: { bookings: BookingWithPeople[]; role: Role; empty: string }) {
  if (!bookings.length) return <EmptyState title={empty} />;
  return (
    <ul className="space-y-3">
      {bookings.map((b) => (
        <LessonRow key={b.id} booking={b} role={role} />
      ))}
    </ul>
  );
}

function LessonRow({ booking: b, role }: { booking: BookingWithPeople; role: Role }) {
  const queryClient = useQueryClient();
  const [reviewing, setReviewing] = useState(false);
  const other = role === "student" ? b.tutor : b.student;
  const now = new Date();
  const started = new Date(b.start_time) <= now;

  const status = useMutation({
    mutationFn: (s: BookingStatus) => setBookingStatus(b.id, s),
    onSuccess: (_, s) => {
      const messages: Record<string, string> = {
        confirmed: "Lesson confirmed",
        declined: "Request declined",
        cancelled: "Lesson cancelled",
        completed: "Marked as completed",
      };
      toast.success(messages[s]);
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const busy = status.isPending;
  const act = (s: BookingStatus, label: string, opts: { variant?: "default" | "outline" | "ghost"; icon?: React.ReactNode; confirm?: string } = {}) => (
    <Button
      size="sm"
      variant={opts.variant ?? "outline"}
      disabled={busy}
      onClick={() => {
        if (!opts.confirm || window.confirm(opts.confirm)) status.mutate(s);
      }}
    >
      {busy && status.variables === s ? <Loader2 className="animate-spin" /> : opts.icon}
      {label}
    </Button>
  );

  const actions: React.ReactNode[] = [];
  if (isJoinable(b, now)) {
    actions.push(
      <Button key="join" size="sm" asChild>
        <Link to={`/lesson/${b.id}`}>
          <Video /> Join lesson
        </Link>
      </Button>,
    );
  }
  if (role === "tutor" && b.status === "pending" && !started) {
    actions.push(
      <span key="accept">{act("confirmed", "Accept", { variant: "default", icon: <Check /> })}</span>,
      <span key="decline">{act("declined", "Decline", { icon: <X /> })}</span>,
    );
  }
  if (role === "tutor" && b.status === "confirmed" && started) {
    actions.push(<span key="complete">{act("completed", "Mark completed", { variant: "default", icon: <Check /> })}</span>);
  }
  if ((b.status === "pending" || b.status === "confirmed") && !started) {
    actions.push(
      <span key="cancel">
        {act("cancelled", b.status === "pending" && role === "student" ? "Withdraw" : "Cancel", {
          variant: "ghost",
          confirm: "Cancel this lesson? The other person will see it as cancelled.",
        })}
      </span>,
    );
  }
  if (role === "student" && b.status === "completed" && !b.reviewed) {
    actions.push(
      <Button key="review" size="sm" onClick={() => setReviewing(true)}>
        <Star /> Leave a review
      </Button>,
    );
  }

  return (
    <li className="surface p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <PersonAvatar name={other?.full_name} src={other?.profile_image} className="h-11 w-11 text-sm" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-ink">{b.subject}</span>
              <span className="text-muted-foreground">with {other?.full_name ?? "someone"}</span>
              <StatusBadge status={b.status} start={b.start_time} />
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {lessonRange(b.start_time, b.end_time)} · {durationMinutes(b.start_time, b.end_time)} min · {money(b.price)}
            </div>
            {b.notes && <p className="mt-2 line-clamp-2 text-sm text-foreground/80">“{b.notes}”</p>}
          </div>
        </div>
        <div className={cn("flex flex-wrap items-center gap-2 sm:justify-end", !actions.length && "hidden sm:flex")}>
          {actions}
          {other && (
            <Button size="sm" variant="ghost" asChild aria-label={`Message ${other.full_name}`}>
              <Link to={`/${role}/messages?with=${other.id}`}>
                <MessageSquare />
              </Link>
            </Button>
          )}
        </div>
      </div>
      {reviewing && <ReviewDialog booking={b} onClose={() => setReviewing(false)} />}
    </li>
  );
}

function ReviewDialog({ booking, onClose }: { booking: BookingWithPeople; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const review = useMutation({
    mutationFn: () => submitReview(booking.id, rating, comment),
    onSuccess: () => {
      toast.success("Thanks for the review!");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["tutors"] });
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How was your lesson with {booking.tutor?.full_name}?</DialogTitle>
          <DialogDescription>Your review is public, with your first name and last initial.</DialogDescription>
        </DialogHeader>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} stars`} onClick={() => setRating(n)}>
              <Star className={cn("h-8 w-8", n <= rating ? "fill-highlight text-highlight" : "text-muted-foreground/40")} />
            </button>
          ))}
        </div>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} maxLength={1000} placeholder="What helped? What could be better?" />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => review.mutate()} disabled={review.isPending}>
            {review.isPending && <Loader2 className="animate-spin" />} Post review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
