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
      meal_plans: {
        Row: {
          created_at: string
          data: string
          descricao: string
          id: string
          ingredientes_relacionados: string[]
          refeicao: string
        }
        Insert: {
          created_at?: string
          data: string
          descricao?: string
          id?: string
          ingredientes_relacionados?: string[]
          refeicao: string
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          ingredientes_relacionados?: string[]
          refeicao?: string
        }
        Relationships: []
      }
      pantry_items: {
        Row: {
          categoria: string
          created_at: string
          id: string
          nome_item: string
          quantidade: number
          quantidade_minima: number
          validade: string | null
        }
        Insert: {
          categoria?: string
          created_at?: string
          id?: string
          nome_item: string
          quantidade?: number
          quantidade_minima?: number
          validade?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string
          id?: string
          nome_item?: string
          quantidade?: number
          quantidade_minima?: number
          validade?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          avatar: string | null
          created_at: string
          email: string
          id: string
          nivel: string
          nome: string
          pontos: number
          saldo: number
          sequencia_dias: number
        }
        Insert: {
          ativo?: boolean
          avatar?: string | null
          created_at?: string
          email: string
          id: string
          nivel?: string
          nome: string
          pontos?: number
          saldo?: number
          sequencia_dias?: number
        }
        Update: {
          ativo?: boolean
          avatar?: string | null
          created_at?: string
          email?: string
          id?: string
          nivel?: string
          nome?: string
          pontos?: number
          saldo?: number
          sequencia_dias?: number
        }
        Relationships: []
      }
      rewards: {
        Row: {
          data: string
          descricao: string
          id: string
          tipo: string
          usuario_id: string
          valor: number
        }
        Insert: {
          data?: string
          descricao?: string
          id?: string
          tipo: string
          usuario_id: string
          valor: number
        }
        Update: {
          data?: string
          descricao?: string
          id?: string
          tipo?: string
          usuario_id?: string
          valor?: number
        }
        Relationships: []
      }
      shopping_items: {
        Row: {
          created_at: string
          gerado_automaticamente: boolean
          id: string
          nome_item: string
          quantidade: number
          status: string
        }
        Insert: {
          created_at?: string
          gerado_automaticamente?: boolean
          id?: string
          nome_item: string
          quantidade?: number
          status?: string
        }
        Update: {
          created_at?: string
          gerado_automaticamente?: boolean
          id?: string
          nome_item?: string
          quantidade?: number
          status?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_by: string | null
          data_conclusao: string | null
          data_criacao: string
          data_limite: string | null
          descricao: string
          frequencia: string
          id: string
          status: string
          titulo: string
          usuario_id: string
          valor_recompensa: number
        }
        Insert: {
          created_by?: string | null
          data_conclusao?: string | null
          data_criacao?: string
          data_limite?: string | null
          descricao?: string
          frequencia?: string
          id?: string
          status?: string
          titulo: string
          usuario_id: string
          valor_recompensa?: number
        }
        Update: {
          created_by?: string | null
          data_conclusao?: string | null
          data_criacao?: string
          data_limite?: string | null
          descricao?: string
          frequencia?: string
          id?: string
          status?: string
          titulo?: string
          usuario_id?: string
          valor_recompensa?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      complete_task_with_reward: {
        Args: { _task_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "master" | "simples"
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
      app_role: ["master", "simples"],
    },
  },
} as const
