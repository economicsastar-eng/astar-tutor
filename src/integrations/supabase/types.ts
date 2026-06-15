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
      diagnostic_results: {
        Row: {
          completed_at: string
          id: string
          results: Json
          strongest_theme: number | null
          user_id: string
          weakest_theme: number | null
        }
        Insert: {
          completed_at?: string
          id?: string
          results: Json
          strongest_theme?: number | null
          user_id: string
          weakest_theme?: number | null
        }
        Update: {
          completed_at?: string
          id?: string
          results?: Json
          strongest_theme?: number | null
          user_id?: string
          weakest_theme?: number | null
        }
        Relationships: []
      }
      essay_submissions: {
        Row: {
          essay_text: string
          exam_board: string
          feedback_json: Json | null
          id: string
          mark_allocation: number
          mark_awarded: number | null
          max_mark: number | null
          question_text: string
          question_type: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          essay_text: string
          exam_board: string
          feedback_json?: Json | null
          id?: string
          mark_allocation: number
          mark_awarded?: number | null
          max_mark?: number | null
          question_text: string
          question_type: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          essay_text?: string
          exam_board?: string
          feedback_json?: Json | null
          id?: string
          mark_allocation?: number
          mark_awarded?: number | null
          max_mark?: number | null
          question_text?: string
          question_type?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcard_progress: {
        Row: {
          card_id: string
          created_at: string
          ease_factor: number
          id: string
          interval_days: number
          last_rating: string | null
          last_reviewed_at: string | null
          next_due_at: string
          repetitions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_rating?: string | null
          last_reviewed_at?: string | null
          next_due_at?: string
          repetitions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          last_rating?: string | null
          last_reviewed_at?: string | null
          next_due_at?: string
          repetitions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_progress_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          answer: string
          card_type: string
          created_at: string
          difficulty_base: number
          id: string
          question: string
          real_world_example: string | null
          spec_ref: string
          subtopic_name: string
          theme_number: number
          topic_name: string
        }
        Insert: {
          answer: string
          card_type: string
          created_at?: string
          difficulty_base: number
          id?: string
          question: string
          real_world_example?: string | null
          spec_ref: string
          subtopic_name: string
          theme_number: number
          topic_name: string
        }
        Update: {
          answer?: string
          card_type?: string
          created_at?: string
          difficulty_base?: number
          id?: string
          question?: string
          real_world_example?: string | null
          spec_ref?: string
          subtopic_name?: string
          theme_number?: number
          topic_name?: string
        }
        Relationships: []
      }
      lesson_blocks: {
        Row: {
          block_type: string
          content_markdown: string | null
          created_at: string
          id: string
          key_terms: Json | null
          lesson_id: string
          sort_order: number
          summary_points: Json | null
        }
        Insert: {
          block_type: string
          content_markdown?: string | null
          created_at?: string
          id?: string
          key_terms?: Json | null
          lesson_id: string
          sort_order: number
          summary_points?: Json | null
        }
        Update: {
          block_type?: string
          content_markdown?: string | null
          created_at?: string
          id?: string
          key_terms?: Json | null
          lesson_id?: string
          sort_order?: number
          summary_points?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_blocks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_completions: {
        Row: {
          completed_at: string
          id: string
          lesson_id: string
          score_percent: number
          user_id: string
          via_test_out: boolean
        }
        Insert: {
          completed_at?: string
          id?: string
          lesson_id: string
          score_percent?: number
          user_id: string
          via_test_out?: boolean
        }
        Update: {
          completed_at?: string
          id?: string
          lesson_id?: string
          score_percent?: number
          user_id?: string
          via_test_out?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "lesson_completions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          current_block_order: number
          id: string
          lesson_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          current_block_order?: number
          id?: string
          lesson_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          current_block_order?: number
          id?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          estimated_minutes: number
          id: string
          is_free: boolean
          section_id: string
          slug: string
          sort_order: number
          spec_reference: string
          title: string
        }
        Insert: {
          created_at?: string
          estimated_minutes?: number
          id?: string
          is_free?: boolean
          section_id: string
          slug: string
          sort_order: number
          spec_reference?: string
          title: string
        }
        Update: {
          created_at?: string
          estimated_minutes?: number
          id?: string
          is_free?: boolean
          section_id?: string
          slug?: string
          sort_order?: number
          spec_reference?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          confidence_level: string | null
          created_at: string
          current_streak: number
          daily_target: number
          exam_board: string
          exam_date: string | null
          id: string
          longest_streak: number
          name: string
          onboarded: boolean
          onboarding_complete: boolean
          onboarding_completed: boolean
          phone_number: string | null
          phone_verified: boolean
          plan: string
          plan_expires_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          target_grade: string
          updated_at: string
          weekly_hours: string | null
          year_group: string
        }
        Insert: {
          confidence_level?: string | null
          created_at?: string
          current_streak?: number
          daily_target?: number
          exam_board?: string
          exam_date?: string | null
          id: string
          longest_streak?: number
          name?: string
          onboarded?: boolean
          onboarding_complete?: boolean
          onboarding_completed?: boolean
          phone_number?: string | null
          phone_verified?: boolean
          plan?: string
          plan_expires_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          target_grade?: string
          updated_at?: string
          weekly_hours?: string | null
          year_group?: string
        }
        Update: {
          confidence_level?: string | null
          created_at?: string
          current_streak?: number
          daily_target?: number
          exam_board?: string
          exam_date?: string | null
          id?: string
          longest_streak?: number
          name?: string
          onboarded?: boolean
          onboarding_complete?: boolean
          onboarding_completed?: boolean
          phone_number?: string | null
          phone_verified?: boolean
          plan?: string
          plan_expires_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          target_grade?: string
          updated_at?: string
          weekly_hours?: string | null
          year_group?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          attempted_at: string
          context: string
          id: string
          is_correct: boolean
          lesson_id: string | null
          question_id: string
          selected_option: string
          user_id: string
        }
        Insert: {
          attempted_at?: string
          context?: string
          id?: string
          is_correct: boolean
          lesson_id?: string | null
          question_id: string
          selected_option: string
          user_id: string
        }
        Update: {
          attempted_at?: string
          context?: string
          id?: string
          is_correct?: boolean
          lesson_id?: string | null
          question_id?: string
          selected_option?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_option: string
          created_at: string
          explanation: string
          id: string
          lesson_block_id: string | null
          lesson_id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          sort_order: number
        }
        Insert: {
          correct_option: string
          created_at?: string
          explanation?: string
          id?: string
          lesson_block_id?: string | null
          lesson_id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          sort_order?: number
        }
        Update: {
          correct_option?: string
          created_at?: string
          explanation?: string
          id?: string
          lesson_block_id?: string | null
          lesson_id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_text?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_lesson_block_id_fkey"
            columns: ["lesson_block_id"]
            isOneToOne: false
            referencedRelation: "lesson_blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      review_queue: {
        Row: {
          correct_streak: number
          id: string
          is_mastered: boolean
          next_review_date: string
          question_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          correct_streak?: number
          id?: string
          is_mastered?: boolean
          next_review_date?: string
          question_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          correct_streak?: number
          id?: string
          is_mastered?: boolean
          next_review_date?: string
          question_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_queue_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      sections: {
        Row: {
          created_at: string
          description: string
          id: string
          sort_order: number
          theme_number: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          sort_order: number
          theme_number: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          sort_order?: number
          theme_number?: number
          title?: string
        }
        Relationships: []
      }
      test_out_attempts: {
        Row: {
          attempted_at: string
          id: string
          lesson_id: string
          passed: boolean
          score: number
          total: number
          user_id: string
        }
        Insert: {
          attempted_at?: string
          id?: string
          lesson_id: string
          passed: boolean
          score: number
          total: number
          user_id: string
        }
        Update: {
          attempted_at?: string
          id?: string
          lesson_id?: string
          passed?: boolean
          score?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_out_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          activity_date: string
          id: string
          lessons_completed: number
          questions_answered: number
          user_id: string
        }
        Insert: {
          activity_date?: string
          id?: string
          lessons_completed?: number
          questions_answered?: number
          user_id: string
        }
        Update: {
          activity_date?: string
          id?: string
          lessons_completed?: number
          questions_answered?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_quiz_question: {
        Args: { _question_id: string; _user_id: string }
        Returns: boolean
      }
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
    Enums: {},
  },
} as const
