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
      abandoned_carts: {
        Row: {
          cart_value: number | null
          created_at: string
          email: string | null
          id: string
          items: Json | null
          last_activity_at: string
          last_step: string | null
          recovered_at: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          cart_value?: number | null
          created_at?: string
          email?: string | null
          id?: string
          items?: Json | null
          last_activity_at?: string
          last_step?: string | null
          recovered_at?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          cart_value?: number | null
          created_at?: string
          email?: string | null
          id?: string
          items?: Json | null
          last_activity_at?: string
          last_step?: string | null
          recovered_at?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      account_deletion_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          expires_at: string
          id: string
          scheduled_deletion_at: string | null
          status: string
          token: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          scheduled_deletion_at?: string | null
          status?: string
          token: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          scheduled_deletion_at?: string | null
          status?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      account_restrictions: {
        Row: {
          abuse_score: number
          coupon_rejections: number
          created_at: string
          discount_reversals: number
          early_cancellations: number
          id: string
          is_promotional_restricted: boolean
          last_abuse_check_at: string | null
          notes: string | null
          pause_cycles: number
          restricted_at: string | null
          restricted_by: string | null
          restriction_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          abuse_score?: number
          coupon_rejections?: number
          created_at?: string
          discount_reversals?: number
          early_cancellations?: number
          id?: string
          is_promotional_restricted?: boolean
          last_abuse_check_at?: string | null
          notes?: string | null
          pause_cycles?: number
          restricted_at?: string | null
          restricted_by?: string | null
          restriction_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          abuse_score?: number
          coupon_rejections?: number
          created_at?: string
          discount_reversals?: number
          early_cancellations?: number
          id?: string
          is_promotional_restricted?: boolean
          last_abuse_check_at?: string | null
          notes?: string | null
          pause_cycles?: number
          restricted_at?: string | null
          restricted_by?: string | null
          restriction_reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          address_type: string
          city: string
          country: string
          created_at: string | null
          full_name: string
          id: string
          is_default: boolean | null
          phone: string | null
          postal_code: string
          state: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          address_type: string
          city: string
          country?: string
          created_at?: string | null
          full_name: string
          id?: string
          is_default?: boolean | null
          phone?: string | null
          postal_code: string
          state: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          address_type?: string
          city?: string
          country?: string
          created_at?: string | null
          full_name?: string
          id?: string
          is_default?: boolean | null
          phone?: string | null
          postal_code?: string
          state?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_login_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: string
          ip_address: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_products: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          product_id: string
          sort_order?: number
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "collection_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          show_on_homepage: boolean
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          show_on_homepage?: boolean
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          show_on_homepage?: boolean
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      coupon_audit_log: {
        Row: {
          action: string
          coupon_code: string
          created_at: string
          discount_amount: number | null
          id: string
          metadata: Json | null
          order_id: string | null
          promotion_id: string | null
          reason_code: string | null
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          coupon_code: string
          created_at?: string
          discount_amount?: number | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          promotion_id?: string | null
          reason_code?: string | null
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          coupon_code?: string
          created_at?: string
          discount_amount?: number | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          promotion_id?: string | null
          reason_code?: string | null
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_audit_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_audit_log_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_audit_log_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_segments: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          rules: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          rules?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          rules?: Json
          updated_at?: string
        }
        Relationships: []
      }
      delivery_preferences: {
        Row: {
          created_at: string | null
          delivery_instructions: string | null
          id: string
          leave_at_door: boolean | null
          preferred_delivery_window: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delivery_instructions?: string | null
          id?: string
          leave_at_door?: boolean | null
          preferred_delivery_window?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          delivery_instructions?: string | null
          id?: string
          leave_at_door?: boolean | null
          preferred_delivery_window?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string
          description: string | null
          html_template: string
          id: string
          is_active: boolean
          subject: string
          template_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          html_template: string
          id?: string
          is_active?: boolean
          subject: string
          template_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          html_template?: string
          id?: string
          is_active?: boolean
          subject?: string
          template_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      homepage_settings: {
        Row: {
          featured_collection_id: string | null
          hero_button_link: string | null
          hero_button_text: string | null
          hero_image_url: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          featured_collection_id?: string | null
          hero_button_link?: string | null
          hero_button_text?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          featured_collection_id?: string | null
          hero_button_link?: string | null
          hero_button_text?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homepage_settings_featured_collection_id_fkey"
            columns: ["featured_collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_audit_log: {
        Row: {
          admin_user_id: string
          change_type: string
          created_at: string
          id: string
          new_quantity: number
          notes: string | null
          previous_quantity: number
          product_id: string
          quantity_change: number
        }
        Insert: {
          admin_user_id: string
          change_type: string
          created_at?: string
          id?: string
          new_quantity: number
          notes?: string | null
          previous_quantity: number
          product_id: string
          quantity_change: number
        }
        Update: {
          admin_user_id?: string
          change_type?: string
          created_at?: string
          id?: string
          new_quantity?: number
          notes?: string | null
          previous_quantity?: number
          product_id?: string
          quantity_change?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_audit_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_newsletter: boolean
          email_order_updates: boolean
          email_promotional: boolean
          email_shipping_updates: boolean
          id: string
          sms_order_updates: boolean
          sms_phone_number: string | null
          sms_promotional: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_newsletter?: boolean
          email_order_updates?: boolean
          email_promotional?: boolean
          email_shipping_updates?: boolean
          id?: string
          sms_order_updates?: boolean
          sms_phone_number?: string | null
          sms_promotional?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_newsletter?: boolean
          email_order_updates?: boolean
          email_promotional?: boolean
          email_shipping_updates?: boolean
          id?: string
          sms_order_updates?: boolean
          sms_phone_number?: string | null
          sms_promotional?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_issues: {
        Row: {
          created_at: string | null
          description: string
          id: string
          issue_type: string
          order_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          issue_type: string
          order_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          issue_type?: string
          order_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_issues_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_issues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          product_description: string | null
          product_id: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          product_description?: string | null
          product_id?: string | null
          product_name: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          product_description?: string | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address_id: string | null
          carrier: string | null
          carrier_code: string | null
          created_at: string | null
          delivered_at: string | null
          estimated_delivery_date: string | null
          id: string
          notes: string | null
          order_number: string
          payment_method_id: string | null
          shipped_at: string | null
          shipping: number
          shipping_address_id: string | null
          status: string
          subscription_id: string | null
          subtotal: number
          tax: number
          total: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_address_id?: string | null
          carrier?: string | null
          carrier_code?: string | null
          created_at?: string | null
          delivered_at?: string | null
          estimated_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_number: string
          payment_method_id?: string | null
          shipped_at?: string | null
          shipping?: number
          shipping_address_id?: string | null
          status: string
          subscription_id?: string | null
          subtotal: number
          tax?: number
          total: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_address_id?: string | null
          carrier?: string | null
          carrier_code?: string | null
          created_at?: string | null
          delivered_at?: string | null
          estimated_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method_id?: string | null
          shipped_at?: string | null
          shipping?: number
          shipping_address_id?: string | null
          status?: string
          subscription_id?: string | null
          subtotal?: number
          tax?: number
          total?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_billing_address_id_fkey"
            columns: ["billing_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_address_id_fkey"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_last_four: string | null
          created_at: string | null
          id: string
          is_default: boolean | null
          payment_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last_four?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          payment_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last_four?: string | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          payment_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          image_url: string
          product_id: string
          sort_order: number
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url: string
          product_id: string
          sort_order?: number
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          image_url?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          avg_daily_sales: number | null
          category: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          in_stock: boolean
          last_sales_calculation: string | null
          low_stock_threshold: number
          name: string
          price: number
          reorder_point: number | null
          sku: string | null
          stock_quantity: number
          supplier_email: string | null
          supplier_name: string | null
          updated_at: string
        }
        Insert: {
          avg_daily_sales?: number | null
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          last_sales_calculation?: string | null
          low_stock_threshold?: number
          name: string
          price: number
          reorder_point?: number | null
          sku?: string | null
          stock_quantity?: number
          supplier_email?: string | null
          supplier_name?: string | null
          updated_at?: string
        }
        Update: {
          avg_daily_sales?: number | null
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          last_sales_calculation?: string | null
          low_stock_threshold?: number
          name?: string
          price?: number
          reorder_point?: number | null
          sku?: string | null
          stock_quantity?: number
          supplier_email?: string | null
          supplier_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          first_name: string | null
          full_name: string | null
          id: string
          is_vip: boolean
          last_name: string | null
          lifetime_value: number
          phone: string | null
          total_orders: number
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          first_name?: string | null
          full_name?: string | null
          id: string
          is_vip?: boolean
          last_name?: string | null
          lifetime_value?: number
          phone?: string | null
          total_orders?: number
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_vip?: boolean
          last_name?: string | null
          lifetime_value?: number
          phone?: string | null
          total_orders?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      promotion_uses: {
        Row: {
          discount_applied: number
          id: string
          order_id: string | null
          promotion_id: string
          subscription_id: string | null
          used_at: string
          user_id: string
        }
        Insert: {
          discount_applied: number
          id?: string
          order_id?: string | null
          promotion_id: string
          subscription_id?: string | null
          used_at?: string
          user_id: string
        }
        Update: {
          discount_applied?: number
          id?: string
          order_id?: string | null
          promotion_id?: string
          subscription_id?: string | null
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_uses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_uses_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_uses_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          applies_to: string
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          is_subscription_eligible: boolean | null
          max_uses: number | null
          max_uses_per_user: number | null
          min_order_amount: number | null
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          applies_to?: string
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_subscription_eligible?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          applies_to?: string
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_subscription_eligible?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          converted_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          referee_credited: boolean
          referee_discount_percent: number
          referee_email: string | null
          referee_user_id: string | null
          referral_code: string
          referrer_credited: boolean
          referrer_discount_percent: number
          referrer_user_id: string
          status: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          referee_credited?: boolean
          referee_discount_percent?: number
          referee_email?: string | null
          referee_user_id?: string | null
          referral_code: string
          referrer_credited?: boolean
          referrer_discount_percent?: number
          referrer_user_id: string
          status?: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          referee_credited?: boolean
          referee_discount_percent?: number
          referee_email?: string | null
          referee_user_id?: string | null
          referral_code?: string
          referrer_credited?: boolean
          referrer_discount_percent?: number
          referrer_user_id?: string
          status?: string
        }
        Relationships: []
      }
      segment_members: {
        Row: {
          added_at: string
          id: string
          segment_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          segment_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          segment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "segment_members_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "customer_segments"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      stock_notifications: {
        Row: {
          created_at: string
          email: string
          id: string
          notified_at: string | null
          product_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notified_at?: string | null
          product_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notified_at?: string | null
          product_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_notifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_addons: {
        Row: {
          created_at: string
          id: string
          processed_at: string | null
          product_id: string
          quantity: number
          status: string
          subscription_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          processed_at?: string | null
          product_id: string
          quantity?: number
          status?: string
          subscription_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          processed_at?: string | null
          product_id?: string
          quantity?: number
          status?: string
          subscription_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "subscription_addons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_addons_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          created_at: string
          created_by: string | null
          event_data: Json | null
          event_type: string
          id: string
          subscription_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          subscription_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_programs: {
        Row: {
          created_at: string
          default_product_id: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_product_id?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_product_id?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_programs_default_product_id_fkey"
            columns: ["default_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          bag_size: string | null
          cancelled_at: string | null
          created_at: string
          deliveries_completed: number | null
          discount_amount: number | null
          discount_code: string | null
          discount_percent: number | null
          frequency: string
          gift_end_date: string | null
          gift_message: string | null
          gift_recipient_email: string | null
          gift_recipient_name: string | null
          grind: string | null
          id: string
          is_gift: boolean | null
          is_prepaid: boolean | null
          last_order_id: string | null
          next_delivery_date: string | null
          original_price: number | null
          paused_at: string | null
          payment_method_id: string | null
          prepaid_end_date: string | null
          prepaid_months: number | null
          price: number
          product_id: string
          product_name: string
          program_id: string | null
          quantity: number
          resume_at: string | null
          shipping_address_id: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bag_size?: string | null
          cancelled_at?: string | null
          created_at?: string
          deliveries_completed?: number | null
          discount_amount?: number | null
          discount_code?: string | null
          discount_percent?: number | null
          frequency?: string
          gift_end_date?: string | null
          gift_message?: string | null
          gift_recipient_email?: string | null
          gift_recipient_name?: string | null
          grind?: string | null
          id?: string
          is_gift?: boolean | null
          is_prepaid?: boolean | null
          last_order_id?: string | null
          next_delivery_date?: string | null
          original_price?: number | null
          paused_at?: string | null
          payment_method_id?: string | null
          prepaid_end_date?: string | null
          prepaid_months?: number | null
          price: number
          product_id: string
          product_name: string
          program_id?: string | null
          quantity?: number
          resume_at?: string | null
          shipping_address_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bag_size?: string | null
          cancelled_at?: string | null
          created_at?: string
          deliveries_completed?: number | null
          discount_amount?: number | null
          discount_code?: string | null
          discount_percent?: number | null
          frequency?: string
          gift_end_date?: string | null
          gift_message?: string | null
          gift_recipient_email?: string | null
          gift_recipient_name?: string | null
          grind?: string | null
          id?: string
          is_gift?: boolean | null
          is_prepaid?: boolean | null
          last_order_id?: string | null
          next_delivery_date?: string | null
          original_price?: number | null
          paused_at?: string | null
          payment_method_id?: string | null
          prepaid_end_date?: string | null
          prepaid_months?: number | null
          price?: number
          product_id?: string
          product_name?: string
          program_id?: string | null
          quantity?: number
          resume_at?: string | null
          shipping_address_id?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "subscription_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_shipping_address_id_fkey"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          admin_level: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          admin_level?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          admin_level?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
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
      cancel_account_deletion: { Args: never; Returns: undefined }
      check_admin_login_rate_limit: {
        Args: { _email: string }
        Returns: {
          attempts_count: number
          block_until: string
          is_blocked: boolean
        }[]
      }
      confirm_account_deletion:
        | { Args: { _token: string }; Returns: undefined }
        | {
            Args: { _confirmation_text: string; _token: string }
            Returns: undefined
          }
      delete_user: { Args: never; Returns: undefined }
      get_admin_level: { Args: { _user_id: string }; Returns: string }
      get_scheduled_deletion: {
        Args: never
        Returns: {
          days_remaining: number
          scheduled_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_admin_login_attempt: {
        Args: {
          _email: string
          _ip_address?: string
          _success: boolean
          _user_agent?: string
        }
        Returns: undefined
      }
      request_account_deletion: { Args: never; Returns: string }
      validate_referral_code: {
        Args: { _code: string }
        Returns: {
          is_valid: boolean
          referee_discount_percent: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
