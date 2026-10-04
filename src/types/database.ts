// Mirrors supabase/migrations. Regenerate with
//   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
// after changing the schema.
import type { Availability } from "@/lib/time";

export type Role = "student" | "tutor" | "admin";
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "declined";

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  profile_image: string | null;
  about: string | null;
  education: string | null;
  subjects: string[];
  is_verified: boolean;
  rating: number | null;
  review_count: number;
  hourly_rate: number | null;
  availability: Availability;
  timezone: string;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  student_id: string;
  tutor_id: string;
  subject: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  notes: string | null;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  tutor_id: string;
  student_id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface VerificationAttempt {
  id: string;
  tutor_id: string;
  subject: string;
  score: number | null;
  passed: boolean | null;
  model: string | null;
  created_at: string;
  submitted_at: string | null;
}

export interface ContactMessage {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  topic: string;
  message: string;
  handled: boolean;
  created_at: string;
}

export interface Conversation {
  other_id: string;
  full_name: string | null;
  profile_image: string | null;
  role: Role | null;
  last_message: string;
  last_message_at: string;
  last_sender_id: string;
  unread_count: number;
}

export interface AdminStats {
  students: number;
  tutors: number;
  verified_tutors: number;
  bookings: number;
  bookings_last_7_days: number;
  completed_lessons: number;
  tests_taken: number;
  test_pass_rate: number | null;
  open_contact_messages: number;
}

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: {
    foreignKeyName: string;
    columns: string[];
    isOneToOne: boolean;
    referencedRelation: string;
    referencedColumns: string[];
  }[];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<Profile>;
      bookings: Omit<Table<Booking>, "Relationships"> & {
        Relationships: [
          { foreignKeyName: "bookings_student_id_fkey"; columns: ["student_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "bookings_tutor_id_fkey"; columns: ["tutor_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      messages: Table<Message, Pick<Message, "sender_id" | "receiver_id" | "content">>;
      reviews: Table<Review>;
      verification_attempts: Table<VerificationAttempt>;
      contact_messages: Table<ContactMessage, Pick<ContactMessage, "name" | "email" | "topic" | "message">>;
    };
    Views: Record<string, never>;
    Functions: {
      request_booking: {
        Args: { p_tutor_id: string; p_subject: string; p_start: string; p_end: string; p_notes?: string | null };
        Returns: Booking;
      };
      update_booking_status: { Args: { p_booking_id: string; p_status: BookingStatus }; Returns: Booking };
      get_tutor_busy_slots: {
        Args: { p_tutor_id: string; p_from: string; p_to: string };
        Returns: { start_time: string; end_time: string }[];
      };
      submit_review: { Args: { p_booking_id: string; p_rating: number; p_comment?: string | null }; Returns: Review };
      get_conversations: { Args: Record<string, never>; Returns: Conversation[] };
      admin_stats: { Args: Record<string, never>; Returns: AdminStats };
      admin_set_tutor_verified: { Args: { p_tutor_id: string; p_verified: boolean }; Returns: undefined };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
