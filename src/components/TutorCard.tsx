import { Link } from "react-router-dom";
import { money } from "@/lib/format";
import type { TutorSummary } from "@/services/tutors";
import { PersonAvatar, Stars, SubjectChip } from "@/components/common";

export function TutorCard({ tutor, reason }: { tutor: TutorSummary; reason?: string }) {
  return (
    <Link
      to={`/tutors/${tutor.id}`}
      className="surface group flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start gap-3">
        <PersonAvatar name={tutor.full_name} src={tutor.profile_image} className="h-12 w-12 text-base" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate font-semibold text-ink group-hover:text-primary">{tutor.full_name}</h3>
            <span className="shrink-0 font-semibold text-ink">
              {money(tutor.hourly_rate)}
              <span className="text-xs font-normal text-muted-foreground">/hr</span>
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <Stars rating={tutor.rating} count={tutor.review_count} />
            {tutor.education && <span className="truncate text-xs text-muted-foreground">· {tutor.education}</span>}
          </div>
        </div>
      </div>

      {reason ? (
        <p className="mt-4 rounded-lg bg-secondary/70 px-3 py-2 text-sm text-secondary-foreground">{reason}</p>
      ) : (
        <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">{tutor.about || "No bio yet."}</p>
      )}

      <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
        {tutor.subjects.map((s) => (
          <SubjectChip key={s} subject={s} />
        ))}
      </div>
    </Link>
  );
}
