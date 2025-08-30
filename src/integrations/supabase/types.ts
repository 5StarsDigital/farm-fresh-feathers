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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      accessories: {
        Row: {
          created_at: string
          description: string | null
          effect_type: string | null
          effect_value: number | null
          id: string
          image_url: string | null
          name: string
          price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          effect_type?: string | null
          effect_value?: number | null
          id?: string
          image_url?: string | null
          name: string
          price: number
        }
        Update: {
          created_at?: string
          description?: string | null
          effect_type?: string | null
          effect_value?: number | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      admin_activities: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          description: string
          details: Json | null
          id: string
          target_id: string | null
          target_table: string | null
          updated_at: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          description: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
          updated_at?: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          description?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      available_farms: {
        Row: {
          available_coops: number
          created_at: string
          detailed_content: Json | null
          features: Json | null
          gallery_images: Json | null
          id: string
          image_url: string | null
          location: string
          max_chickens_per_coop: number | null
          min_chickens_per_coop: number | null
          monthly_cost: number
          name: string
          rating: number | null
          rental_price: number
          review_count: number | null
          total_coops: number
          updated_at: string
        }
        Insert: {
          available_coops?: number
          created_at?: string
          detailed_content?: Json | null
          features?: Json | null
          gallery_images?: Json | null
          id?: string
          image_url?: string | null
          location: string
          max_chickens_per_coop?: number | null
          min_chickens_per_coop?: number | null
          monthly_cost: number
          name: string
          rating?: number | null
          rental_price: number
          review_count?: number | null
          total_coops?: number
          updated_at?: string
        }
        Update: {
          available_coops?: number
          created_at?: string
          detailed_content?: Json | null
          features?: Json | null
          gallery_images?: Json | null
          id?: string
          image_url?: string | null
          location?: string
          max_chickens_per_coop?: number | null
          min_chickens_per_coop?: number | null
          monthly_cost?: number
          name?: string
          rating?: number | null
          rental_price?: number
          review_count?: number | null
          total_coops?: number
          updated_at?: string
        }
        Relationships: []
      }
      billing_runs: {
        Row: {
          dry_run: boolean
          finished_at: string | null
          id: string
          initiated_by: string | null
          started_at: string
          status: string
          summary_json: Json
          type: string
        }
        Insert: {
          dry_run?: boolean
          finished_at?: string | null
          id?: string
          initiated_by?: string | null
          started_at?: string
          status?: string
          summary_json?: Json
          type?: string
        }
        Update: {
          dry_run?: boolean
          finished_at?: string | null
          id?: string
          initiated_by?: string | null
          started_at?: string
          status?: string
          summary_json?: Json
          type?: string
        }
        Relationships: []
      }
      billing_settings: {
        Row: {
          auto_cron_billing_enabled: boolean
          auto_monthly_billing_enabled: boolean
          created_at: string
          id: string
          monthly_billing_date: number
          updated_at: string
        }
        Insert: {
          auto_cron_billing_enabled?: boolean
          auto_monthly_billing_enabled?: boolean
          created_at?: string
          id?: string
          monthly_billing_date?: number
          updated_at?: string
        }
        Update: {
          auto_cron_billing_enabled?: boolean
          auto_monthly_billing_enabled?: boolean
          created_at?: string
          id?: string
          monthly_billing_date?: number
          updated_at?: string
        }
        Relationships: []
      }
      chicken_types: {
        Row: {
          care_requirements: Json | null
          characteristics: Json | null
          created_at: string
          days_per_period: number
          description: string | null
          detailed_content: Json | null
          eggs_per_period: number
          gallery_images: Json | null
          id: string
          image_url: string | null
          name: string
          price: number
        }
        Insert: {
          care_requirements?: Json | null
          characteristics?: Json | null
          created_at?: string
          days_per_period?: number
          description?: string | null
          detailed_content?: Json | null
          eggs_per_period?: number
          gallery_images?: Json | null
          id?: string
          image_url?: string | null
          name: string
          price: number
        }
        Update: {
          care_requirements?: Json | null
          characteristics?: Json | null
          created_at?: string
          days_per_period?: number
          description?: string | null
          detailed_content?: Json | null
          eggs_per_period?: number
          gallery_images?: Json | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
        }
        Relationships: []
      }
      contact_settings: {
        Row: {
          color: string | null
          contact_type: string
          created_at: string
          display_order: number | null
          icon: string
          id: string
          is_active: boolean | null
          label: string
          updated_at: string
          value: string
        }
        Insert: {
          color?: string | null
          contact_type: string
          created_at?: string
          display_order?: number | null
          icon: string
          id?: string
          is_active?: boolean | null
          label: string
          updated_at?: string
          value: string
        }
        Update: {
          color?: string | null
          contact_type?: string
          created_at?: string
          display_order?: number | null
          icon?: string
          id?: string
          is_active?: boolean | null
          label?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      egg_adjustments: {
        Row: {
          admin_email: string | null
          admin_id: string
          admin_name: string | null
          after_value: number
          before_value: number
          change_amount: number
          created_at: string
          id: string
          reason: string | null
          user_email: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          admin_email?: string | null
          admin_id: string
          admin_name?: string | null
          after_value?: number
          before_value?: number
          change_amount?: number
          created_at?: string
          id?: string
          reason?: string | null
          user_email?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          admin_email?: string | null
          admin_id?: string
          admin_name?: string | null
          after_value?: number
          before_value?: number
          change_amount?: number
          created_at?: string
          id?: string
          reason?: string | null
          user_email?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "egg_adjustments_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "egg_adjustments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      eggs_inventory: {
        Row: {
          created_at: string
          farm_id: string
          id: string
          total_eggs: number
          uncollected_eggs: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          farm_id: string
          id?: string
          total_eggs?: number
          uncollected_eggs?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          farm_id?: string
          id?: string
          total_eggs?: number
          uncollected_eggs?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eggs_inventory_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: true
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farm_rentals: {
        Row: {
          available_farm_id: string | null
          created_at: string
          farm_id: string
          id: string
          last_billed_at: string | null
          monthly_cost: number
          rental_price: number
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          available_farm_id?: string | null
          created_at?: string
          farm_id: string
          id?: string
          last_billed_at?: string | null
          monthly_cost: number
          rental_price: number
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          available_farm_id?: string | null
          created_at?: string
          farm_id?: string
          id?: string
          last_billed_at?: string | null
          monthly_cost?: number
          rental_price?: number
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "farm_rentals_available_farm_id_fkey"
            columns: ["available_farm_id"]
            isOneToOne: false
            referencedRelation: "available_farms"
            referencedColumns: ["id"]
          },
        ]
      }
      farms: {
        Row: {
          account_balance: number | null
          created_at: string
          farm_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_balance?: number | null
          created_at?: string
          farm_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_balance?: number | null
          created_at?: string
          farm_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      guide_sections: {
        Row: {
          content: Json
          created_at: string
          icon: string | null
          id: string
          is_active: boolean
          order_index: number
          parent_id: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          parent_id?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          parent_id?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_sections_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "guide_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number
          created_at: string
          daily_price: number
          days_elapsed: number
          id: string
          invoice_id: string
          package_id: string | null
          package_name: string | null
          quantity: number
        }
        Insert: {
          amount?: number
          created_at?: string
          daily_price?: number
          days_elapsed?: number
          id?: string
          invoice_id: string
          package_id?: string | null
          package_name?: string | null
          quantity?: number
        }
        Update: {
          amount?: number
          created_at?: string
          daily_price?: number
          days_elapsed?: number
          id?: string
          invoice_id?: string
          package_id?: string | null
          package_name?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          balance_after: number | null
          balance_before: number | null
          created_at: string
          farm_id: string | null
          id: string
          metadata: Json
          run_id: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string
          farm_id?: string | null
          id?: string
          metadata?: Json
          run_id: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string
          farm_id?: string | null
          id?: string
          metadata?: Json
          run_id?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "billing_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_bills: {
        Row: {
          billing_period_end: string
          billing_period_start: string
          chicken_quantity: number
          created_at: string
          daily_price: number
          days_in_period: number
          farm_id: string
          id: string
          package_id: string
          package_name: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          billing_period_end: string
          billing_period_start: string
          chicken_quantity?: number
          created_at?: string
          daily_price?: number
          days_in_period?: number
          farm_id: string
          id?: string
          package_id: string
          package_name: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          billing_period_end?: string
          billing_period_start?: string
          chicken_quantity?: number
          created_at?: string
          daily_price?: number
          days_in_period?: number
          farm_id?: string
          id?: string
          package_id?: string
          package_name?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          metadata: Json
          read_at: string | null
          send_email: boolean
          sent_at: string | null
          status: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          metadata?: Json
          read_at?: string | null
          send_email?: boolean
          sent_at?: string | null
          status?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          metadata?: Json
          read_at?: string | null
          send_email?: boolean
          sent_at?: string | null
          status?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      package_prices: {
        Row: {
          bg_gradient: string | null
          created_at: string
          daily_price: number
          description: string | null
          discount_percentage: number | null
          emoji: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          original_daily_price: number
          package_id: string
          package_name: string
          subtitle: string | null
          updated_at: string
        }
        Insert: {
          bg_gradient?: string | null
          created_at?: string
          daily_price?: number
          description?: string | null
          discount_percentage?: number | null
          emoji?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          original_daily_price?: number
          package_id: string
          package_name: string
          subtitle?: string | null
          updated_at?: string
        }
        Update: {
          bg_gradient?: string | null
          created_at?: string
          daily_price?: number
          description?: string | null
          discount_percentage?: number | null
          emoji?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          original_daily_price?: number
          package_id?: string
          package_name?: string
          subtitle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          farm_id: string | null
          id: string
          payment_method: string | null
          status: string
          transaction_id: string | null
          updated_at: string
          user_email: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          farm_id?: string | null
          id?: string
          payment_method?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_email?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          farm_id?: string | null
          id?: string
          payment_method?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_email?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          posting_date: number
          processed_at: string
          transaction_number: number
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          posting_date: number
          processed_at?: string
          transaction_number: number
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          posting_date?: number
          processed_at?: string
          transaction_number?: number
        }
        Relationships: []
      }
      production_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_name: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_name: string
          setting_value: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_name?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string | null
          id: string
          numeric_id: number
          phone: string | null
          shop_name: string | null
          uncollected_egg: number
          updated_at: string
          username: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          numeric_id?: number
          phone?: string | null
          shop_name?: string | null
          uncollected_egg?: number
          updated_at?: string
          username?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          numeric_id?: number
          phone?: string | null
          shop_name?: string | null
          uncollected_egg?: number
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      service_packages: {
        Row: {
          coop_id: string | null
          coop_name: string | null
          coop_price: number | null
          created_at: string
          farm_id: string
          id: string
          last_billed_at: string | null
          last_billing_date: string | null
          package_id: string
          package_name: string
          package_price: number
          purchased_at: string
          rtsp_url: string | null
          selected_chicken_quantity: number | null
          selected_chicken_type_id: string | null
          selected_chicken_type_name: string | null
          service_start_date: string | null
          status: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          coop_id?: string | null
          coop_name?: string | null
          coop_price?: number | null
          created_at?: string
          farm_id: string
          id?: string
          last_billed_at?: string | null
          last_billing_date?: string | null
          package_id: string
          package_name: string
          package_price: number
          purchased_at?: string
          rtsp_url?: string | null
          selected_chicken_quantity?: number | null
          selected_chicken_type_id?: string | null
          selected_chicken_type_name?: string | null
          service_start_date?: string | null
          status?: string | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          coop_id?: string | null
          coop_name?: string | null
          coop_price?: number | null
          created_at?: string
          farm_id?: string
          id?: string
          last_billed_at?: string | null
          last_billing_date?: string | null
          package_id?: string
          package_name?: string
          package_price?: number
          purchased_at?: string
          rtsp_url?: string | null
          selected_chicken_quantity?: number | null
          selected_chicken_type_id?: string | null
          selected_chicken_type_name?: string | null
          service_start_date?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number | null
          created_at: string
          description: string | null
          farm_id: string
          id: string
          quantity: number | null
          transaction_type: string
          user_email: string | null
          user_name: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description?: string | null
          farm_id: string
          id?: string
          quantity?: number | null
          transaction_type: string
          user_email?: string | null
          user_name?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          description?: string | null
          farm_id?: string
          id?: string
          quantity?: number | null
          transaction_type?: string
          user_email?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_accessories: {
        Row: {
          accessory_id: string
          created_at: string
          farm_id: string
          id: string
          quantity: number
        }
        Insert: {
          accessory_id: string
          created_at?: string
          farm_id: string
          id?: string
          quantity?: number
        }
        Update: {
          accessory_id?: string
          created_at?: string
          farm_id?: string
          id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_accessories_accessory_id_fkey"
            columns: ["accessory_id"]
            isOneToOne: false
            referencedRelation: "accessories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_accessories_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_chickens: {
        Row: {
          chicken_type_id: string
          created_at: string
          farm_id: string
          id: string
          last_egg_collection: string | null
          leftover_time_minutes: number | null
          quantity: number
          updated_at: string
        }
        Insert: {
          chicken_type_id: string
          created_at?: string
          farm_id: string
          id?: string
          last_egg_collection?: string | null
          leftover_time_minutes?: number | null
          quantity?: number
          updated_at?: string
        }
        Update: {
          chicken_type_id?: string
          created_at?: string
          farm_id?: string
          id?: string
          last_egg_collection?: string | null
          leftover_time_minutes?: number | null
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_chickens_chicken_type_id_fkey"
            columns: ["chicken_type_id"]
            isOneToOne: false
            referencedRelation: "chicken_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_chickens_farm_id_fkey"
            columns: ["farm_id"]
            isOneToOne: false
            referencedRelation: "farms"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_chickens_to_package: {
        Args: { additional_quantity: number; package_id_param: string }
        Returns: Json
      }
      adjust_uncollected_egg: {
        Args: {
          p_amount?: number
          p_mode: string
          p_reason?: string
          p_set_value?: number
          p_user_id: string
        }
        Returns: Json
      }
      disable_process_monthly_billing: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      enable_process_monthly_billing: {
        Args: { cron_expr?: string }
        Returns: boolean
      }
      format_vnd_amount: {
        Args: { amount: number }
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_process_monthly_billing_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          active: boolean
          jobname: string
          schedule: string
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_current_user_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_admin_activity: {
        Args: {
          p_action_type: string
          p_description: string
          p_details?: Json
          p_target_id?: string
          p_target_table?: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "customer" | "admin" | "super_admin"
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
      app_role: ["customer", "admin", "super_admin"],
    },
  },
} as const
