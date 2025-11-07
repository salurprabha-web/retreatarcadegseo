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
      blog_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          publish_date: string
          seo: Json
          status: string
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          publish_date: string
          seo: Json
          status: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          publish_date?: string
          seo?: Json
          status?: string
          title?: string
        }
        Relationships: []
      }
      content_pages: {
        Row: {
          content: string
          id: string
          seo: Json
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          id: string
          seo: Json
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          id?: string
          seo?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          alt_text: string
          created_at: string
          id: string
          image_url: string
          storage_path: string | null
          title: string
        }
        Insert: {
          alt_text: string
          created_at?: string
          id?: string
          image_url: string
          storage_path?: string | null
          title: string
        }
        Update: {
          alt_text?: string
          created_at?: string
          id?: string
          image_url?: string
          storage_path?: string | null
          title?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          alt_text: string
          background_url: string
          created_at: string
          cta_link: string
          cta_text: string
          duration: number
          headline: string
          id: string
          subheadline: string
          type: string
        }
        Insert: {
          alt_text: string
          background_url: string
          created_at?: string
          cta_link: string
          cta_text: string
          duration: number
          headline: string
          id?: string
          subheadline: string
          type: string
        }
        Update: {
          alt_text?: string
          background_url?: string
          created_at?: string
          cta_link?: string
          cta_text?: string
          duration?: number
          headline?: string
          id?: string
          subheadline?: string
          type?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          ai_analysis: Json | null
          created_at: string
          id: string
          message: string
          received_date: string
          sender_email: string
          sender_name: string
          status: string
          subject: string
        }
        Insert: {
          ai_analysis?: Json | null
          created_at?: string
          id?: string
          message: string
          received_date: string
          sender_email: string
          sender_name: string
          status: string
          subject: string
        }
        Update: {
          ai_analysis?: Json | null
          created_at?: string
          id?: string
          message?: string
          received_date?: string
          sender_email?: string
          sender_name?: string
          status?: string
          subject?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          category: string
          created_at: string
          description: string
          features: string[]
          gallery_image_urls: string[]
          id: string
          image_url: string
          long_description: string
          name: string
          price: number
          related_service_ids: string[]
          seo: Json
          specifications: Json
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          features?: string[]
          gallery_image_urls?: string[]
          id?: string
          image_url: string
          long_description: string
          name: string
          price: number
          related_service_ids?: string[]
          seo: Json
          specifications?: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          features?: string[]
          gallery_image_urls?: string[]
          id?: string
          image_url?: string
          long_description?: string
          name?: string
          price?: number
          related_service_ids?: string[]
          seo?: Json
          specifications?: Json
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          address: string
          business_name: string
          contact_email: string
          id: number
          phone_number: string
          socials: Json
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          address: string
          business_name: string
          contact_email: string
          id?: number
          phone_number: string
          socials: Json
          updated_at?: string
          whatsapp_number: string
        }
        Update: {
          address?: string
          business_name?: string
          contact_email?: string
          id?: number
          phone_number?: string
          socials?: Json
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          client_name: string
          created_at: string
          date: string
          event_type: string
          highlighted_quote: string | null
          id: string
          rating: number
          testimonial_text: string
        }
        Insert: {
          client_name: string
          created_at?: string
          date: string
          event_type: string
          highlighted_quote?: string | null
          id?: string
          rating: number
          testimonial_text: string
        }
        Update: {
          client_name?: string
          created_at?: string
          date?: string
          event_type?: string
          highlighted_quote?: string | null
          id?: string
          rating?: number
          testimonial_text?: string
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
