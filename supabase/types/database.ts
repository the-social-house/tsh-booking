export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      amenities: {
        Row: {
          amenity_id: string;
          amenity_name: string;
          amenity_price: number | null;
        };
        Insert: {
          amenity_id?: string;
          amenity_name: string;
          amenity_price?: number | null;
        };
        Update: {
          amenity_id?: string;
          amenity_name?: string;
          amenity_price?: number | null;
        };
        Relationships: [];
      };
      booking_amenities: {
        Row: {
          amenity_id: string;
          booking_id: string;
        };
        Insert: {
          amenity_id: string;
          booking_id: string;
        };
        Update: {
          amenity_id?: string;
          booking_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "booking_amenities_amenity_id_fkey";
            columns: ["amenity_id"];
            isOneToOne: false;
            referencedRelation: "amenities";
            referencedColumns: ["amenity_id"];
          },
          {
            foreignKeyName: "booking_amenities_booking_id_fkey";
            columns: ["booking_id"];
            isOneToOne: false;
            referencedRelation: "bookings";
            referencedColumns: ["booking_id"];
          },
        ];
      };
      bookings: {
        Row: {
          booking_created_at: string;
          booking_date: string;
          booking_discount: number | null;
          booking_end_time: string;
          booking_id: string;
          booking_is_type_of_booking: string;
          booking_meeting_room_id: string;
          booking_number_of_people: number;
          booking_payment_status: string;
          booking_receipt_url: string | null;
          booking_start_time: string;
          booking_stripe_transaction_id: string | null;
          booking_total_price: number;
          booking_user_id: string;
        };
        Insert: {
          booking_created_at?: string;
          booking_date: string;
          booking_discount?: number | null;
          booking_end_time: string;
          booking_id?: string;
          booking_is_type_of_booking: string;
          booking_meeting_room_id: string;
          booking_number_of_people: number;
          booking_payment_status?: string;
          booking_receipt_url?: string | null;
          booking_start_time: string;
          booking_stripe_transaction_id?: string | null;
          booking_total_price: number;
          booking_user_id: string;
        };
        Update: {
          booking_created_at?: string;
          booking_date?: string;
          booking_discount?: number | null;
          booking_end_time?: string;
          booking_id?: string;
          booking_is_type_of_booking?: string;
          booking_meeting_room_id?: string;
          booking_number_of_people?: number;
          booking_payment_status?: string;
          booking_receipt_url?: string | null;
          booking_start_time?: string;
          booking_stripe_transaction_id?: string | null;
          booking_total_price?: number;
          booking_user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_booking_meeting_room_id_fkey";
            columns: ["booking_meeting_room_id"];
            isOneToOne: false;
            referencedRelation: "meeting_rooms";
            referencedColumns: ["meeting_room_id"];
          },
          {
            foreignKeyName: "bookings_booking_user_id_fkey";
            columns: ["booking_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["user_id"];
          },
        ];
      };
      meeting_room_amenities: {
        Row: {
          amenity_id: string;
          meeting_room_id: string;
        };
        Insert: {
          amenity_id: string;
          meeting_room_id: string;
        };
        Update: {
          amenity_id?: string;
          meeting_room_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meeting_room_amenities_amenity_id_fkey";
            columns: ["amenity_id"];
            isOneToOne: false;
            referencedRelation: "amenities";
            referencedColumns: ["amenity_id"];
          },
          {
            foreignKeyName: "meeting_room_amenities_meeting_room_id_fkey";
            columns: ["meeting_room_id"];
            isOneToOne: false;
            referencedRelation: "meeting_rooms";
            referencedColumns: ["meeting_room_id"];
          },
        ];
      };
      meeting_rooms: {
        Row: {
          meeting_room_capacity: number;
          meeting_room_description: string | null;
          meeting_room_id: string;
          meeting_room_images: string[] | null;
          meeting_room_name: string;
          meeting_room_price_per_hour: number;
          meeting_room_size: number;
          meeting_room_slug: string;
        };
        Insert: {
          meeting_room_capacity: number;
          meeting_room_description?: string | null;
          meeting_room_id?: string;
          meeting_room_images?: string[] | null;
          meeting_room_name: string;
          meeting_room_price_per_hour: number;
          meeting_room_size: number;
          meeting_room_slug: string;
        };
        Update: {
          meeting_room_capacity?: number;
          meeting_room_description?: string | null;
          meeting_room_id?: string;
          meeting_room_images?: string[] | null;
          meeting_room_name?: string;
          meeting_room_price_per_hour?: number;
          meeting_room_size?: number;
          meeting_room_slug?: string;
        };
        Relationships: [];
      };
      roles: {
        Row: {
          role_id: string;
          role_name: string;
        };
        Insert: {
          role_id?: string;
          role_name: string;
        };
        Update: {
          role_id?: string;
          role_name?: string;
        };
        Relationships: [];
      };
      room_unavailabilities: {
        Row: {
          meeting_room_id: string;
          unavailability_id: string;
          unavailability_reason: string | null;
          unavailable_end_date: string;
          unavailable_start_date: string;
        };
        Insert: {
          meeting_room_id: string;
          unavailability_id?: string;
          unavailability_reason?: string | null;
          unavailable_end_date: string;
          unavailable_start_date: string;
        };
        Update: {
          meeting_room_id?: string;
          unavailability_id?: string;
          unavailability_reason?: string | null;
          unavailable_end_date?: string;
          unavailable_start_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "room_unavailabilities_meeting_room_id_fkey";
            columns: ["meeting_room_id"];
            isOneToOne: false;
            referencedRelation: "meeting_rooms";
            referencedColumns: ["meeting_room_id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          subscription_discount_rate: number;
          subscription_id: string;
          subscription_max_monthly_bookings: number | null;
          subscription_monthly_price: number;
          subscription_name: string;
        };
        Insert: {
          subscription_discount_rate: number;
          subscription_id?: string;
          subscription_max_monthly_bookings?: number | null;
          subscription_monthly_price: number;
          subscription_name: string;
        };
        Update: {
          subscription_discount_rate?: number;
          subscription_id?: string;
          subscription_max_monthly_bookings?: number | null;
          subscription_monthly_price?: number;
          subscription_name?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          user_company_name: string;
          user_created_at: string;
          user_current_monthly_bookings: number | null;
          user_email: string;
          user_id: string;
          user_is_banned: boolean;
          user_role_id: string;
          user_subscription_id: string;
        };
        Insert: {
          user_company_name: string;
          user_created_at?: string;
          user_current_monthly_bookings?: number | null;
          user_email: string;
          user_id: string;
          user_is_banned?: boolean;
          user_role_id: string;
          user_subscription_id: string;
        };
        Update: {
          user_company_name?: string;
          user_created_at?: string;
          user_current_monthly_bookings?: number | null;
          user_email?: string;
          user_id?: string;
          user_is_banned?: boolean;
          user_role_id?: string;
          user_subscription_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "users_user_role_id_fkey";
            columns: ["user_role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["role_id"];
          },
          {
            foreignKeyName: "users_user_subscription_id_fkey";
            columns: ["user_subscription_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["subscription_id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: { Args: never; Returns: boolean };
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
