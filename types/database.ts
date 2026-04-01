// TypeScript interfaces mirroring the Supabase database schema

export interface Business {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  primary_color: string;
  address: BusinessAddress | null;
  phone_whatsapp: string | null;
  timezone: string;
  booking_enabled: boolean;
  slot_duration: number; // minutes
  advance_booking_days: number;
  created_at: string;
  updated_at: string;
}

export interface BusinessAddress {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  formatted?: string; // full formatted string
}

export interface BusinessHours {
  id: string;
  business_id: string;
  day_of_week: number; // 0=Sunday, 6=Saturday
  is_open: boolean;
  open_time: string;  // "HH:MM:SS"
  close_time: string; // "HH:MM:SS"
}

export interface Professional {
  id: string;
  business_id: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  duration_min: number;
  price_cents: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface ProfessionalService {
  professional_id: string;
  service_id: string;
}

export interface BlockedSlot {
  id: string;
  business_id: string;
  professional_id: string | null; // null = blocked for all professionals
  start_at: string; // ISO timestamp
  end_at: string;   // ISO timestamp
  reason: string | null;
  created_at: string;
}

export type AppointmentStatus =
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show"
  | "pending";

export interface Appointment {
  id: string;
  business_id: string;
  service_id: string | null;
  professional_id: string | null;
  client_name: string;
  client_phone: string;
  start_at: string; // ISO timestamp
  end_at: string;   // ISO timestamp
  status: AppointmentStatus;
  notes: string | null;
  reminder_sent: boolean;
  confirmation_sent: boolean;
  created_at: string;
  updated_at: string;
}

// Extended types with joined relations
export interface AppointmentWithRelations extends Appointment {
  service?: Service;
  professional?: Professional;
  business?: Business;
}

export interface ProfessionalWithServices extends Professional {
  services?: Service[];
}

// Supabase Database generic type for createClient<Database>
export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: Business;
        Insert: Omit<Business, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Business, "id" | "created_at">>;
      };
      business_hours: {
        Row: BusinessHours;
        Insert: Omit<BusinessHours, "id">;
        Update: Partial<Omit<BusinessHours, "id">>;
      };
      professionals: {
        Row: Professional;
        Insert: Omit<Professional, "id" | "created_at">;
        Update: Partial<Omit<Professional, "id" | "created_at">>;
      };
      services: {
        Row: Service;
        Insert: Omit<Service, "id" | "created_at">;
        Update: Partial<Omit<Service, "id" | "created_at">>;
      };
      professional_services: {
        Row: ProfessionalService;
        Insert: ProfessionalService;
        Update: Partial<ProfessionalService>;
      };
      blocked_slots: {
        Row: BlockedSlot;
        Insert: Omit<BlockedSlot, "id" | "created_at">;
        Update: Partial<Omit<BlockedSlot, "id" | "created_at">>;
      };
      appointments: {
        Row: Appointment;
        Insert: Omit<Appointment, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Appointment, "id" | "created_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_booked_slots: {
        Args: {
          p_business_id: string;
          p_professional_id: string;
          p_date: string;
        };
        Returns: Array<{ start_at: string; end_at: string }>;
      };
    };
    Enums: {
      appointment_status: AppointmentStatus;
    };
  };
}
