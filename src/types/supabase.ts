
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          full_name: string
          email: string
          role: 'student' | 'tutor' | 'admin'
          profile_image: string | null
          about: string | null
          education: string | null
          subjects: string[] | null
          is_verified: boolean
          phone: string | null
          rating: number | null
          hourly_rate: number | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          full_name: string
          email: string
          role: 'student' | 'tutor' | 'admin'
          profile_image?: string | null
          about?: string | null
          education?: string | null
          subjects?: string[] | null
          is_verified?: boolean
          phone?: string | null
          rating?: number | null
          hourly_rate?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          full_name?: string
          email?: string
          role?: 'student' | 'tutor' | 'admin'
          profile_image?: string | null
          about?: string | null
          education?: string | null
          subjects?: string[] | null
          is_verified?: boolean
          phone?: string | null
          rating?: number | null
          hourly_rate?: number | null
        }
      }
      bookings: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          student_id: string
          tutor_id: string
          subject: string
          start_time: string
          end_time: string
          status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          notes: string | null
          price: number
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          student_id: string
          tutor_id: string
          subject: string
          start_time: string
          end_time: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          notes?: string | null
          price: number
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          student_id?: string
          tutor_id?: string
          subject?: string
          start_time?: string
          end_time?: string
          status?: 'pending' | 'confirmed' | 'cancelled' | 'completed'
          notes?: string | null
          price?: number
        }
      }
      messages: {
        Row: {
          id: string
          created_at: string
          sender_id: string
          receiver_id: string
          content: string
          is_read: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          sender_id: string
          receiver_id: string
          content: string
          is_read?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          sender_id?: string
          receiver_id?: string
          content?: string
          is_read?: boolean
        }
      }
      payments: {
        Row: {
          id: string
          created_at: string
          payer_id: string
          payee_id: string | null
          amount: number
          payment_method: string
          status: 'pending' | 'completed' | 'refunded' | 'failed'
          booking_id: string | null
          processed_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          payer_id: string
          payee_id?: string | null
          amount: number
          payment_method: string
          status?: 'pending' | 'completed' | 'refunded' | 'failed'
          booking_id?: string | null
          processed_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          payer_id?: string
          payee_id?: string | null
          amount?: number
          status?: 'pending' | 'completed' | 'refunded' | 'failed'
          payment_method?: string
          booking_id?: string | null
          processed_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
