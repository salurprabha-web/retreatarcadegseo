import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
      roles: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role_id: string | null
          avatar_url: string | null
          is_active: boolean
          two_factor_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          role_id?: string | null
          avatar_url?: string | null
          is_active?: boolean
          two_factor_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role_id?: string | null
          avatar_url?: string | null
          is_active?: boolean
          two_factor_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          slug: string
          summary: string | null
          description: string
          featured_image_id: string | null
          start_date: string | null
          end_date: string | null
          location: string | null
          price: number | null
          duration: string | null
          max_participants: number | null
          status: 'draft' | 'published' | 'archived'
          is_featured: boolean
          view_count: number
          created_by: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          summary?: string | null
          description: string
          featured_image_id?: string | null
          start_date?: string | null
          end_date?: string | null
          location?: string | null
          price?: number | null
          duration?: string | null
          max_participants?: number | null
          status?: 'draft' | 'published' | 'archived'
          is_featured?: boolean
          view_count?: number
          created_by?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          summary?: string | null
          description?: string
          featured_image_id?: string | null
          start_date?: string | null
          end_date?: string | null
          location?: string | null
          price?: number | null
          duration?: string | null
          max_participants?: number | null
          status?: 'draft' | 'published' | 'archived'
          is_featured?: boolean
          view_count?: number
          created_by?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          title: string
          slug: string
          summary: string | null
          description: string
          featured_image_id: string | null
          price_from: number | null
          status: 'draft' | 'published' | 'archived'
          is_featured: boolean
          display_order: number
          created_by: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
      }
      media: {
        Row: {
          id: string
          filename: string
          url: string
          storage_path: string
          mime_type: string
          size: number
          width: number | null
          height: number | null
          alt_text: string | null
          caption: string | null
          tags: string[]
          uploaded_by: string | null
          created_at: string
          updated_at: string
        }
      }
      testimonials: {
        Row: {
          id: string
          client_name: string
          client_company: string | null
          client_avatar_id: string | null
          content: string
          rating: number | null
          event_id: string | null
          service_id: string | null
          status: 'pending' | 'approved' | 'rejected'
          is_featured: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          slug: string
          excerpt: string | null
          content: string
          featured_image_id: string | null
          author_id: string | null
          status: 'draft' | 'published' | 'archived'
          is_featured: boolean
          view_count: number
          published_at: string | null
          created_at: string
          updated_at: string
        }
      }
      inquiries: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          subject: string | null
          message: string
          event_id: string | null
          service_id: string | null
          status: 'new' | 'contacted' | 'converted' | 'closed'
          admin_notes: string | null
          created_at: string
          updated_at: string
        }
      }
      site_settings: {
        Row: {
          id: string
          key: string
          value: Json
          description: string | null
          updated_at: string
        }
      }
    }
  }
}
