import { supabase } from "@/lib/supabase";
import type { Conversation, Message, Profile } from "@/types/database";

export async function getConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase.rpc("get_conversations");
  if (error) throw error;
  return (data ?? []).map((c) => ({ ...c, unread_count: Number(c.unread_count) }));
}

export async function getThread(me: string, other: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(`and(sender_id.eq.${me},receiver_id.eq.${other}),and(sender_id.eq.${other},receiver_id.eq.${me})`)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw error;
  return data ?? [];
}

export async function markThreadRead(me: string, other: string) {
  const { error } = await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("receiver_id", me)
    .eq("sender_id", other)
    .eq("is_read", false);
  if (error) throw error;
}

export async function sendMessage(me: string, to: string, content: string): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert({ sender_id: me, receiver_id: to, content: content.trim() })
    .select()
    .single();
  if (error) {
    if (/row-level security/i.test(error.message)) {
      throw new Error("You can message a tutor directly, or anyone you have a booking with.");
    }
    throw error;
  }
  return data;
}

export async function getPerson(id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, profile_image, role")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Pick<Profile, "id" | "full_name" | "profile_image" | "role"> | null;
}

export async function unreadCount(me: string) {
  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("receiver_id", me)
    .eq("is_read", false);
  if (error) throw error;
  return count ?? 0;
}

/** Calls `onMessage` for every new message sent to or by the user. */
export function subscribeToMessages(me: string, onMessage: (m: Message) => void) {
  const channel = supabase
    .channel(`messages:${me}:${Math.random().toString(36).slice(2)}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${me}` },
      (payload) => onMessage(payload.new as Message))
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `sender_id=eq.${me}` },
      (payload) => onMessage(payload.new as Message))
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
