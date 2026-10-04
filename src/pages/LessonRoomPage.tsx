import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { ArrowLeft, Check, Eraser, Loader2, Pencil, Send, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState, Loading, PersonAvatar } from "@/components/common";
import { useAuth } from "@/contexts/AuthContext";
import { getBooking, setBookingStatus } from "@/services/bookings";
import { getThread, sendMessage, subscribeToMessages } from "@/services/messages";
import { errorMessage, supabase } from "@/lib/supabase";
import { lessonRange } from "@/lib/format";
import { cn } from "@/lib/utils";

type Point = [number, number]; // 0..1, so both screens agree whatever their size
interface Stroke {
  id: string;
  color: string;
  width: number;
  points: Point[];
}
type BoardEvent =
  | { type: "points"; id: string; color: string; width: number; points: Point[] }
  | { type: "clear" }
  | { type: "hello" }
  | { type: "state"; strokes: Stroke[] };

const COLORS = ["#101828", "#0b6b52", "#d92d20", "#1570ef", "#f5a524"];
const ERASER = "#ffffff";

export default function LessonRoomPage() {
  const { bookingId = "" } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const booking = useQuery({ queryKey: ["booking", bookingId], queryFn: () => getBooking(bookingId), enabled: !!user });
  const [present, setPresent] = useState<string[]>([]);

  const complete = useMutation({
    mutationFn: () => setBookingStatus(bookingId, "completed"),
    onSuccess: () => {
      toast.success("Lesson marked completed");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      navigate("/tutor/bookings");
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  if (booking.isLoading || !user) return <Loading className="h-screen" />;
  const b = booking.data;
  if (!b || !["confirmed", "completed"].includes(b.status)) {
    return (
      <div className="mx-auto max-w-md p-10">
        <EmptyState title="This lesson room isn't open">
          The lesson may have been cancelled, or it isn't yours.{" "}
          <Link to={`/${user.role}/bookings`} className="font-semibold text-primary">
            Back to your lessons
          </Link>
        </EmptyState>
      </div>
    );
  }

  const isTutor = user.id === b.tutor_id;
  const other = isTutor ? b.student : b.tutor;
  const started = new Date(b.start_time) <= new Date();
  // Jitsi room names are public, so derive one nobody can guess without the booking id.
  const videoUrl = `https://meet.jit.si/Tutorly-${b.id.replace(/-/g, "")}`;

  return (
    <div className="flex h-screen flex-col bg-muted/40">
      <header className="flex flex-wrap items-center gap-3 border-b bg-card px-4 py-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/${user.role}/bookings`}>
            <ArrowLeft /> Lessons
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold text-ink">
            {b.subject} with {other?.full_name}
          </div>
          <div className="text-xs text-muted-foreground">{lessonRange(b.start_time, b.end_time)}</div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
          <span className={cn("h-2 w-2 rounded-full", present.includes(other?.id ?? "") ? "bg-emerald-500" : "bg-slate-300")} />
          {present.includes(other?.id ?? "") ? `${other?.full_name.split(" ")[0]} is here` : `Waiting for ${other?.full_name.split(" ")[0]}`}
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={videoUrl} target="_blank" rel="noreferrer">
            <Video /> Video call
          </a>
        </Button>
        {isTutor && b.status === "confirmed" && started && (
          <Button size="sm" onClick={() => complete.mutate()} disabled={complete.isPending}>
            {complete.isPending ? <Loader2 className="animate-spin" /> : <Check />} Finish lesson
          </Button>
        )}
      </header>

      <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[1fr_320px]">
        <Whiteboard roomId={b.id} userId={user.id} onPresence={setPresent} />
        <LessonChat me={user.id} other={other!} />
      </div>
    </div>
  );
}

function Whiteboard({ roomId, userId, onPresence }: { roomId: string; userId: string; onPresence: (ids: string[]) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const strokes = useRef(new Map<string, Stroke>());
  const channel = useRef<RealtimeChannel | null>(null);
  const pending = useRef<{ stroke: Stroke; points: Point[] } | null>(null);
  const drawing = useRef<Stroke | null>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");

  const paint = useCallback((stroke: Stroke, from = 0) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || stroke.points.length < 1) return;
    const { width, height } = canvas;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width * (width / 1000);
    ctx.beginPath();
    const start = stroke.points[Math.max(0, from - 1)];
    ctx.moveTo(start[0] * width, start[1] * height);
    for (let i = Math.max(1, from); i < stroke.points.length; i++) ctx.lineTo(stroke.points[i][0] * width, stroke.points[i][1] * height);
    if (stroke.points.length === 1) ctx.lineTo(start[0] * width + 0.1, start[1] * height);
    ctx.stroke();
  }, []);

  const repaint = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    strokes.current.forEach((s) => paint(s));
  }, [paint]);

  // Keep the canvas sharp at any size, keeping a 16:10 board.
  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = wrap.clientWidth;
      const h = Math.min(wrap.clientHeight, w / 1.6);
      canvas.style.width = `${Math.min(w, h * 1.6)}px`;
      canvas.style.height = `${h}px`;
      canvas.width = Math.round(Math.min(w, h * 1.6) * dpr);
      canvas.height = Math.round(h * dpr);
      repaint();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [repaint]);

  // Realtime: broadcast strokes as they're drawn; presence shows who's in the room.
  // Booking ids are random UUIDs, so only the two participants know the channel name.
  useEffect(() => {
    const ch = supabase.channel(`lesson:${roomId}`, { config: { broadcast: { self: false }, presence: { key: userId } } });
    ch.on("broadcast", { event: "board" }, ({ payload }) => {
      const e = payload as BoardEvent;
      if (e.type === "points") {
        const s = strokes.current.get(e.id) ?? { id: e.id, color: e.color, width: e.width, points: [] };
        const from = s.points.length;
        s.points.push(...e.points);
        strokes.current.set(e.id, s);
        paint(s, from);
      } else if (e.type === "clear") {
        strokes.current.clear();
        repaint();
      } else if (e.type === "hello" && strokes.current.size) {
        ch.send({ type: "broadcast", event: "board", payload: { type: "state", strokes: [...strokes.current.values()] } });
      } else if (e.type === "state") {
        for (const s of e.strokes) if (!strokes.current.has(s.id)) strokes.current.set(s.id, s);
        repaint();
      }
    });
    ch.on("presence", { event: "sync" }, () => onPresence(Object.keys(ch.presenceState())));
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        ch.track({ at: Date.now() });
        ch.send({ type: "broadcast", event: "board", payload: { type: "hello" } });
      }
    });
    channel.current = ch;

    // Send strokes in small batches rather than one message per mouse move.
    const flush = setInterval(() => {
      const p = pending.current;
      if (!p || !p.points.length) return;
      ch.send({ type: "broadcast", event: "board", payload: { type: "points", id: p.stroke.id, color: p.stroke.color, width: p.stroke.width, points: p.points } });
      p.points = [];
    }, 50);

    return () => {
      clearInterval(flush);
      supabase.removeChannel(ch);
    };
  }, [roomId, userId, paint, repaint, onPresence]);

  const point = (e: React.PointerEvent): Point => {
    const r = canvasRef.current!.getBoundingClientRect();
    return [Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))];
  };

  const down = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const s: Stroke = { id: crypto.randomUUID(), color: tool === "eraser" ? ERASER : color, width: tool === "eraser" ? 28 : 4, points: [point(e)] };
    strokes.current.set(s.id, s);
    drawing.current = s;
    pending.current = { stroke: s, points: [...s.points] };
    paint(s);
  };
  const move = (e: React.PointerEvent) => {
    const s = drawing.current;
    if (!s) return;
    const p = point(e);
    s.points.push(p);
    pending.current?.points.push(p);
    paint(s, s.points.length - 1);
  };
  const up = () => {
    drawing.current = null;
  };
  const clear = () => {
    strokes.current.clear();
    repaint();
    channel.current?.send({ type: "broadcast", event: "board", payload: { type: "clear" } });
  };

  return (
    <div className="surface flex min-h-[320px] flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <Button size="sm" variant={tool === "pen" ? "secondary" : "ghost"} onClick={() => setTool("pen")} aria-pressed={tool === "pen"}>
          <Pencil /> Pen
        </Button>
        <Button size="sm" variant={tool === "eraser" ? "secondary" : "ghost"} onClick={() => setTool("eraser")} aria-pressed={tool === "eraser"}>
          <Eraser /> Eraser
        </Button>
        <div className="mx-1 flex gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                setColor(c);
                setTool("pen");
              }}
              aria-label={`Colour ${c}`}
              className={cn("h-6 w-6 rounded-full ring-offset-2", color === c && tool === "pen" && "ring-2 ring-ring")}
              style={{ background: c }}
            />
          ))}
        </div>
        <Button size="sm" variant="ghost" className="ml-auto" onClick={clear}>
          <Trash2 /> Clear
        </Button>
      </div>
      <div ref={wrapRef} className="flex min-h-0 flex-1 items-center justify-center bg-muted/50 p-2">
        <canvas
          ref={canvasRef}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          className="touch-none rounded-lg bg-white shadow-sm"
          style={{ cursor: tool === "eraser" ? "cell" : "crosshair" }}
          aria-label="Shared whiteboard"
        />
      </div>
    </div>
  );
}

function LessonChat({ me, other }: { me: string; other: { id: string; full_name: string; profile_image: string | null } }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const thread = useQuery({ queryKey: ["thread", other.id], queryFn: () => getThread(me, other.id) });

  useEffect(() => subscribeToMessages(me, () => queryClient.invalidateQueries({ queryKey: ["thread", other.id] })), [me, other.id, queryClient]);
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [thread.data?.length]);

  const send = useMutation({
    mutationFn: (content: string) => sendMessage(me, other.id, content),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["thread", other.id] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <div className="surface flex min-h-[280px] flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <PersonAvatar name={other.full_name} src={other.profile_image} className="h-7 w-7 text-xs" />
        <span className="text-sm font-semibold">Chat</span>
        <span className="ml-auto text-xs text-muted-foreground">Saved to Messages</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {thread.data?.slice(-50).map((m) => (
          <div key={m.id} className={cn("flex", m.sender_id === me ? "justify-end" : "justify-start")}>
            <p
              className={cn(
                "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3 py-1.5 text-sm",
                m.sender_id === me ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              {m.content}
            </p>
          </div>
        ))}
        <div ref={bottom} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim()) send.mutate(text);
        }}
        className="flex gap-2 border-t p-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={4000}
          placeholder="Message"
          aria-label="Chat message"
          className="h-9 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <Button size="icon" className="h-9 w-9" disabled={!text.trim() || send.isPending} aria-label="Send">
          <Send />
        </Button>
      </form>
    </div>
  );
}
