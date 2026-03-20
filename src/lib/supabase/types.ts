export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string;
          avatar_url: string | null;
          phone: string | null;
          locale: string;
          is_seller_approved: boolean;
          active_view: "user" | "seller";
          onboarding_completed_at: string | null;
          lat: number | null;
          lng: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email: string;
          avatar_url?: string | null;
          phone?: string | null;
          locale?: string;
          is_seller_approved?: boolean;
          active_view?: "user" | "seller";
          onboarding_completed_at?: string | null;
          lat?: number | null;
          lng?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string;
          avatar_url?: string | null;
          phone?: string | null;
          locale?: string;
          is_seller_approved?: boolean;
          active_view?: "user" | "seller";
          onboarding_completed_at?: string | null;
          lat?: number | null;
          lng?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      seller_applications: {
        Row: {
          id: string;
          user_id: string;
          status: "pending" | "approved" | "rejected";
          business_name: string;
          phone: string;
          address: string;
          lat: number | null;
          lng: number | null;
          bio: string | null;
          profile_photo_url: string | null;
          cover_photo_url: string | null;
          accepted_fee_terms: boolean;
          admin_note: string | null;
          reviewed_by: string | null;
          created_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: "pending" | "approved" | "rejected";
          business_name: string;
          phone: string;
          address: string;
          lat?: number | null;
          lng?: number | null;
          bio?: string | null;
          profile_photo_url?: string | null;
          cover_photo_url?: string | null;
          accepted_fee_terms?: boolean;
          admin_note?: string | null;
          reviewed_by?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: "pending" | "approved" | "rejected";
          business_name?: string;
          phone?: string;
          address?: string;
          lat?: number | null;
          lng?: number | null;
          bio?: string | null;
          profile_photo_url?: string | null;
          cover_photo_url?: string | null;
          accepted_fee_terms?: boolean;
          admin_note?: string | null;
          reviewed_by?: string | null;
          created_at?: string;
          reviewed_at?: string | null;
        };
        Relationships: [];
      };
      shops: {
        Row: {
          id: string;
          seller_id: string;
          name: string;
          tagline: string | null;
          description: string | null;
          cover_photo_url: string | null;
          profile_photo_url: string | null;
          lat: number | null;
          lng: number | null;
          address: string | null;
          is_active: boolean;
          supports_delivery: boolean;
          delivery_radius_km: number | null;
          delivery_est_minutes: number | null;
          delivery_fee: number;
          delivery_notes: string | null;
          weekly_hours: Json;
          hour_exceptions: Json;
          suspended_at: string | null;
          suspension_reason: string | null;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          name: string;
          tagline?: string | null;
          description?: string | null;
          cover_photo_url?: string | null;
          profile_photo_url?: string | null;
          lat?: number | null;
          lng?: number | null;
          address?: string | null;
          is_active?: boolean;
          supports_delivery?: boolean;
          delivery_radius_km?: number | null;
          delivery_est_minutes?: number | null;
          delivery_fee?: number;
          delivery_notes?: string | null;
          weekly_hours?: Json;
          hour_exceptions?: Json;
          suspended_at?: string | null;
          suspension_reason?: string | null;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          name?: string;
          tagline?: string | null;
          description?: string | null;
          cover_photo_url?: string | null;
          profile_photo_url?: string | null;
          lat?: number | null;
          lng?: number | null;
          address?: string | null;
          is_active?: boolean;
          supports_delivery?: boolean;
          delivery_radius_km?: number | null;
          delivery_est_minutes?: number | null;
          delivery_fee?: number;
          delivery_notes?: string | null;
          weekly_hours?: Json;
          hour_exceptions?: Json;
          suspended_at?: string | null;
          suspension_reason?: string | null;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      seller_payment_methods: {
        Row: {
          id: string;
          shop_id: string;
          method: "bit" | "paybox" | "cash" | "other";
          is_enabled: boolean;
          notes: string | null;
        };
        Insert: {
          id?: string;
          shop_id: string;
          method: "bit" | "paybox" | "cash" | "other";
          is_enabled?: boolean;
          notes?: string | null;
        };
        Update: {
          id?: string;
          shop_id?: string;
          method?: "bit" | "paybox" | "cash" | "other";
          is_enabled?: boolean;
          notes?: string | null;
        };
        Relationships: [];
      };
      items: {
        Row: {
          id: string;
          shop_id: string;
          name: string;
          description: string | null;
          base_price: number;
          is_vegan: boolean;
          allergens: string[];
          is_available_now: boolean;
          supply_estimate: string | null;
          stock: number | null;
          sort_order: number;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          name: string;
          description?: string | null;
          base_price: number;
          is_vegan?: boolean;
          allergens?: string[];
          is_available_now?: boolean;
          supply_estimate?: string | null;
          stock?: number | null;
          sort_order?: number;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          name?: string;
          description?: string | null;
          base_price?: number;
          is_vegan?: boolean;
          allergens?: string[];
          is_available_now?: boolean;
          supply_estimate?: string | null;
          stock?: number | null;
          sort_order?: number;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      item_photos: {
        Row: {
          id: string;
          item_id: string;
          url: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          item_id: string;
          url: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          item_id?: string;
          url?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      item_portions: {
        Row: {
          id: string;
          item_id: string;
          label: string;
          price_delta: number;
        };
        Insert: {
          id?: string;
          item_id: string;
          label: string;
          price_delta?: number;
        };
        Update: {
          id?: string;
          item_id?: string;
          label?: string;
          price_delta?: number;
        };
        Relationships: [];
      };
      item_availability: {
        Row: {
          id: string;
          item_id: string;
          type: "daily" | "custom";
          day_of_week: number | null;
          start_time: string | null;
          end_time: string | null;
          specific_date: string | null;
        };
        Insert: {
          id?: string;
          item_id: string;
          type: "daily" | "custom";
          day_of_week?: number | null;
          start_time?: string | null;
          end_time?: string | null;
          specific_date?: string | null;
        };
        Update: {
          id?: string;
          item_id?: string;
          type?: "daily" | "custom";
          day_of_week?: number | null;
          start_time?: string | null;
          end_time?: string | null;
          specific_date?: string | null;
        };
        Relationships: [];
      };
      item_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          consumer_id: string;
          shop_id: string;
          item_id: string;
          portion_id: string | null;
          status:
            | "requested"
            | "accepted"
            | "rejected"
            | "paid"
            | "delivered"
            | "cancelled";
          note: string | null;
          preferred_pickup_time: string | null;
          wants_delivery: boolean;
          coupon_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          consumer_id: string;
          shop_id: string;
          item_id: string;
          portion_id?: string | null;
          status?:
            | "requested"
            | "accepted"
            | "rejected"
            | "paid"
            | "delivered"
            | "cancelled";
          note?: string | null;
          preferred_pickup_time?: string | null;
          wants_delivery?: boolean;
          coupon_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          consumer_id?: string;
          shop_id?: string;
          item_id?: string;
          portion_id?: string | null;
          status?:
            | "requested"
            | "accepted"
            | "rejected"
            | "paid"
            | "delivered"
            | "cancelled";
          note?: string | null;
          preferred_pickup_time?: string | null;
          wants_delivery?: boolean;
          coupon_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_messages: {
        Row: {
          id: string;
          order_id: string;
          sender_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          sender_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          sender_id?: string;
          body?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      ratings: {
        Row: {
          id: string;
          order_id: string;
          from_user_id: string;
          to_user_id: string;
          stars: number;
          app_stars: number;
          item_stars: number;
          comment: string | null;
          feedback_tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          from_user_id: string;
          to_user_id: string;
          stars: number;
          app_stars: number;
          item_stars: number;
          comment?: string | null;
          feedback_tags?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          from_user_id?: string;
          to_user_id?: string;
          stars?: number;
          app_stars?: number;
          item_stars?: number;
          comment?: string | null;
          feedback_tags?: string[];
          created_at?: string;
        };
        Relationships: [];
      };
      seller_monthly_fees: {
        Row: {
          id: string;
          shop_id: string;
          month: string;
          total_order_value: number;
          fee_amount: number;
          status: "pending" | "paid";
          due_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          month: string;
          total_order_value?: number;
          fee_amount?: number;
          status?: "pending" | "paid";
          due_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          month?: string;
          total_order_value?: number;
          fee_amount?: number;
          status?: "pending" | "paid";
          due_date?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      seller_fee_payments: {
        Row: {
          id: string;
          fee_id: string;
          proof_url: string | null;
          paid_at: string;
          verified_by: string | null;
          verified_at: string | null;
        };
        Insert: {
          id?: string;
          fee_id: string;
          proof_url?: string | null;
          paid_at?: string;
          verified_by?: string | null;
          verified_at?: string | null;
        };
        Update: {
          id?: string;
          fee_id?: string;
          proof_url?: string | null;
          paid_at?: string;
          verified_by?: string | null;
          verified_at?: string | null;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          user_id: string;
          item_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          item_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          item_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      support_tickets: {
        Row: {
          id: string;
          order_id: string;
          user_id: string;
          status: "open" | "resolved" | "closed";
          body: string;
          issue_photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          user_id: string;
          status?: "open" | "resolved" | "closed";
          body: string;
          issue_photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          user_id?: string;
          status?: "open" | "resolved" | "closed";
          body?: string;
          issue_photo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          shop_id: string | null;
          item_id: string | null;
          body: string;
          status: "pending" | "reviewed" | "dismissed";
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          shop_id?: string | null;
          item_id?: string | null;
          body: string;
          status?: "pending" | "reviewed" | "dismissed";
          created_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          shop_id?: string | null;
          item_id?: string | null;
          body?: string;
          status?: "pending" | "reviewed" | "dismissed";
          created_at?: string;
        };
        Relationships: [];
      };
      admin_audit_log: {
        Row: {
          id: string;
          actor_id: string;
          action: string;
          entity: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id: string;
          action: string;
          entity: string;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string;
          action?: string;
          entity?: string;
          payload?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      collections: {
        Row: {
          id: string;
          slug: string;
          name: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      collection_items: {
        Row: {
          collection_id: string;
          item_id: string;
          sort_order: number;
        };
        Insert: {
          collection_id: string;
          item_id: string;
          sort_order?: number;
        };
        Update: {
          collection_id?: string;
          item_id?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      coupons: {
        Row: {
          id: string;
          shop_id: string;
          code: string;
          discount_percent: number;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          shop_id: string;
          code: string;
          discount_percent: number;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          shop_id?: string;
          code?: string;
          discount_percent?: number;
          expires_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      order_coupon_redemptions: {
        Row: {
          order_id: string;
          coupon_id: string;
        };
        Insert: {
          order_id: string;
          coupon_id: string;
        };
        Update: {
          order_id?: string;
          coupon_id?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title_he: string | null;
          title_en: string | null;
          body_he: string | null;
          body_en: string | null;
          data: Json;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title_he?: string | null;
          title_en?: string | null;
          body_he?: string | null;
          body_en?: string | null;
          data?: Json;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title_he?: string | null;
          title_en?: string | null;
          body_he?: string | null;
          body_en?: string | null;
          data?: Json;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      active_view: "user" | "seller";
      application_status: "pending" | "approved" | "rejected";
      availability_type: "daily" | "custom";
      fee_status: "pending" | "paid";
      notification_type:
        | "item_available"
        | "order_update"
        | "application_decision"
        | "system";
      order_status:
        | "requested"
        | "accepted"
        | "rejected"
        | "paid"
        | "delivered"
        | "cancelled";
      payment_method: "bit" | "paybox" | "cash" | "other";
      report_status: "pending" | "reviewed" | "dismissed";
      support_ticket_status: "open" | "resolved" | "closed";
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
