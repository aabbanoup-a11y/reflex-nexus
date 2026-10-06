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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_models: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          label: string
          priority: number
          provider: string
          supports_files: boolean
          supports_images: boolean
          supports_video: boolean
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id: string
          label: string
          priority?: number
          provider: string
          supports_files?: boolean
          supports_images?: boolean
          supports_video?: boolean
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          label?: string
          priority?: number
          provider?: string
          supports_files?: boolean
          supports_images?: boolean
          supports_video?: boolean
        }
        Relationships: []
      }
      ai_runs: {
        Row: {
          agent_key: string
          agent_kind: string
          agent_name: string
          created_at: string
          id: string
          model: string | null
          prompt: string
          reply: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          agent_key: string
          agent_kind: string
          agent_name: string
          created_at?: string
          id?: string
          model?: string | null
          prompt: string
          reply?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          agent_key?: string
          agent_kind?: string
          agent_name?: string
          created_at?: string
          id?: string
          model?: string | null
          prompt?: string
          reply?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      companion_commands: {
        Row: {
          approved_at: string | null
          created_at: string
          device_id: string
          error: string | null
          finished_at: string | null
          id: string
          kind: string
          payload: Json
          requires_approval: boolean
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          device_id: string
          error?: string | null
          finished_at?: string | null
          id?: string
          kind: string
          payload?: Json
          requires_approval?: boolean
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          device_id?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          kind?: string
          payload?: Json
          requires_approval?: boolean
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "companion_commands_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "companion_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      companion_devices: {
        Row: {
          created_at: string
          device_name: string
          device_public_key: string | null
          id: string
          last_seen_at: string | null
          platform: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name: string
          device_public_key?: string | null
          id?: string
          last_seen_at?: string | null
          platform?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string
          device_public_key?: string | null
          id?: string
          last_seen_at?: string | null
          platform?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      companion_events: {
        Row: {
          command_id: string | null
          created_at: string
          device_id: string
          event_type: string
          id: string
          message: string | null
          metadata: Json
          screenshot_path: string | null
          user_id: string
        }
        Insert: {
          command_id?: string | null
          created_at?: string
          device_id: string
          event_type: string
          id?: string
          message?: string | null
          metadata?: Json
          screenshot_path?: string | null
          user_id: string
        }
        Update: {
          command_id?: string | null
          created_at?: string
          device_id?: string
          event_type?: string
          id?: string
          message?: string | null
          metadata?: Json
          screenshot_path?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "companion_events_command_id_fkey"
            columns: ["command_id"]
            isOneToOne: false
            referencedRelation: "companion_commands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companion_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "companion_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          ai_model: string | null
          code: string
          created_at: string
          department: string
          email: string
          full_name: string
          hired_at: string
          id: string
          job_title: string
          phone: string
          status: string
        }
        Insert: {
          ai_model?: string | null
          code: string
          created_at?: string
          department: string
          email: string
          full_name: string
          hired_at?: string
          id?: string
          job_title: string
          phone: string
          status?: string
        }
        Update: {
          ai_model?: string | null
          code?: string
          created_at?: string
          department?: string
          email?: string
          full_name?: string
          hired_at?: string
          id?: string
          job_title?: string
          phone?: string
          status?: string
        }
        Relationships: []
      }
      memory_settings: {
        Row: {
          consent: boolean
          enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          consent?: boolean
          enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          consent?: boolean
          enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mood_checkins: {
        Row: {
          created_at: string
          id: string
          mood: number
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mood: number
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mood?: number
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      network_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_error: boolean
          tools: Json
          user_id: string
          who: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_error?: boolean
          tools?: Json
          user_id: string
          who: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_error?: boolean
          tools?: Json
          user_id?: string
          who?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          preferences: Json
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          preferences?: Json
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          preferences?: Json
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          details: string | null
          employee_id: string | null
          id: string
          priority: string
          status: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: string | null
          employee_id?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: string | null
          employee_id?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_memories: {
        Row: {
          category: string
          content_enc: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          content_enc: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content_enc?: string
          created_at?: string
          id?: string
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
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
