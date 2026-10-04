import { supabase } from "@/lib/supabase";
import type { Availability } from "@/lib/time";
import type { Profile } from "@/types/database";

export async function getMyProfile(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

/** Only these columns are writable by users; the database rejects anything else. */
export interface ProfileUpdate {
  full_name?: string;
  about?: string | null;
  education?: string | null;
  hourly_rate?: number | null;
  availability?: Availability;
  timezone?: string;
  profile_image?: string | null;
}

export async function updateMyProfile(id: string, update: ProfileUpdate): Promise<Profile> {
  const { data, error } = await supabase.from("profiles").update(update).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new Error("Please choose a PNG, JPEG or WebP image.");
  }
  if (file.size > 2 * 1024 * 1024) throw new Error("Please choose an image under 2 MB.");
  const ext = file.type.split("/")[1];
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw error;
  return supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
}
