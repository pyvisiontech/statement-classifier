export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      accountants: {
        Row: {
          created_at: string;
          email: string;
          first_name: string;
          id: string;
          is_active: boolean;
          last_name: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          first_name: string;
          id: string;
          is_active?: boolean;
          last_name?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          first_name?: string;
          id?: string;
          is_active?: boolean;
          last_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: number;
          name: string;
        };
        Insert: {
          id?: number;
          name: string;
        };
        Update: {
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      clients: {
        Row: {
          accountant_id: string;
          email: string;
          first_name: string;
          id: string;
          last_name: string | null;
          phone_number: string | null;
        };
        Insert: {
          accountant_id: string;
          email: string;
          first_name: string;
          id?: string;
          last_name?: string | null;
          phone_number?: string | null;
        };
        Update: {
          accountant_id?: string;
          email?: string;
          first_name?: string;
          id?: string;
          last_name?: string | null;
          phone_number?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "clients_accountant_id_fkey";
            columns: ["accountant_id"];
            isOneToOne: false;
            referencedRelation: "accountants";
            referencedColumns: ["id"];
          },
        ];
      };
      files: {
        Row: {
          accountant_id: string;
          client_id: string;
          file_size: number | null;
          id: string;
          name: string;
          s3_path: string;
          uploaded_at: string;
        };
        Insert: {
          accountant_id: string;
          client_id: string;
          file_size?: number | null;
          id?: string;
          name: string;
          s3_path: string;
          uploaded_at?: string;
        };
        Update: {
          accountant_id?: string;
          client_id?: string;
          file_size?: number | null;
          id?: string;
          name?: string;
          s3_path?: string;
          uploaded_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "files_accountant_id_fkey";
            columns: ["accountant_id"];
            isOneToOne: false;
            referencedRelation: "accountants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "files_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          accountant_id: string;
          category_id_by_ai: number;
          client_id: string;
          confidence: string | null;
          created_at: string;
          feedback_for_update: string | null;
          file_id: string;
          id: string;
          reason: string | null;
          tx_amount: number | null;
          tx_narration: string | null;
          tx_timestamp: string | null;
          updated_at: string;
          updated_by: string | null;
          updated_category_id: number | null;
        };
        Insert: {
          accountant_id: string;
          category_id_by_ai: number;
          client_id: string;
          confidence?: string | null;
          created_at?: string;
          feedback_for_update?: string | null;
          file_id: string;
          id?: string;
          reason?: string | null;
          tx_amount?: number | null;
          tx_narration?: string | null;
          tx_timestamp?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          updated_category_id?: number | null;
        };
        Update: {
          accountant_id?: string;
          category_id_by_ai?: number;
          client_id?: string;
          confidence?: string | null;
          created_at?: string;
          feedback_for_update?: string | null;
          file_id?: string;
          id?: string;
          reason?: string | null;
          tx_amount?: number | null;
          tx_narration?: string | null;
          tx_timestamp?: string | null;
          updated_at?: string;
          updated_by?: string | null;
          updated_category_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_accountant_id_fkey";
            columns: ["accountant_id"];
            isOneToOne: false;
            referencedRelation: "accountants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_category_id_by_ai_fkey";
            columns: ["category_id_by_ai"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_file_id_fkey";
            columns: ["file_id"];
            isOneToOne: false;
            referencedRelation: "files";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "accountants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_updated_category_id_fkey";
            columns: ["updated_category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
