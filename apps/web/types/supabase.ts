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
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accessibility_settings: {
        Row: {
          density: number
          high_contrast: boolean
          keyboard_mode: boolean
          low_cognitive_load: boolean
          persistent_focus: boolean
          reader_comfort: boolean
          reduce_motion: boolean
          transcription_first: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          density?: number
          high_contrast?: boolean
          keyboard_mode?: boolean
          low_cognitive_load?: boolean
          persistent_focus?: boolean
          reader_comfort?: boolean
          reduce_motion?: boolean
          transcription_first?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          density?: number
          high_contrast?: boolean
          keyboard_mode?: boolean
          low_cognitive_load?: boolean
          persistent_focus?: boolean
          reader_comfort?: boolean
          reduce_motion?: boolean
          transcription_first?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      action_requests: {
        Row: {
          action_id: string
          approval_state: string
          confidence: number | null
          created_at: string
          id: string
          payload: Json
          source_widget_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_id: string
          approval_state?: string
          confidence?: number | null
          created_at?: string
          id?: string
          payload?: Json
          source_widget_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_id?: string
          approval_state?: string
          confidence?: number | null
          created_at?: string
          id?: string
          payload?: Json
          source_widget_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      action_results: {
        Row: {
          action_request_id: string
          created_at: string
          id: string
          message: string
          metadata: Json
          ok: boolean
          rollback_token: string | null
        }
        Insert: {
          action_request_id: string
          created_at?: string
          id?: string
          message: string
          metadata?: Json
          ok?: boolean
          rollback_token?: string | null
        }
        Update: {
          action_request_id?: string
          created_at?: string
          id?: string
          message?: string
          metadata?: Json
          ok?: boolean
          rollback_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_results_action_request_id_fkey"
            columns: ["action_request_id"]
            isOneToOne: false
            referencedRelation: "action_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_events: {
        Row: {
          body: string | null
          created_at: string
          id: string
          metadata: Json
          read_at: string | null
          severity: string
          source: string
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          read_at?: string | null
          severity?: string
          source: string
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          read_at?: string | null
          severity?: string
          source?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          actor_id: string
          after: Json | null
          before: Json | null
          created_at: string
          id: string
          ip: string | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          ip?: string | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          after?: Json | null
          before?: Json | null
          created_at?: string
          id?: string
          ip?: string | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_notes: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          resource_id: string
          resource_type: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          resource_id: string
          resource_type: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          resource_id?: string
          resource_type?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          source: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          source?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          source?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      audit_events: {
        Row: {
          created_at: string
          description: string | null
          id: string
          metadata: Json
          related_entity_ids: string[]
          severity: string
          source: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          related_entity_ids?: string[]
          severity?: string
          source: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          related_entity_ids?: string[]
          severity?: string
          source?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      automation_configs: {
        Row: {
          action_types: string[]
          condition_types: string[]
          config: Json
          consent_requirements: string[]
          created_at: string
          id: string
          name: string
          requires_approval: boolean
          schedule: string | null
          service_requirements: string[]
          state: string
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_types?: string[]
          condition_types?: string[]
          config?: Json
          consent_requirements?: string[]
          created_at?: string
          id?: string
          name: string
          requires_approval?: boolean
          schedule?: string | null
          service_requirements?: string[]
          state?: string
          trigger_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_types?: string[]
          condition_types?: string[]
          config?: Json
          consent_requirements?: string[]
          created_at?: string
          id?: string
          name?: string
          requires_approval?: boolean
          schedule?: string | null
          service_requirements?: string[]
          state?: string
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      automation_runs: {
        Row: {
          automation_config_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          result: Json | null
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          automation_config_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          result?: Json | null
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          automation_config_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          result?: Json | null
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_automation_config_id_fkey"
            columns: ["automation_config_id"]
            isOneToOne: false
            referencedRelation: "automation_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_customers: {
        Row: {
          created_at: string
          id: string
          stripe_customer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          stripe_customer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          stripe_customer_id?: string
          user_id?: string
        }
        Relationships: []
      }
      billing_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          model: string
          provider: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          model?: string
          provider?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          model?: string
          provider?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          model: string | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          model?: string | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          model?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chess_games: {
        Row: {
          black: string
          created_at: string
          current_move_index: number
          event: string | null
          id: string
          last_viewed_at: string | null
          pgn: string
          played_at: string | null
          result: string | null
          site: string | null
          title: string | null
          updated_at: string
          user_id: string
          white: string
        }
        Insert: {
          black?: string
          created_at?: string
          current_move_index?: number
          event?: string | null
          id?: string
          last_viewed_at?: string | null
          pgn: string
          played_at?: string | null
          result?: string | null
          site?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
          white?: string
        }
        Update: {
          black?: string
          created_at?: string
          current_move_index?: number
          event?: string | null
          id?: string
          last_viewed_at?: string | null
          pgn?: string
          played_at?: string | null
          result?: string | null
          site?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
          white?: string
        }
        Relationships: []
      }
      chess_studies: {
        Row: {
          created_at: string
          description: string | null
          game_id: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          game_id?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          game_id?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chess_variations: {
        Row: {
          annotation: string | null
          branch_move_index: number | null
          created_at: string
          game_id: string | null
          id: string
          last_practiced: string | null
          pgn: string
          practiced_count: number
          start_fen: string
          study_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          annotation?: string | null
          branch_move_index?: number | null
          created_at?: string
          game_id?: string | null
          id?: string
          last_practiced?: string | null
          pgn: string
          practiced_count?: number
          start_fen?: string
          study_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          annotation?: string | null
          branch_move_index?: number | null
          created_at?: string
          game_id?: string | null
          id?: string
          last_practiced?: string | null
          pgn?: string
          practiced_count?: number
          start_fen?: string
          study_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chess_variations_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "chess_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chess_variations_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "chess_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_handoffs: {
        Row: {
          complete: boolean
          created_at: string
          due: string | null
          id: string
          owner: string | null
          priority: string
          scope: string
          title: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          complete?: boolean
          created_at?: string
          due?: string | null
          id?: string
          owner?: string | null
          priority?: string
          scope?: string
          title: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          complete?: boolean
          created_at?: string
          due?: string | null
          id?: string
          owner?: string | null
          priority?: string
          scope?: string
          title?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collaboration_handoffs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "collaboration_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      collaboration_workspaces: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          scope: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          scope?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          scope?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      command_workstreams: {
        Row: {
          automations: number
          blockers: number
          confidence: number
          created_at: string
          domain: string
          due: string | null
          id: string
          next_step: string | null
          owner: string | null
          priority: string
          progress: number
          status: string
          title: string
          user_id: string
        }
        Insert: {
          automations?: number
          blockers?: number
          confidence?: number
          created_at?: string
          domain?: string
          due?: string | null
          id?: string
          next_step?: string | null
          owner?: string | null
          priority?: string
          progress?: number
          status?: string
          title: string
          user_id: string
        }
        Update: {
          automations?: number
          blockers?: number
          confidence?: number
          created_at?: string
          domain?: string
          due?: string | null
          id?: string
          next_step?: string | null
          owner?: string | null
          priority?: string
          progress?: number
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      consent_records: {
        Row: {
          category: string
          created_at: string
          granted_at: string | null
          id: string
          revoked_at: string | null
          scope: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          granted_at?: string | null
          id?: string
          revoked_at?: string | null
          scope: string
          state?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          granted_at?: string | null
          id?: string
          revoked_at?: string | null
          scope?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      context_entries: {
        Row: {
          created_at: string
          data: Json
          entity_id: string
          entry_type: string
          id: string
          label: string
          linked_to: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          entity_id: string
          entry_type: string
          id?: string
          label: string
          linked_to?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          entity_id?: string
          entry_type?: string
          id?: string
          label?: string
          linked_to?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cost_events: {
        Row: {
          cost_usd: number | null
          created_at: string
          feature: string
          id: string
          metadata: Json | null
          provider: string
          units: number | null
          user_id: string | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          feature: string
          id?: string
          metadata?: Json | null
          provider: string
          units?: number | null
          user_id?: string | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          feature?: string
          id?: string
          metadata?: Json | null
          provider?: string
          units?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      countdowns: {
        Row: {
          created_at: string
          emoji: string
          id: string
          name: string
          target_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string
          id?: string
          name: string
          target_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          name?: string
          target_date?: string
          user_id?: string
        }
        Relationships: []
      }
      creative_layers: {
        Row: {
          color: string | null
          created_at: string
          height: number
          id: string
          layer_order: number
          layer_type: string
          locked: boolean
          name: string
          project_id: string
          user_id: string
          visible: boolean
          width: number
          x: number
          y: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          height?: number
          id?: string
          layer_order?: number
          layer_type?: string
          locked?: boolean
          name: string
          project_id: string
          user_id: string
          visible?: boolean
          width?: number
          x?: number
          y?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          height?: number
          id?: string
          layer_order?: number
          layer_type?: string
          locked?: boolean
          name?: string
          project_id?: string
          user_id?: string
          visible?: boolean
          width?: number
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "creative_layers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "creative_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      creative_projects: {
        Row: {
          created_at: string
          description: string | null
          format: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          format?: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          format?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      currency_rates: {
        Row: {
          base: string
          date: string
          fetched_at: string
          rates: Json
        }
        Insert: {
          base: string
          date: string
          fetched_at?: string
          rates: Json
        }
        Update: {
          base?: string
          date?: string
          fetched_at?: string
          rates?: Json
        }
        Relationships: []
      }
      dashboard_layouts: {
        Row: {
          id: string
          layout: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          layout?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          layout?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_classifications: {
        Row: {
          category: string
          classified_at: string
          email_id: string
          id: string
          is_manual: boolean
          sender: string
          subject: string | null
          user_id: string
        }
        Insert: {
          category: string
          classified_at?: string
          email_id: string
          id?: string
          is_manual?: boolean
          sender: string
          subject?: string | null
          user_id: string
        }
        Update: {
          category?: string
          classified_at?: string
          email_id?: string
          id?: string
          is_manual?: boolean
          sender?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          attempts: number
          created_at: string
          history_id: string | null
          id: string
          last_error: string | null
          message_id: string
          payload: Json | null
          priority: number
          stage: string
          status: string
          thread_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          history_id?: string | null
          id?: string
          last_error?: string | null
          message_id: string
          payload?: Json | null
          priority?: number
          stage?: string
          status?: string
          thread_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          history_id?: string | null
          id?: string
          last_error?: string | null
          message_id?: string
          payload?: Json | null
          priority?: number
          stage?: string
          status?: string
          thread_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          enabled: boolean
          id: string
          key: string
          rollout_pct: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string
          enabled?: boolean
          id?: string
          key: string
          rollout_pct?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          enabled?: boolean
          id?: string
          key?: string
          rollout_pct?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      feature_settings: {
        Row: {
          feature_id: string
          id: string
          settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          feature_id: string
          id?: string
          settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          feature_id?: string
          id?: string
          settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      file_uploads: {
        Row: {
          created_at: string
          id: string
          mime_type: string
          original_name: string
          s3_key: string
          size_bytes: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mime_type?: string
          original_name: string
          s3_key: string
          size_bytes?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mime_type?: string
          original_name?: string
          s3_key?: string
          size_bytes?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_accounts: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          institution: string | null
          metadata: Json
          name: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          institution?: string | null
          metadata?: Json
          name: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          institution?: string | null
          metadata?: Json
          name?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_subscriptions: {
        Row: {
          active: boolean
          amount: number
          billing_cycle: string | null
          cadence: string
          category: string
          created_at: string
          id: string
          metadata: Json
          name: string
          next_billing_date: string | null
          next_charge_on: string | null
          source: string
          user_id: string
        }
        Insert: {
          active?: boolean
          amount: number
          billing_cycle?: string | null
          cadence: string
          category?: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          next_billing_date?: string | null
          next_charge_on?: string | null
          source?: string
          user_id: string
        }
        Update: {
          active?: boolean
          amount?: number
          billing_cycle?: string | null
          cadence?: string
          category?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          next_billing_date?: string | null
          next_charge_on?: string | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      finance_transactions: {
        Row: {
          account_id: string | null
          amount: number
          category: string
          created_at: string
          id: string
          merchant: string | null
          metadata: Json
          notes: string | null
          occurred_on: string
          recurring_candidate: boolean
          title: string | null
          type: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          category: string
          created_at?: string
          id?: string
          merchant?: string | null
          metadata?: Json
          notes?: string | null
          occurred_on: string
          recurring_candidate?: boolean
          title?: string | null
          type?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string
          created_at?: string
          id?: string
          merchant?: string | null
          metadata?: Json
          notes?: string | null
          occurred_on?: string
          recurring_candidate?: boolean
          title?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "finance_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      form_filler_jobs: {
        Row: {
          created_at: string
          error: string | null
          fields_filled: Json | null
          id: string
          profile_id: string | null
          screenshot: string | null
          status: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          fields_filled?: Json | null
          id?: string
          profile_id?: string | null
          screenshot?: string | null
          status?: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          fields_filled?: Json | null
          id?: string
          profile_id?: string | null
          screenshot?: string | null
          status?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_filler_jobs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "form_filler_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      form_filler_profiles: {
        Row: {
          created_at: string
          fields: Json
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fields?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fields?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_completions: {
        Row: {
          completed_date: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          completed_date?: string
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          completed_date?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          created_at: string
          emoji: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      import_jobs: {
        Row: {
          created_at: string
          duplicate_strategy: string
          format: string
          id: string
          mappings: Json
          status: string
          updated_at: string
          user_id: string
          validation_results: Json
        }
        Insert: {
          created_at?: string
          duplicate_strategy: string
          format: string
          id?: string
          mappings?: Json
          status?: string
          updated_at?: string
          user_id: string
          validation_results?: Json
        }
        Update: {
          created_at?: string
          duplicate_strategy?: string
          format?: string
          id?: string
          mappings?: Json
          status?: string
          updated_at?: string
          user_id?: string
          validation_results?: Json
        }
        Relationships: []
      }
      import_mappings: {
        Row: {
          category: string | null
          created_at: string
          id: string
          import_job_id: string
          source_column: string
          target_field: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          import_job_id: string
          source_column: string
          target_field: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          import_job_id?: string
          source_column?: string
          target_field?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_mappings_import_job_id_fkey"
            columns: ["import_job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_connections: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          last_checked_at: string | null
          metadata: Json
          provider_id: string
          scopes: string[]
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_checked_at?: string | null
          metadata?: Json
          provider_id: string
          scopes?: string[]
          state?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          last_checked_at?: string | null
          metadata?: Json
          provider_id?: string
          scopes?: string[]
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_artifacts: {
        Row: {
          artifact_type: string
          created_at: string
          id: string
          job_id: string
          metadata: Json
          storage_path: string | null
        }
        Insert: {
          artifact_type: string
          created_at?: string
          id?: string
          job_id: string
          metadata?: Json
          storage_path?: string | null
        }
        Update: {
          artifact_type?: string
          created_at?: string
          id?: string
          job_id?: string
          metadata?: Json
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_artifacts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_logs: {
        Row: {
          created_at: string
          id: string
          job_id: string
          level: string
          message: string
          metadata: Json
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          level?: string
          message: string
          metadata?: Json
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          level?: string
          message?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "job_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_steps: {
        Row: {
          completed_at: string | null
          id: string
          job_id: string
          metadata: Json
          name: string
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          job_id: string
          metadata?: Json
          name: string
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          job_id?: string
          metadata?: Json
          name?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_steps_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          confidence: number | null
          created_at: string
          failure_reason: string | null
          id: string
          metadata: Json
          retry_count: number
          source_references: Json
          status: string
          type: string
          updated_at: string
          user_id: string
          user_visible_result: Json | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          failure_reason?: string | null
          id?: string
          metadata?: Json
          retry_count?: number
          source_references?: Json
          status?: string
          type: string
          updated_at?: string
          user_id: string
          user_visible_result?: Json | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          failure_reason?: string | null
          id?: string
          metadata?: Json
          retry_count?: number
          source_references?: Json
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
          user_visible_result?: Json | null
        }
        Relationships: []
      }
      journals: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          image_url: string | null
          metadata: Json | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          title: string
          type?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      knowledge_items: {
        Row: {
          body: string
          collection_ids: string[]
          created_at: string
          id: string
          kind: string
          metadata: Json
          sources: Json
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          collection_ids?: string[]
          created_at?: string
          id?: string
          kind: string
          metadata?: Json
          sources?: Json
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          collection_ids?: string[]
          created_at?: string
          id?: string
          kind?: string
          metadata?: Json
          sources?: Json
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      memory_cards: {
        Row: {
          back: string
          created_at: string
          deck_id: string
          due_date: string
          front: string
          id: string
          interval_days: number
          status: string
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string
          deck_id: string
          due_date?: string
          front: string
          id?: string
          interval_days?: number
          status?: string
          user_id: string
        }
        Update: {
          back?: string
          created_at?: string
          deck_id?: string
          due_date?: string
          front?: string
          id?: string
          interval_days?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_cards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "memory_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_decks: {
        Row: {
          created_at: string
          description: string | null
          domain: string
          id: string
          source: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          domain?: string
          id?: string
          source?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          domain?: string
          id?: string
          source?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      memory_routines: {
        Row: {
          created_at: string
          description: string | null
          domain: string
          enabled: boolean
          id: string
          minutes: number
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          domain?: string
          enabled?: boolean
          id?: string
          minutes?: number
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          domain?: string
          enabled?: boolean
          id?: string
          minutes?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      metric_snapshots: {
        Row: {
          created_at: string
          dimensions: Json | null
          id: string
          key: string
          value: number
        }
        Insert: {
          created_at?: string
          dimensions?: Json | null
          id?: string
          key: string
          value: number
        }
        Update: {
          created_at?: string
          dimensions?: Json | null
          id?: string
          key?: string
          value?: number
        }
        Relationships: []
      }
      mood_logs: {
        Row: {
          id: string
          logged_at: string
          logged_date: string
          mood: number
          note: string | null
          user_id: string
        }
        Insert: {
          id?: string
          logged_at?: string
          logged_date?: string
          mood: number
          note?: string | null
          user_id: string
        }
        Update: {
          id?: string
          logged_at?: string
          logged_date?: string
          mood?: number
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      onboarding_profiles: {
        Row: {
          created_at: string
          current_step: string
          id: string
          profile: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_step?: string
          id?: string
          profile?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_step?: string
          id?: string
          profile?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      performance_events: {
        Row: {
          created_at: string
          duration_ms: number
          id: string
          metadata: Json | null
          route: string | null
          source: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          duration_ms: number
          id?: string
          metadata?: Json | null
          route?: string | null
          source?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number
          id?: string
          metadata?: Json | null
          route?: string | null
          source?: string | null
          status?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      quick_notes: {
        Row: {
          content: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_bookmarks: {
        Row: {
          citation: string | null
          color: string
          created_at: string
          document_id: string
          id: string
          label: string | null
          position: Json
          user_id: string
        }
        Insert: {
          citation?: string | null
          color?: string
          created_at?: string
          document_id: string
          id?: string
          label?: string | null
          position?: Json
          user_id: string
        }
        Update: {
          citation?: string | null
          color?: string
          created_at?: string
          document_id?: string
          id?: string
          label?: string | null
          position?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_bookmarks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "reading_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_documents: {
        Row: {
          author: string | null
          created_at: string
          description: string | null
          external_id: string | null
          id: string
          language: string
          metadata: Json
          permissions: string[]
          provider_id: string
          source: Json
          subtitle: string | null
          thumbnail_url: string | null
          title: string
          total_pages: number | null
          type: string
          user_id: string | null
        }
        Insert: {
          author?: string | null
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          language?: string
          metadata?: Json
          permissions?: string[]
          provider_id: string
          source?: Json
          subtitle?: string | null
          thumbnail_url?: string | null
          title: string
          total_pages?: number | null
          type: string
          user_id?: string | null
        }
        Update: {
          author?: string | null
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          language?: string
          metadata?: Json
          permissions?: string[]
          provider_id?: string
          source?: Json
          subtitle?: string | null
          thumbnail_url?: string | null
          title?: string
          total_pages?: number | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      reading_highlights: {
        Row: {
          citation: string | null
          color: string
          created_at: string
          document_id: string
          id: string
          note: string | null
          position_end: Json
          position_start: Json
          text_snippet: string
          updated_at: string
          user_id: string
        }
        Insert: {
          citation?: string | null
          color?: string
          created_at?: string
          document_id: string
          id?: string
          note?: string | null
          position_end?: Json
          position_start?: Json
          text_snippet: string
          updated_at?: string
          user_id: string
        }
        Update: {
          citation?: string | null
          color?: string
          created_at?: string
          document_id?: string
          id?: string
          note?: string | null
          position_end?: Json
          position_start?: Json
          text_snippet?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_highlights_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "reading_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_notes: {
        Row: {
          citation: string | null
          content: string
          created_at: string
          document_id: string
          id: string
          position: Json
          position_end: Json | null
          tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          citation?: string | null
          content: string
          created_at?: string
          document_id: string
          id?: string
          position?: Json
          position_end?: Json | null
          tags?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          citation?: string | null
          content?: string
          created_at?: string
          document_id?: string
          id?: string
          position?: Json
          position_end?: Json | null
          tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_notes_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "reading_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_plans: {
        Row: {
          created_at: string
          current_day: number
          description: string | null
          entries: Json
          id: string
          is_active: boolean
          start_date: string | null
          streak: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_day?: number
          description?: string | null
          entries?: Json
          id?: string
          is_active?: boolean
          start_date?: string | null
          streak?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_day?: number
          description?: string | null
          entries?: Json
          id?: string
          is_active?: boolean
          start_date?: string | null
          streak?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_positions: {
        Row: {
          completed_at: string | null
          document_id: string
          id: string
          percent_complete: number
          position: Json
          time_spent_minutes: number
          updated_at: string
          user_id: string
          version_id: string | null
        }
        Insert: {
          completed_at?: string | null
          document_id: string
          id?: string
          percent_complete?: number
          position?: Json
          time_spent_minutes?: number
          updated_at?: string
          user_id: string
          version_id?: string | null
        }
        Update: {
          completed_at?: string | null
          document_id?: string
          id?: string
          percent_complete?: number
          position?: Json
          time_spent_minutes?: number
          updated_at?: string
          user_id?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_positions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "reading_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      recovery_profiles: {
        Row: {
          addiction: string | null
          created_at: string | null
          id: string
          start_time: string | null
          user_id: string | null
        }
        Insert: {
          addiction?: string | null
          created_at?: string | null
          id?: string
          start_time?: string | null
          user_id?: string | null
        }
        Update: {
          addiction?: string | null
          created_at?: string | null
          id?: string
          start_time?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      relapses: {
        Row: {
          id: string
          relapsed_at: string | null
          tracker_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          relapsed_at?: string | null
          tracker_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          relapsed_at?: string | null
          tracker_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relapses_tracker_id_fkey"
            columns: ["tracker_id"]
            isOneToOne: false
            referencedRelation: "recovery_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      study_chapters: {
        Row: {
          created_at: string
          id: string
          pgn: string
          position: number
          study_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pgn?: string
          position?: number
          study_id: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pgn?: string
          position?: number
          study_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_chapters_study_id_fkey"
            columns: ["study_id"]
            isOneToOne: false
            referencedRelation: "chess_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      supplements: {
        Row: {
          active: boolean
          created_at: string
          dose: string | null
          id: string
          name: string
          schedule_end: string | null
          schedule_start: string
          schedule_type: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          dose?: string | null
          id?: string
          name: string
          schedule_end?: string | null
          schedule_start: string
          schedule_type: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          dose?: string | null
          id?: string
          name?: string
          schedule_end?: string | null
          schedule_start?: string
          schedule_type?: string
          user_id?: string
        }
        Relationships: []
      }
      todos: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          text: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          text: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      tracking_entries: {
        Row: {
          category: string
          created_at: string
          entry_date: string
          id: string
          logged_at: string
          metadata: Json
          notes: string | null
          source: string
          tags: string[]
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          entry_date: string
          id?: string
          logged_at?: string
          metadata?: Json
          notes?: string | null
          source?: string
          tags?: string[]
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          entry_date?: string
          id?: string
          logged_at?: string
          metadata?: Json
          notes?: string | null
          source?: string
          tags?: string[]
          user_id?: string
        }
        Relationships: []
      }
      tracking_goals: {
        Row: {
          active: boolean
          category: string
          created_at: string
          id: string
          metric_key: string | null
          target_type: string
          target_value: number
          user_id: string
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          id?: string
          metric_key?: string | null
          target_type: string
          target_value: number
          user_id: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          id?: string
          metric_key?: string | null
          target_type?: string
          target_value?: number
          user_id?: string
        }
        Relationships: []
      }
      urges: {
        Row: {
          created_at: string | null
          id: string
          intensity: number | null
          tracker_id: string | null
          trigger: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          intensity?: number | null
          tracker_id?: string | null
          trigger?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          intensity?: number | null
          tracker_id?: string | null
          trigger?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "urges_tracker_id_fkey"
            columns: ["tracker_id"]
            isOneToOne: false
            referencedRelation: "recovery_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          bugs_found: string | null
          created_at: string
          feature_area: string | null
          feedback_type: string | null
          general_comment: string | null
          how_heard: string | null
          id: string
          satisfaction_rating: number | null
          user_id: string | null
          want_to_see: string | null
          what_confused: string | null
          what_i_did: string | null
          what_i_wanted: string | null
        }
        Insert: {
          bugs_found?: string | null
          created_at?: string
          feature_area?: string | null
          feedback_type?: string | null
          general_comment?: string | null
          how_heard?: string | null
          id?: string
          satisfaction_rating?: number | null
          user_id?: string | null
          want_to_see?: string | null
          what_confused?: string | null
          what_i_did?: string | null
          what_i_wanted?: string | null
        }
        Update: {
          bugs_found?: string | null
          created_at?: string
          feature_area?: string | null
          feedback_type?: string | null
          general_comment?: string | null
          how_heard?: string | null
          id?: string
          satisfaction_rating?: number | null
          user_id?: string | null
          want_to_see?: string | null
          what_confused?: string | null
          what_i_did?: string | null
          what_i_wanted?: string | null
        }
        Relationships: []
      }
      user_integration_keys: {
        Row: {
          api_key: string
          created_at: string
          id: string
          label: string | null
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          label?: string | null
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          label?: string | null
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_model_keys: {
        Row: {
          api_key_encrypted: string
          created_at: string
          id: string
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_encrypted: string
          created_at?: string
          id?: string
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string
          created_at?: string
          id?: string
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_tokens: {
        Row: {
          access_token: string
          expires_at: number | null
          gmail_email: string | null
          has_calendar: boolean
          has_drive: boolean
          has_microsoft: boolean
          last_history_id: string | null
          microsoft_access_token: string | null
          microsoft_refresh_token: string | null
          provider: string | null
          refresh_token: string | null
          updated_at: string
          user_id: string
          watch_expiry: string | null
        }
        Insert: {
          access_token: string
          expires_at?: number | null
          gmail_email?: string | null
          has_calendar?: boolean
          has_drive?: boolean
          has_microsoft?: boolean
          last_history_id?: string | null
          microsoft_access_token?: string | null
          microsoft_refresh_token?: string | null
          provider?: string | null
          refresh_token?: string | null
          updated_at?: string
          user_id: string
          watch_expiry?: string | null
        }
        Update: {
          access_token?: string
          expires_at?: number | null
          gmail_email?: string | null
          has_calendar?: boolean
          has_drive?: boolean
          has_microsoft?: boolean
          last_history_id?: string | null
          microsoft_access_token?: string | null
          microsoft_refresh_token?: string | null
          provider?: string | null
          refresh_token?: string | null
          updated_at?: string
          user_id?: string
          watch_expiry?: string | null
        }
        Relationships: []
      }
      watchlist_items: {
        Row: {
          asset_type: string
          config: Json
          created_at: string
          currency: string
          display_name: string
          id: string
          symbol: string
          user_id: string
        }
        Insert: {
          asset_type: string
          config?: Json
          created_at?: string
          currency?: string
          display_name: string
          id?: string
          symbol: string
          user_id: string
        }
        Update: {
          asset_type?: string
          config?: Json
          created_at?: string
          currency?: string
          display_name?: string
          id?: string
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      watchlist_readings: {
        Row: {
          fetched_at: string
          id: string
          item_id: string
          metadata: Json
          source: string
          user_id: string
          value: number
        }
        Insert: {
          fetched_at?: string
          id?: string
          item_id: string
          metadata?: Json
          source?: string
          user_id: string
          value: number
        }
        Update: {
          fetched_at?: string
          id?: string
          item_id?: string
          metadata?: Json
          source?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_readings_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "watchlist_items"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_instances: {
        Row: {
          active: boolean
          config: Json
          created_at: string
          feature_id: string
          id: string
          updated_at: string
          user_id: string
          widget_id: string
        }
        Insert: {
          active?: boolean
          config?: Json
          created_at?: string
          feature_id: string
          id?: string
          updated_at?: string
          user_id: string
          widget_id: string
        }
        Update: {
          active?: boolean
          config?: Json
          created_at?: string
          feature_id?: string
          id?: string
          updated_at?: string
          user_id?: string
          widget_id?: string
        }
        Relationships: []
      }
      widget_settings: {
        Row: {
          id: string
          settings: Json
          updated_at: string
          user_id: string
          widget_id: string
        }
        Insert: {
          id?: string
          settings?: Json
          updated_at?: string
          user_id: string
          widget_id: string
        }
        Update: {
          id?: string
          settings?: Json
          updated_at?: string
          user_id?: string
          widget_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_month_day: { Args: { ts: string }; Returns: string }
      grant_admin: { Args: { target_email: string }; Returns: undefined }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
