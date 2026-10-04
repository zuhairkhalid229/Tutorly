import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isToday } from "date-fns";
import { ArrowLeft, Loader2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorNotice, Loading, PageHeader, PersonAvatar } from "@/components/common";
import { useAuth } from "@/contexts/AuthContext";
import { getConversations, getPerson, getThread, markThreadRead, sendMessage } from "@/services/messages";
import { errorMessage } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const stamp = (iso: string) => (isToday(new Date(iso)) ? format(new Date(iso), "HH:mm") : format(new Date(iso), "d MMM"));

export default function MessagesPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const other = params.get("with");
  const conversations = useQuery({ queryKey: ["conversations", user?.id], queryFn: getConversations, enabled: !!user });

  if (!user) return null;
  if (conversations.isLoading) return <Loading />;
  if (conversations.error) return <ErrorNotice error={conversations.error} onRetry={() => conversations.refetch()} />;
  const list = conversations.data ?? [];

  return (
    <>
      <PageHeader title="Messages" />
      <div className="surface grid h-[calc(100vh-220px)] min-h-[480px] overflow-hidden md:grid-cols-[300px_1fr]">
        <aside className={cn("overflow-y-auto border-r", other && "hidden md:block")}>
          {list.length === 0 && !other ? (
            <div className="p-6 text-sm text-muted-foreground">
              No conversations yet.{" "}
              {user.role === "student" && (
                <Link to="/tutors" className="font-semibold text-primary">
                  Find a tutor to message
                </Link>
              )}
            </div>
          ) : (
            <ul>
              {list.map((c) => (
                <li key={c.other_id}>
                  <button
                    onClick={() => setParams({ with: c.other_id })}
                    className={cn(
                      "flex w-full items-center gap-3 border-b px-4 py-3 text-left transition hover:bg-muted/60",
                      other === c.other_id && "bg-secondary/60",
                    )}
                  >
                    <PersonAvatar name={c.full_name} src={c.profile_image} className="h-10 w-10 text-sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn("truncate text-sm", c.unread_count ? "font-bold" : "font-medium")}>{c.full_name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{stamp(c.last_message_at)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-muted-foreground">
                          {c.last_sender_id === user.id && "You: "}
                          {c.last_message}
                        </span>
                        {c.unread_count > 0 && (
                          <span className="rounded-full bg-primary px-1.5 text-[11px] font-bold text-primary-foreground">{c.unread_count}</span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className={cn("flex min-h-0 flex-col", !other && "hidden md:flex")}>
          {other ? (
            <Thread me={user.id} other={other} onBack={() => setParams({})} />
          ) : (
            <div className="m-auto p-6">
              <EmptyState icon={<MessageSquare className="h-5 w-5" />} title="Pick a conversation" />
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function Thread({ me, other, onBack }: { me: string; other: string; onBack: () => void }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const person = useQuery({ queryKey: ["person", other], queryFn: () => getPerson(other) });
  const thread = useQuery({ queryKey: ["thread", other], queryFn: () => getThread(me, other) });

  const unread = thread.data?.some((m) => m.receiver_id === me && !m.is_read);
  useEffect(() => {
    if (!unread) return;
    markThreadRead(me, other).then(() => {
      queryClient.invalidateQueries({ queryKey: ["unread"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    });
  }, [unread, me, other, queryClient]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [thread.data?.length]);

  const send = useMutation({
    mutationFn: (content: string) => sendMessage(me, other, content),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["thread", other] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (text.trim()) send.mutate(text);
  };

  return (
    <>
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <button onClick={onBack} className="rounded-lg p-1.5 hover:bg-muted md:hidden" aria-label="Back to conversations">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <PersonAvatar name={person.data?.full_name} src={person.data?.profile_image} className="h-9 w-9 text-sm" />
        <div>
          <div className="text-sm font-semibold">{person.data?.full_name ?? "…"}</div>
          {person.data?.role === "tutor" && (
            <Link to={`/tutors/${other}`} className="text-xs text-primary hover:underline">
              View profile
            </Link>
          )}
        </div>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto bg-muted/30 px-4 py-4">
        {thread.isLoading && <Loading />}
        {thread.data?.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Say hello. Mention what you'd like help with.</p>
        )}
        {thread.data?.map((m) => {
          const mine = m.sender_id === me;
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                  mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-card",
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className={cn("mt-1 text-right text-[11px]", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  {stamp(m.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      <form onSubmit={submit} className="flex items-end gap-2 border-t p-3">
        <label htmlFor="message" className="sr-only">
          Message
        </label>
        <textarea
          id="message"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          maxLength={4000}
          placeholder="Write a message"
          className="max-h-32 min-h-[40px] flex-1 resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="submit" size="icon" disabled={!text.trim() || send.isPending} aria-label="Send">
          {send.isPending ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </form>
    </>
  );
}
