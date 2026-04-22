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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_date: string | null
          category: string
          city: string | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          location: string | null
          max_participants: number | null
          title: string
          updated_at: string
        }
        Insert: {
          activity_date?: string | null
          category?: string
          city?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          location?: string | null
          max_participants?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          activity_date?: string | null
          category?: string
          city?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          location?: string | null
          max_participants?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      activity_messages: {
        Row: {
          activity_id: string
          content: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          activity_id: string
          content: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          activity_id?: string
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_messages_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_participants: {
        Row: {
          activity_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_participants_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      help_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          request_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          request_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          request_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "help_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      help_requests: {
        Row: {
          category: string
          city: string | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          city?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          city?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      help_responses: {
        Row: {
          created_at: string
          id: string
          message: string
          request_id: string
          responder_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          request_id: string
          responder_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          request_id?: string
          responder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_responses_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "help_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          action: string
          created_at: string
          id: string
          target_user_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          target_user_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          target_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          id: string
          status: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          match_id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          match_id: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          match_id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_range: string | null
          availabilities: Json | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          consent_at: string | null
          consent_version: string | null
          created_at: string
          first_name: string | null
          goals: string[] | null
          id: string
          interests: string[] | null
          love_mode: boolean | null
          onboarding_completed: boolean | null
          postal_code: string | null
          radius_km: number | null
          suspended: boolean | null
          ui_mode: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_range?: string | null
          availabilities?: Json | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          consent_at?: string | null
          consent_version?: string | null
          created_at?: string
          first_name?: string | null
          goals?: string[] | null
          id?: string
          interests?: string[] | null
          love_mode?: boolean | null
          onboarding_completed?: boolean | null
          postal_code?: string | null
          radius_km?: number | null
          suspended?: boolean | null
          ui_mode?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_range?: string | null
          availabilities?: Json | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          consent_at?: string | null
          consent_version?: string | null
          created_at?: string
          first_name?: string | null
          goals?: string[] | null
          id?: string
          interests?: string[] | null
          love_mode?: boolean | null
          onboarding_completed?: boolean | null
          postal_code?: string | null
          radius_km?: number | null
          suspended?: boolean | null
          ui_mode?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_content_id: string | null
          reported_content_type: string | null
          reported_user_id: string | null
          reporter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_content_id?: string | null
          reported_content_type?: string | null
          reported_user_id?: string | null
          reporter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_content_id?: string | null
          reported_content_type?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          status?: string
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
          role: Database["public"]["Enums"]["app_role"]
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
      public_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          first_name: string | null
          ui_mode: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          first_name?: string | null
          ui_mode?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          first_name?: string | null
          ui_mode?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_and_create_match: {
        Args: { p_target_user_id: string; p_user_id: string }
        Returns: boolean
      }
      delete_my_account: { Args: never; Returns: undefined }
      get_my_full_profile: {
        Args: never
        Returns: {
          age_range: string | null
          availabilities: Json | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          consent_at: string | null
          consent_version: string | null
          created_at: string
          first_name: string | null
          goals: string[] | null
          id: string
          interests: string[] | null
          love_mode: boolean | null
          onboarding_completed: boolean | null
          postal_code: string | null
          radius_km: number | null
          suspended: boolean | null
          ui_mode: string | null
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_suspended: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
