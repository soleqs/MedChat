export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          avatar_url: string | null
          role: 'nurse' | 'doctor' | 'assistant' | 'headNurse'
          phone: string | null
          shift: 'day' | 'night' | 'off'
          social_links: Json
          created_at: string
          updated_at: string
          email: string | null
          hospital_id: string | null
        }
        Insert: {
          id: string
          name: string
          avatar_url?: string | null
          role?: 'nurse' | 'doctor' | 'assistant' | 'headNurse'
          phone?: string | null
          shift?: 'day' | 'night' | 'off'
          social_links?: Json
          created_at?: string
          updated_at?: string
          email?: string | null
          hospital_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          avatar_url?: string | null
          role?: 'nurse' | 'doctor' | 'assistant' | 'headNurse'
          phone?: string | null
          shift?: 'day' | 'night' | 'off'
          social_links?: Json
          created_at?: string
          updated_at?: string
          email?: string | null
          hospital_id?: string | null
        }
      }
      regions: {
        Row: {
          id: string
          name_cs: string
          name_en: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name_cs: string
          name_en: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name_cs?: string
          name_en?: string
          created_at?: string
          updated_at?: string
        }
      }
      hospitals: {
        Row: {
          id: string
          region_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          region_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          region_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      chat_rooms: {
        Row: {
          id: string
          name: string
          type: 'general' | 'nurses' | 'doctors' | 'assistants'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type?: 'general' | 'nurses' | 'doctors' | 'assistants'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'general' | 'nurses' | 'doctors' | 'assistants'
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          room_id: string
          user_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      shifts: {
        Row: {
          id: string
          user_id: string
          date: string
          type: 'day' | 'night' | 'off'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          type: 'day' | 'night' | 'off'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          type?: 'day' | 'night' | 'off'
          created_at?: string
          updated_at?: string
        }
      }
      shift_exchange_requests: {
        Row: {
          id: string
          requester_id: string
          requested_id: string
          shift_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          requester_id: string
          requested_id: string
          shift_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          requester_id?: string
          requested_id?: string
          shift_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}