export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          business_id: string
          client_name: string
          client_phone: string
          confirmation_sent: boolean | null
          created_at: string | null
          end_at: string
          id: string
          notes: string | null
          payment_amount_cents: number | null
          payment_expires_at: string | null
          payment_id: string | null
          payment_paid_at: string | null
          payment_required: boolean | null
          payment_status: string | null
          professional_id: string | null
          reminder_sent: boolean | null
          service_id: string | null
          start_at: string
          status: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          client_name: string
          client_phone: string
          confirmation_sent?: boolean | null
          created_at?: string | null
          end_at: string
          id?: string
          notes?: string | null
          payment_amount_cents?: number | null
          payment_expires_at?: string | null
          payment_id?: string | null
          payment_paid_at?: string | null
          payment_required?: boolean | null
          payment_status?: string | null
          professional_id?: string | null
          reminder_sent?: boolean | null
          service_id?: string | null
          start_at: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          client_name?: string
          client_phone?: string
          confirmation_sent?: boolean | null
          created_at?: string | null
          end_at?: string
          id?: string
          notes?: string | null
          payment_amount_cents?: number | null
          payment_expires_at?: string | null
          payment_id?: string | null
          payment_paid_at?: string | null
          payment_required?: boolean | null
          payment_status?: string | null
          professional_id?: string | null
          reminder_sent?: boolean | null
          service_id?: string | null
          start_at?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_slots: {
        Row: {
          business_id: string
          created_at: string | null
          end_at: string
          id: string
          professional_id: string | null
          reason: string | null
          start_at: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          end_at: string
          id?: string
          professional_id?: string | null
          reason?: string | null
          start_at: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          end_at?: string
          id?: string
          professional_id?: string | null
          reason?: string | null
          start_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_slots_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_slots_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours: {
        Row: {
          business_id: string
          close_time: string
          day_of_week: number
          id: string
          is_open: boolean | null
          open_time: string
        }
        Insert: {
          business_id: string
          close_time?: string
          day_of_week: number
          id?: string
          is_open?: boolean | null
          open_time?: string
        }
        Update: {
          business_id?: string
          close_time?: string
          day_of_week?: number
          id?: string
          is_open?: boolean | null
          open_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: Json | null
          advance_booking_days: number | null
          booking_enabled: boolean | null
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          lunch_end: string | null
          lunch_start: string | null
          name: string
          owner_id: string | null
          phone_whatsapp: string | null
          pix_charge_type: string | null
          pix_enabled: boolean | null
          pix_holder_name: string | null
          pix_key: string | null
          pix_key_type: string | null
          pix_signal_percent: number | null
          primary_color: string | null
          slot_duration: number | null
          slug: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          advance_booking_days?: number | null
          booking_enabled?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          lunch_end?: string | null
          lunch_start?: string | null
          name: string
          owner_id?: string | null
          phone_whatsapp?: string | null
          pix_charge_type?: string | null
          pix_enabled?: boolean | null
          pix_holder_name?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          pix_signal_percent?: number | null
          primary_color?: string | null
          slot_duration?: number | null
          slug: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          advance_booking_days?: number | null
          booking_enabled?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          lunch_end?: string | null
          lunch_start?: string | null
          name?: string
          owner_id?: string | null
          phone_whatsapp?: string | null
          pix_charge_type?: string | null
          pix_enabled?: boolean | null
          pix_holder_name?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          pix_signal_percent?: number | null
          primary_color?: string | null
          slot_duration?: number | null
          slug?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      client_products: {
        Row: {
          billing_day: number | null
          cancelled_at: string | null
          client_id: string
          created_at: string | null
          id: string
          monthly_price_cents: number
          product: string
          started_at: string | null
          status: string
        }
        Insert: {
          billing_day?: number | null
          cancelled_at?: string | null
          client_id: string
          created_at?: string | null
          id?: string
          monthly_price_cents?: number
          product: string
          started_at?: string | null
          status?: string
        }
        Update: {
          billing_day?: number | null
          cancelled_at?: string | null
          client_id?: string
          created_at?: string | null
          id?: string
          monthly_price_cents?: number
          product?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_products_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          access_blocked: boolean
          business_id: string | null
          created_at: string | null
          id: string
          name: string
          neighborhood: string | null
          notes: string | null
          owner_email: string | null
          owner_name: string | null
          phone: string | null
          segment: string | null
          slug: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          access_blocked?: boolean
          business_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          neighborhood?: string | null
          notes?: string | null
          owner_email?: string | null
          owner_name?: string | null
          phone?: string | null
          segment?: string | null
          slug?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          access_blocked?: boolean
          business_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          neighborhood?: string | null
          notes?: string | null
          owner_email?: string | null
          owner_name?: string | null
          phone?: string | null
          segment?: string | null
          slug?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      hub_admins: {
        Row: {
          created_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          converted_to_client_id: string | null
          created_at: string | null
          id: string
          last_contact_at: string | null
          name: string
          neighborhood: string | null
          notes: string | null
          phone: string | null
          segment: string | null
          source: string | null
          status: string
        }
        Insert: {
          converted_to_client_id?: string | null
          created_at?: string | null
          id?: string
          last_contact_at?: string | null
          name: string
          neighborhood?: string | null
          notes?: string | null
          phone?: string | null
          segment?: string | null
          source?: string | null
          status?: string
        }
        Update: {
          converted_to_client_id?: string | null
          created_at?: string | null
          id?: string
          last_contact_at?: string | null
          name?: string
          neighborhood?: string | null
          notes?: string | null
          phone?: string | null
          segment?: string | null
          source?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_to_client_id_fkey"
            columns: ["converted_to_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          client_id: string
          created_at: string | null
          due_date: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          product_id: string | null
          status: string
        }
        Insert: {
          amount_cents: number
          client_id: string
          created_at?: string | null
          due_date: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          product_id?: string | null
          status?: string
        }
        Update: {
          amount_cents?: number
          client_id?: string
          created_at?: string | null
          due_date?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          product_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "client_products"
            referencedColumns: ["id"]
          },
        ]
      }
      appointment_audit_log: {
        Row: {
          id: string
          appointment_id: string
          changed_by: string | null
          old_status: string | null
          new_status: string | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          appointment_id: string
          changed_by?: string | null
          old_status?: string | null
          new_status?: string | null
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          appointment_id?: string
          changed_by?: string | null
          old_status?: string | null
          new_status?: string | null
          note?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_audit_log_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          }
        ]
      }
      client_sessions: {
        Row: {
          id: string
          business_id: string
          phone: string
          client_name: string
          session_token_hash: string
          created_at: string
          expires_at: string
          last_used_at: string
        }
        Insert: {
          id?: string
          business_id: string
          phone: string
          client_name: string
          session_token_hash: string
          created_at?: string
          expires_at: string
          last_used_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          phone?: string
          client_name?: string
          session_token_hash?: string
          created_at?: string
          expires_at?: string
          last_used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_sessions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          }
        ]
      }
      phone_verifications: {
        Row: {
          attempts: number
          business_id: string
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          token: string | null
          token_used_at: string | null
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          business_id: string
          code: string
          created_at?: string
          expires_at: string
          id?: string
          phone: string
          token?: string | null
          token_used_at?: string | null
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          business_id?: string
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          token?: string | null
          token_used_at?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phone_verifications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_services: {
        Row: {
          professional_id: string
          service_id: string
        }
        Insert: {
          professional_id: string
          service_id: string
        }
        Update: {
          professional_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          avatar_url: string | null
          bio: string | null
          business_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          business_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          business_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "professionals_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          business_id: string
          created_at: string | null
          description: string | null
          display_order: number | null
          duration_min: number
          id: string
          is_active: boolean | null
          name: string
          price_cents: number
        }
        Insert: {
          business_id: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_min?: number
          id?: string
          is_active?: boolean | null
          name: string
          price_cents?: number
        }
        Update: {
          business_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_min?: number
          id?: string
          is_active?: boolean | null
          name?: string
          price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_slot_conflict: {
        Args: {
          p_business_id: string
          p_end_at: string
          p_exclude_id?: string
          p_professional_id: string
          p_start_at: string
        }
        Returns: boolean
      }
      get_booked_slots: {
        Args: {
          p_business_id: string
          p_date: string
          p_professional_id: string
        }
        Returns: {
          end_at: string
          start_at: string
        }[]
      }
      get_business_stats: {
        Args: { p_business_id: string; p_date?: string }
        Returns: {
          appointments_month: number
          appointments_today: number
          appointments_week: number
          attendance_rate: number
        }[]
      }
      book_appointment_atomic: {
        Args: {
          p_business_id: string
          p_service_id: string
          p_professional_id: string | null
          p_client_name: string
          p_client_phone: string
          p_start_at: string
          p_end_at: string
          p_status: string
          p_notes?: string | null
          p_payment_required: boolean
          p_payment_status?: string | null
          p_payment_amount_cents?: number | null
          p_verification_id: string
        }
        Returns: Json
      }
      is_hub_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// ── Named convenience types ───────────────────────────────────────────────────
export type Business      = Tables<"businesses">
export type Service       = Tables<"services">
export type Professional  = Tables<"professionals">
export type BusinessHours = Tables<"business_hours">
export type BlockedSlot   = Tables<"blocked_slots">

export type AppointmentWithRelations = Tables<"appointments"> & {
  service:      Tables<"services">      | null
  professional: Tables<"professionals"> | null
}
