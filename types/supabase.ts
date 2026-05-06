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
            chess_games: {
                Row: {
                    black: string;
                    created_at: string;
                    current_move_index: number;
                    event: string | null;
                    id: string;
                    last_viewed_at: string | null;
                    pgn: string;
                    played_at: string | null;
                    result: string | null;
                    site: string | null;
                    title: string | null;
                    updated_at: string;
                    user_id: string;
                    white: string;
                };
                Insert: {
                    black?: string;
                    created_at?: string;
                    current_move_index?: number;
                    event?: string | null;
                    id?: string;
                    last_viewed_at?: string | null;
                    pgn: string;
                    played_at?: string | null;
                    result?: string | null;
                    site?: string | null;
                    title?: string | null;
                    updated_at?: string;
                    user_id: string;
                    white?: string;
                };
                Update: {
                    black?: string;
                    created_at?: string;
                    current_move_index?: number;
                    event?: string | null;
                    id?: string;
                    last_viewed_at?: string | null;
                    pgn?: string;
                    played_at?: string | null;
                    result?: string | null;
                    site?: string | null;
                    title?: string | null;
                    updated_at?: string;
                    user_id?: string;
                    white?: string;
                };
                Relationships: [];
            };
            chess_studies: {
                Row: {
                    created_at: string;
                    description: string | null;
                    id: string;
                    title: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    description?: string | null;
                    id?: string;
                    title: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    description?: string | null;
                    id?: string;
                    title?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            chess_variations: {
                Row: {
                    annotation: string | null;
                    branch_move_index: number | null;
                    created_at: string;
                    game_id: string | null;
                    id: string;
                    last_practiced: string | null;
                    pgn: string;
                    practiced_count: number;
                    start_fen: string;
                    study_id: string | null;
                    title: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    annotation?: string | null;
                    branch_move_index?: number | null;
                    created_at?: string;
                    game_id?: string | null;
                    id?: string;
                    last_practiced?: string | null;
                    pgn: string;
                    practiced_count?: number;
                    start_fen?: string;
                    study_id?: string | null;
                    title?: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    annotation?: string | null;
                    branch_move_index?: number | null;
                    created_at?: string;
                    game_id?: string | null;
                    id?: string;
                    last_practiced?: string | null;
                    pgn?: string;
                    practiced_count?: number;
                    start_fen?: string;
                    study_id?: string | null;
                    title?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'chess_variations_game_id_fkey';
                        columns: ['game_id'];
                        isOneToOne: false;
                        referencedRelation: 'chess_games';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'chess_variations_study_id_fkey';
                        columns: ['study_id'];
                        isOneToOne: false;
                        referencedRelation: 'chess_studies';
                        referencedColumns: ['id'];
                    },
                ];
            };
            countdowns: {
                Row: {
                    created_at: string;
                    emoji: string;
                    id: string;
                    name: string;
                    target_date: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    emoji?: string;
                    id?: string;
                    name: string;
                    target_date: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    emoji?: string;
                    id?: string;
                    name?: string;
                    target_date?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            dashboard_layouts: {
                Row: {
                    id: string;
                    layout: Json;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    id?: string;
                    layout?: Json;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    id?: string;
                    layout?: Json;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            email_classifications: {
                Row: {
                    category: string;
                    classified_at: string;
                    email_id: string;
                    id: string;
                    is_manual: boolean;
                    sender: string;
                    subject: string | null;
                    user_id: string;
                };
                Insert: {
                    category: string;
                    classified_at?: string;
                    email_id: string;
                    id?: string;
                    is_manual?: boolean;
                    sender: string;
                    subject?: string | null;
                    user_id: string;
                };
                Update: {
                    category?: string;
                    classified_at?: string;
                    email_id?: string;
                    id?: string;
                    is_manual?: boolean;
                    sender?: string;
                    subject?: string | null;
                    user_id?: string;
                };
                Relationships: [];
            };
            habit_completions: {
                Row: {
                    completed_date: string;
                    habit_id: string;
                    id: string;
                    user_id: string;
                };
                Insert: {
                    completed_date?: string;
                    habit_id: string;
                    id?: string;
                    user_id: string;
                };
                Update: {
                    completed_date?: string;
                    habit_id?: string;
                    id?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'habit_completions_habit_id_fkey';
                        columns: ['habit_id'];
                        isOneToOne: false;
                        referencedRelation: 'habits';
                        referencedColumns: ['id'];
                    },
                ];
            };
            habits: {
                Row: {
                    created_at: string;
                    emoji: string;
                    id: string;
                    name: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    emoji?: string;
                    id?: string;
                    name: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    emoji?: string;
                    id?: string;
                    name?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            journals: {
                Row: {
                    content: string;
                    created_at: string;
                    deleted_at: string | null;
                    id: string;
                    image_url: string | null;
                    metadata: Json | null;
                    title: string;
                    updated_at: string | null;
                    user_id: string;
                };
                Insert: {
                    content: string;
                    created_at?: string;
                    deleted_at?: string | null;
                    id?: string;
                    image_url?: string | null;
                    metadata?: Json | null;
                    title: string;
                    updated_at?: string | null;
                    user_id: string;
                };
                Update: {
                    content?: string;
                    created_at?: string;
                    deleted_at?: string | null;
                    id?: string;
                    image_url?: string | null;
                    metadata?: Json | null;
                    title?: string;
                    updated_at?: string | null;
                    user_id?: string;
                };
                Relationships: [];
            };
            mood_logs: {
                Row: {
                    id: string;
                    logged_at: string;
                    logged_date: string;
                    mood: number;
                    note: string | null;
                    user_id: string;
                };
                Insert: {
                    id?: string;
                    logged_at?: string;
                    logged_date?: string;
                    mood: number;
                    note?: string | null;
                    user_id: string;
                };
                Update: {
                    id?: string;
                    logged_at?: string;
                    logged_date?: string;
                    mood?: number;
                    note?: string | null;
                    user_id?: string;
                };
                Relationships: [];
            };
            profiles: {
                Row: {
                    created_at: string | null;
                    full_name: string | null;
                    id: string;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    full_name?: string | null;
                    id: string;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    full_name?: string | null;
                    id?: string;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
            quick_notes: {
                Row: {
                    content: string;
                    id: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    content?: string;
                    id?: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    content?: string;
                    id?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            recovery_profiles: {
                Row: {
                    addiction: string | null;
                    created_at: string | null;
                    id: string;
                    start_time: string | null;
                    user_id: string | null;
                };
                Insert: {
                    addiction?: string | null;
                    created_at?: string | null;
                    id?: string;
                    start_time?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    addiction?: string | null;
                    created_at?: string | null;
                    id?: string;
                    start_time?: string | null;
                    user_id?: string | null;
                };
                Relationships: [];
            };
            relapses: {
                Row: {
                    id: string;
                    relapsed_at: string | null;
                    tracker_id: string | null;
                    user_id: string | null;
                };
                Insert: {
                    id?: string;
                    relapsed_at?: string | null;
                    tracker_id?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    id?: string;
                    relapsed_at?: string | null;
                    tracker_id?: string | null;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'relapses_tracker_id_fkey';
                        columns: ['tracker_id'];
                        isOneToOne: false;
                        referencedRelation: 'recovery_profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            study_chapters: {
                Row: {
                    created_at: string;
                    id: string;
                    pgn: string;
                    position: number;
                    study_id: string;
                    title: string;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string;
                    id?: string;
                    pgn?: string;
                    position?: number;
                    study_id: string;
                    title?: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    id?: string;
                    pgn?: string;
                    position?: number;
                    study_id?: string;
                    title?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'study_chapters_study_id_fkey';
                        columns: ['study_id'];
                        isOneToOne: false;
                        referencedRelation: 'chess_studies';
                        referencedColumns: ['id'];
                    },
                ];
            };
            todos: {
                Row: {
                    completed: boolean;
                    completed_at: string | null;
                    created_at: string;
                    id: string;
                    text: string;
                    user_id: string;
                };
                Insert: {
                    completed?: boolean;
                    completed_at?: string | null;
                    created_at?: string;
                    id?: string;
                    text: string;
                    user_id: string;
                };
                Update: {
                    completed?: boolean;
                    completed_at?: string | null;
                    created_at?: string;
                    id?: string;
                    text?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            urges: {
                Row: {
                    created_at: string | null;
                    id: string;
                    intensity: number | null;
                    tracker_id: string | null;
                    trigger: string | null;
                    user_id: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    intensity?: number | null;
                    tracker_id?: string | null;
                    trigger?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    intensity?: number | null;
                    tracker_id?: string | null;
                    trigger?: string | null;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'urges_tracker_id_fkey';
                        columns: ['tracker_id'];
                        isOneToOne: false;
                        referencedRelation: 'recovery_profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            user_tokens: {
                Row: {
                    access_token: string;
                    expires_at: number | null;
                    provider: string | null;
                    refresh_token: string | null;
                    updated_at: string;
                    user_id: string;
                };
                Insert: {
                    access_token: string;
                    expires_at?: number | null;
                    provider?: string | null;
                    refresh_token?: string | null;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    access_token?: string;
                    expires_at?: number | null;
                    provider?: string | null;
                    refresh_token?: string | null;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [];
            };
            widget_settings: {
                Row: {
                    id: string;
                    settings: Json;
                    updated_at: string;
                    user_id: string;
                    widget_id: string;
                };
                Insert: {
                    id?: string;
                    settings?: Json;
                    updated_at?: string;
                    user_id: string;
                    widget_id: string;
                };
                Update: {
                    id?: string;
                    settings?: Json;
                    updated_at?: string;
                    user_id?: string;
                    widget_id?: string;
                };
                Relationships: [];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            get_month_day: { Args: { ts: string }; Returns: string };
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
    keyof Database,
    'public'
>];

export type Tables<
    DefaultSchemaTableNameOrOptions extends
        | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
              DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
          DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
          Row: infer R;
      }
        ? R
        : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
            DefaultSchema['Views'])
      ? (DefaultSchema['Tables'] &
            DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R;
        }
          ? R
          : never
      : never;

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Insert: infer I;
      }
        ? I
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Insert: infer I;
        }
          ? I
          : never
      : never;

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Update: infer U;
      }
        ? U
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Update: infer U;
        }
          ? U
          : never
      : never;

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
        | keyof DefaultSchema['Enums']
        | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
        : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
      ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
      : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        | keyof DefaultSchema['CompositeTypes']
        | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
        : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
      ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
      : never;

export const Constants = {
    graphql_public: {
        Enums: {},
    },
    public: {
        Enums: {},
    },
} as const;
