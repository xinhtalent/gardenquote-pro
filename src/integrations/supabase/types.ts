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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_chat_history: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          image_url: string | null
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          image_url?: string | null
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          image_url?: string | null
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_quote_settings: {
        Row: {
          api_endpoint: string | null
          api_key: string
          created_at: string | null
          id: string
          model: string
          provider: string
          system_prompt: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_endpoint?: string | null
          api_key: string
          created_at?: string | null
          id?: string
          model: string
          provider: string
          system_prompt: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_endpoint?: string | null
          api_key?: string
          created_at?: string | null
          id?: string
          model?: string
          provider?: string
          system_prompt?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          phone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      global_settings: {
        Row: {
          app_name: string | null
          company_address: string | null
          company_contact: string | null
          company_email: string | null
          company_logo_url: string | null
          company_name: string | null
          company_tagline: string | null
          company_tax_code: string | null
          company_website: string | null
          created_at: string
          dashboard_description: string | null
          dashboard_title: string | null
          id: string
          library_description: string | null
          library_title: string | null
          payment_emojis: string[] | null
          quote_code_format: string | null
          quote_notes: string | null
          updated_at: string
        }
        Insert: {
          app_name?: string | null
          company_address?: string | null
          company_contact?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_tagline?: string | null
          company_tax_code?: string | null
          company_website?: string | null
          created_at?: string
          dashboard_description?: string | null
          dashboard_title?: string | null
          id?: string
          library_description?: string | null
          library_title?: string | null
          payment_emojis?: string[] | null
          quote_code_format?: string | null
          quote_notes?: string | null
          updated_at?: string
        }
        Update: {
          app_name?: string | null
          company_address?: string | null
          company_contact?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_tagline?: string | null
          company_tax_code?: string | null
          company_website?: string | null
          created_at?: string
          dashboard_description?: string | null
          dashboard_title?: string | null
          id?: string
          library_description?: string | null
          library_title?: string | null
          payment_emojis?: string[] | null
          quote_code_format?: string | null
          quote_notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          category: string
          created_at: string
          id: string
          image_url: string | null
          mode: string
          name: string
          pot_type: string | null
          price: number
          sku: string | null
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          image_url?: string | null
          mode?: string
          name: string
          pot_type?: string | null
          price: number
          sku?: string | null
          unit: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          mode?: string
          name?: string
          pot_type?: string | null
          price?: number
          sku?: string | null
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pot_pricing_settings: {
        Row: {
          created_at: string
          id: string
          min_charge: number
          multiplier_aquarium: number
          multiplier_baki: number
          multiplier_curved: number
          multiplier_fence: number
          multiplier_fiberglass: number
          multiplier_landscape: number
          multiplier_regular_high: number
          multiplier_regular_low: number
          multiplier_regular_mid: number
          price_08cm: number
          price_10cm: number
          price_12cm: number
          price_15cm: number
          price_17cm: number
          rounding_mode: string
          threshold_high: number
          threshold_low: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          min_charge?: number
          multiplier_aquarium?: number
          multiplier_baki?: number
          multiplier_curved?: number
          multiplier_fence?: number
          multiplier_fiberglass?: number
          multiplier_landscape?: number
          multiplier_regular_high?: number
          multiplier_regular_low?: number
          multiplier_regular_mid?: number
          price_08cm?: number
          price_10cm?: number
          price_12cm?: number
          price_15cm?: number
          price_17cm?: number
          rounding_mode?: string
          threshold_high?: number
          threshold_low?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          min_charge?: number
          multiplier_aquarium?: number
          multiplier_baki?: number
          multiplier_curved?: number
          multiplier_fence?: number
          multiplier_fiberglass?: number
          multiplier_landscape?: number
          multiplier_regular_high?: number
          multiplier_regular_low?: number
          multiplier_regular_mid?: number
          price_08cm?: number
          price_10cm?: number
          price_12cm?: number
          price_15cm?: number
          price_17cm?: number
          rounding_mode?: string
          threshold_high?: number
          threshold_low?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          discount_percent: number | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_sequence_number: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          discount_percent?: number | null
          email?: string | null
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
          user_sequence_number?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          discount_percent?: number | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_sequence_number?: number | null
        }
        Relationships: []
      }
      quote_items: {
        Row: {
          category_order: number | null
          created_at: string
          dimension_1: number | null
          dimension_2: number | null
          dimension_unit_1: string | null
          dimension_unit_2: string | null
          id: string
          item_id: string
          item_order: number | null
          quantity: number
          quote_id: string
          total_price: number
          unit_price: number
          variant_color: string | null
          variant_height: number | null
          variant_layers: number | null
          variant_length: number | null
          variant_thickness: number | null
          variant_width: number | null
        }
        Insert: {
          category_order?: number | null
          created_at?: string
          dimension_1?: number | null
          dimension_2?: number | null
          dimension_unit_1?: string | null
          dimension_unit_2?: string | null
          id?: string
          item_id: string
          item_order?: number | null
          quantity: number
          quote_id: string
          total_price: number
          unit_price: number
          variant_color?: string | null
          variant_height?: number | null
          variant_layers?: number | null
          variant_length?: number | null
          variant_thickness?: number | null
          variant_width?: number | null
        }
        Update: {
          category_order?: number | null
          created_at?: string
          dimension_1?: number | null
          dimension_2?: number | null
          dimension_unit_1?: string | null
          dimension_unit_2?: string | null
          id?: string
          item_id?: string
          item_order?: number | null
          quantity?: number
          quote_id?: string
          total_price?: number
          unit_price?: number
          variant_color?: string | null
          variant_height?: number | null
          variant_layers?: number | null
          variant_length?: number | null
          variant_thickness?: number | null
          variant_width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          confirmed_at: string | null
          created_at: string
          customer_id: string
          date: string
          discount_percent: number | null
          id: string
          notes: string | null
          payment_account_name: string | null
          payment_account_number: string | null
          payment_bank_name: string | null
          quote_code: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string
          vat_percent: number | null
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          customer_id: string
          date?: string
          discount_percent?: number | null
          id?: string
          notes?: string | null
          payment_account_name?: string | null
          payment_account_number?: string | null
          payment_bank_name?: string | null
          quote_code: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
          vat_percent?: number | null
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          customer_id?: string
          date?: string
          discount_percent?: number | null
          id?: string
          notes?: string | null
          payment_account_name?: string | null
          payment_account_number?: string | null
          payment_bank_name?: string | null
          quote_code?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
          vat_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          app_name: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          company_address: string | null
          company_contact: string | null
          company_email: string | null
          company_logo_url: string | null
          company_name: string | null
          company_tagline: string | null
          company_tax_code: string | null
          company_website: string | null
          created_at: string
          creator_name: string | null
          creator_phone: string | null
          creator_position: string | null
          id: string
          updated_at: string
          user_id: string
          vietqr_account_name: string | null
          vietqr_account_number: string | null
          vietqr_bank_id: string | null
        }
        Insert: {
          app_name?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          company_address?: string | null
          company_contact?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_tagline?: string | null
          company_tax_code?: string | null
          company_website?: string | null
          created_at?: string
          creator_name?: string | null
          creator_phone?: string | null
          creator_position?: string | null
          id?: string
          updated_at?: string
          user_id: string
          vietqr_account_name?: string | null
          vietqr_account_number?: string | null
          vietqr_bank_id?: string | null
        }
        Update: {
          app_name?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          company_address?: string | null
          company_contact?: string | null
          company_email?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_tagline?: string | null
          company_tax_code?: string | null
          company_website?: string | null
          created_at?: string
          creator_name?: string | null
          creator_phone?: string | null
          creator_position?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          vietqr_account_name?: string | null
          vietqr_account_number?: string | null
          vietqr_bank_id?: string | null
        }
        Relationships: []
      }
      units: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webauthn_challenges: {
        Row: {
          challenge: string
          created_at: string
          email: string
          id: string
          type: string
        }
        Insert: {
          challenge: string
          created_at?: string
          email: string
          id?: string
          type: string
        }
        Update: {
          challenge?: string
          created_at?: string
          email?: string
          id?: string
          type?: string
        }
        Relationships: []
      }
      webauthn_credentials: {
        Row: {
          counter: number
          created_at: string
          credential_id: string
          email: string
          id: string
          public_key: string
          transports: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          counter?: number
          created_at?: string
          credential_id: string
          email: string
          id?: string
          public_key: string
          transports?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          counter?: number
          created_at?: string
          credential_id?: string
          email?: string
          id?: string
          public_key?: string
          transports?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_expire_pending_quotes: { Args: never; Returns: undefined }
      cleanup_expired_challenges: { Args: never; Returns: undefined }
      generate_item_sku: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "agent"
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
    Enums: {
      app_role: ["admin", "agent"],
    },
  },
} as const
