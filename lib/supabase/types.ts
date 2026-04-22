export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          avatar_url: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          avatar_url?: string | null;
          phone?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      businesses: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          city: string | null;
          country: string;
          currency: string;
          timezone: string;
          business_type: string;
          subscription_tier: string;
          subscription_expires_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          owner_id: string;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          country?: string;
          currency?: string;
          timezone?: string;
          business_type?: string;
          subscription_tier?: string;
        };
        Update: Partial<Database["public"]["Tables"]["businesses"]["Insert"]>;
      };
      business_members: {
        Row: {
          id: string;
          business_id: string;
          user_id: string;
          role: string;
          is_active: boolean;
          invited_by: string | null;
          joined_at: string;
        };
        Insert: {
          business_id: string;
          user_id: string;
          role?: string;
          is_active?: boolean;
          invited_by?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["business_members"]["Insert"]
        >;
      };
      invitations: {
        Row: {
          id: string;
          business_id: string;
          email: string;
          role: string;
          token: string;
          invited_by: string;
          accepted_at: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          business_id: string;
          email: string;
          role?: string;
          invited_by: string;
          expires_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["invitations"]["Insert"]>;
      };
      categories: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          business_id: string;
          name: string;
          color?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      products: {
        Row: {
          id: string;
          business_id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          sku: string | null;
          barcode: string | null;
          image_url: string | null;
          cost_price: number;
          selling_price: number;
          stock_quantity: number;
          low_stock_threshold: number;
          track_inventory: boolean;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          category_id?: string | null;
          name: string;
          description?: string | null;
          sku?: string | null;
          barcode?: string | null;
          image_url?: string | null;
          cost_price?: number;
          selling_price: number;
          stock_quantity?: number;
          low_stock_threshold?: number;
          track_inventory?: boolean;
          is_active?: boolean;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          business_id: string;
          name: string;
          attributes: Json;
          sku: string | null;
          barcode: string | null;
          cost_price: number | null;
          selling_price: number | null;
          stock_quantity: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          product_id: string;
          business_id: string;
          name: string;
          attributes?: Json;
          sku?: string | null;
          barcode?: string | null;
          cost_price?: number | null;
          selling_price?: number | null;
          stock_quantity?: number;
          is_active?: boolean;
        };
        Update: Partial<
          Database["public"]["Tables"]["product_variants"]["Insert"]
        >;
      };
      customers: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          address: string | null;
          notes: string | null;
          credit_balance: number;
          total_spent: number;
          last_purchase_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          address?: string | null;
          notes?: string | null;
          credit_balance?: number;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
      };
      sales: {
        Row: {
          id: string;
          business_id: string;
          customer_id: string | null;
          sale_number: string;
          subtotal: number;
          discount_type: string | null;
          discount_value: number;
          discount_amount: number;
          tax_amount: number;
          total_amount: number;
          amount_paid: number;
          change_amount: number;
          payment_method: string;
          payment_reference: string | null;
          payment_status: string;
          notes: string | null;
          served_by: string | null;
          created_at: string;
        };
        Insert: {
          business_id: string;
          customer_id?: string | null;
          sale_number: string;
          subtotal: number;
          discount_type?: string | null;
          discount_value?: number;
          discount_amount?: number;
          tax_amount?: number;
          total_amount: number;
          amount_paid: number;
          change_amount?: number;
          payment_method?: string;
          payment_reference?: string | null;
          payment_status?: string;
          notes?: string | null;
          served_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["sales"]["Insert"]>;
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          business_id: string;
          product_id: string | null;
          variant_id: string | null;
          product_name: string;
          variant_name: string | null;
          sku: string | null;
          quantity: number;
          unit_price: number;
          cost_price: number;
          line_total: number;
        };
        Insert: {
          sale_id: string;
          business_id: string;
          product_id?: string | null;
          variant_id?: string | null;
          product_name: string;
          variant_name?: string | null;
          sku?: string | null;
          quantity: number;
          unit_price: number;
          cost_price: number;
          line_total: number;
        };
        Update: Partial<Database["public"]["Tables"]["sale_items"]["Insert"]>;
      };
      expenses: {
        Row: {
          id: string;
          business_id: string;
          category: string;
          title: string;
          amount: number;
          description: string | null;
          receipt_url: string | null;
          recorded_by: string | null;
          expense_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          category: string;
          title: string;
          amount: number;
          description?: string | null;
          receipt_url?: string | null;
          recorded_by?: string | null;
          expense_date?: string;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
      };
      stock_adjustments: {
        Row: {
          id: string;
          business_id: string;
          product_id: string;
          variant_id: string | null;
          adjustment: number;
          reason: string;
          notes: string | null;
          adjusted_by: string | null;
          created_at: string;
        };
        Insert: {
          business_id: string;
          product_id: string;
          variant_id?: string | null;
          adjustment: number;
          reason: string;
          notes?: string | null;
          adjusted_by?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["stock_adjustments"]["Insert"]
        >;
      };
    };
    Views: {};
    Functions: {
      generate_sale_number: {
        Args: { p_business_id: string };
        Returns: string;
      };
      get_profit_loss_report: {
        Args: { p_business_id: string; p_start: string; p_end: string };
        Returns: {
          gross_revenue: number;
          cogs: number;
          gross_profit: number;
          total_expenses: number;
          net_profit: number;
          margin_percent: number;
        }[];
      };
      get_dashboard_stats: {
        Args: { p_business_id: string };
        Returns: {
          today_revenue: number;
          today_sales_count: number;
          today_profit: number;
          month_revenue: number;
          low_stock_count: number;
          total_customers: number;
        }[];
      };
    };
    Enums: {};
  };
}
