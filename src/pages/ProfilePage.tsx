import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, PersonAvatar } from "@/components/common";
import { useAuth } from "@/contexts/AuthContext";
import { updateMyProfile, uploadAvatar, type ProfileUpdate } from "@/services/profile";
import { errorMessage } from "@/lib/supabase";
import { browserTimeZone, isValidTimeZone, toMinutes, WEEKDAYS, type Availability, type TimeRange } from "@/lib/time";

const TIMES = Array.from({ length: 36 }, (_, i) => {
  const m = 6 * 60 + i * 30; // 06:00 to 23:30
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});
const TIMEZONES: string[] = (() => {
  try {
    return (Intl as unknown as { supportedValuesOf(k: string): string[] }).supportedValuesOf("timeZone");
  } catch {
    return ["UTC", "Asia/Karachi", "Europe/London", "America/New_York"];
  }
})();

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ProfileUpdate>({});

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name,
      about: profile.about ?? "",
      education: profile.education ?? "",
      hourly_rate: profile.hourly_rate,
      availability: profile.availability ?? {},
      timezone: profile.timezone === "UTC" ? browserTimeZone() : profile.timezone,
    });
  }, [profile]);

  const save = useMutation({
    mutationFn: (update: ProfileUpdate) => updateMyProfile(profile!.id, update),
    onSuccess: async () => {
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["tutors"] });
      toast.success("Profile saved");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const avatar = useMutation({
    mutationFn: async (file: File) => {
      const url = await uploadAvatar(profile!.id, file);
      return updateMyProfile(profile!.id, { profile_image: url });
    },
    onSuccess: async () => {
      await refreshProfile();
      toast.success("Photo updated");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (!profile) return null;
  const tutor = profile.role === "tutor";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate(form, tutor);
    if (problem) return toast.error(problem);
    const update: ProfileUpdate = {
      full_name: form.full_name?.trim(),
      about: form.about?.trim() || null,
      timezone: form.timezone,
    };
    if (tutor) {
      update.education = form.education?.trim() || null;
      update.hourly_rate = form.hourly_rate;
      update.availability = form.availability;
    }
    save.mutate(update);
  };

  return (
    <>
      <PageHeader title={tutor ? "Profile & hours" : "Profile"} description={user?.email} />
      <form onSubmit={submit} className="space-y-6">
        <section className="surface space-y-5 p-6">
          <div className="flex items-center gap-4">
            <PersonAvatar name={profile.full_name} src={profile.profile_image} className="h-20 w-20 text-xl" />
            <div>
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && avatar.mutate(e.target.files[0])}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()} disabled={avatar.isPending}>
                {avatar.isPending ? <Loader2 className="animate-spin" /> : <Camera />} Change photo
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">PNG, JPEG or WebP, up to 2 MB.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" value={form.full_name ?? ""} maxLength={120} required
                onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={form.timezone ?? "UTC"}
                onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
            {tutor && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="education">Qualification</Label>
                  <Input id="education" value={form.education ?? ""} maxLength={300} placeholder="e.g. MSc Mathematics"
                    onChange={(e) => setForm({ ...form, education: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rate">Hourly rate (USD)</Label>
                  <Input id="rate" type="number" min={5} max={500} step={1} value={form.hourly_rate ?? ""}
                    onChange={(e) => setForm({ ...form, hourly_rate: e.target.value ? Number(e.target.value) : null })} />
                </div>
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="about">{tutor ? "About you and how you teach" : "About you"}</Label>
            <Textarea id="about" rows={5} maxLength={2000} value={form.about ?? ""}
              placeholder={tutor ? "Who you teach, your approach, exam boards you know." : "What you're studying and your goals."}
              onChange={(e) => setForm({ ...form, about: e.target.value })} />
          </div>
        </section>

        {tutor && (
          <section className="surface p-6">
            <h2 className="font-semibold text-ink">Weekly hours</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              In your timezone ({form.timezone}). Students see these converted to theirs, minus anything already booked.
            </p>
            <AvailabilityEditor value={form.availability ?? {}} onChange={(availability) => setForm({ ...form, availability })} />
          </section>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={save.isPending}>
            {save.isPending && <Loader2 className="animate-spin" />} Save changes
          </Button>
        </div>
      </form>
    </>
  );
}

function validate(form: ProfileUpdate, tutor: boolean): string | null {
  if (!form.full_name?.trim()) return "Please enter your name.";
  if (form.timezone && !isValidTimeZone(form.timezone)) return "Please pick a valid timezone.";
  if (tutor) {
    if (form.hourly_rate != null && (form.hourly_rate < 5 || form.hourly_rate > 500)) return "Hourly rate must be between $5 and $500.";
    for (const day of WEEKDAYS) {
      const ranges = [...(form.availability?.[day] ?? [])].sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
      for (let i = 0; i < ranges.length; i++) {
        if (toMinutes(ranges[i].end) <= toMinutes(ranges[i].start)) return `On ${day}, each block must end after it starts.`;
        if (i && toMinutes(ranges[i].start) < toMinutes(ranges[i - 1].end)) return `On ${day}, two blocks overlap.`;
      }
    }
  }
  return null;
}

function AvailabilityEditor({ value, onChange }: { value: Availability; onChange: (v: Availability) => void }) {
  const setDay = (day: (typeof WEEKDAYS)[number], ranges: TimeRange[]) => onChange({ ...value, [day]: ranges });

  return (
    <div className="mt-5 divide-y">
      {WEEKDAYS.map((day) => {
        const ranges = value[day] ?? [];
        const on = ranges.length > 0;
        return (
          <div key={day} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start">
            <label className="flex w-36 items-center gap-3 pt-2 text-sm font-medium capitalize">
              <Switch checked={on} onCheckedChange={(c) => setDay(day, c ? [{ start: "17:00", end: "20:00" }] : [])} />
              {day}
            </label>
            <div className="flex-1 space-y-2">
              {!on && <p className="pt-2 text-sm text-muted-foreground">Unavailable</p>}
              {ranges.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <TimeSelect value={r.start} onChange={(start) => setDay(day, ranges.map((x, j) => (j === i ? { ...x, start } : x)))} label={`${day} start`} />
                  <span className="text-muted-foreground">to</span>
                  <TimeSelect value={r.end} onChange={(end) => setDay(day, ranges.map((x, j) => (j === i ? { ...x, end } : x)))} label={`${day} end`} />
                  <Button type="button" variant="ghost" size="icon" aria-label="Remove block" onClick={() => setDay(day, ranges.filter((_, j) => j !== i))}>
                    <Trash2 />
                  </Button>
                </div>
              ))}
              {on && ranges.length < 3 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDay(day, [...ranges, { start: ranges.at(-1)?.end ?? "09:00", end: TIMES[Math.min(TIMES.length - 1, TIMES.indexOf(ranges.at(-1)?.end ?? "09:00") + 4)] }])}
                >
                  <Plus /> Add a block
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TimeSelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
    >
      {TIMES.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}
