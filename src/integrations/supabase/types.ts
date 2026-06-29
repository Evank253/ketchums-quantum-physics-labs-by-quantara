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
      admin_logs: {
        Row: {
          created_at: string
          id: string
          kind: string
          payload: Json | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          payload?: Json | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          payload?: Json | null
          subject?: string | null
        }
        Relationships: []
      }
      annex_runs: {
        Row: {
          created_at: string
          engine_value: number | null
          id: string
          payload: Json | null
          reference_value: number | null
          sigma: number | null
          theory_id: string
          theory_name: string
          triggered_by: string | null
          verdict: string | null
        }
        Insert: {
          created_at?: string
          engine_value?: number | null
          id?: string
          payload?: Json | null
          reference_value?: number | null
          sigma?: number | null
          theory_id: string
          theory_name: string
          triggered_by?: string | null
          verdict?: string | null
        }
        Update: {
          created_at?: string
          engine_value?: number | null
          id?: string
          payload?: Json | null
          reference_value?: number | null
          sigma?: number | null
          theory_id?: string
          theory_name?: string
          triggered_by?: string | null
          verdict?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          actor_id: string | null
          created_at: string
          id: number
          new_data: Json | null
          old_data: Json | null
          op: string
          row_id: string | null
          table_name: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: number
          new_data?: Json | null
          old_data?: Json | null
          op: string
          row_id?: string | null
          table_name: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: number
          new_data?: Json | null
          old_data?: Json | null
          op?: string
          row_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      base_payments: {
        Row: {
          addon: string | null
          amount_usd: number
          created_at: string
          id: string
          payment_id: string
          plan: string | null
          raw: Json | null
          status: string
          testnet: boolean
          tx_hash: string | null
          updated_at: string
          user_id: string | null
          wallet_address: string
        }
        Insert: {
          addon?: string | null
          amount_usd: number
          created_at?: string
          id?: string
          payment_id: string
          plan?: string | null
          raw?: Json | null
          status?: string
          testnet?: boolean
          tx_hash?: string | null
          updated_at?: string
          user_id?: string | null
          wallet_address: string
        }
        Update: {
          addon?: string | null
          amount_usd?: number
          created_at?: string
          id?: string
          payment_id?: string
          plan?: string | null
          raw?: Json | null
          status?: string
          testnet?: boolean
          tx_hash?: string | null
          updated_at?: string
          user_id?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          body: string
          created_at: string
          display_name: string
          id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          display_name: string
          id?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          display_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      compute_jobs: {
        Row: {
          codata_result: Json | null
          completed_at: string | null
          created_at: string
          engine_result: Json | null
          error: string | null
          id: string
          inputs: Json
          literature_result: Json | null
          model: string
          sigma: number | null
          status: string
          user_id: string
          verdict: string | null
        }
        Insert: {
          codata_result?: Json | null
          completed_at?: string | null
          created_at?: string
          engine_result?: Json | null
          error?: string | null
          id?: string
          inputs?: Json
          literature_result?: Json | null
          model: string
          sigma?: number | null
          status?: string
          user_id: string
          verdict?: string | null
        }
        Update: {
          codata_result?: Json | null
          completed_at?: string | null
          created_at?: string
          engine_result?: Json | null
          error?: string | null
          id?: string
          inputs?: Json
          literature_result?: Json | null
          model?: string
          sigma?: number | null
          status?: string
          user_id?: string
          verdict?: string | null
        }
        Relationships: []
      }
      compute_warmup_cache: {
        Row: {
          cache_key: string
          created_at: string
          hit_count: number
          model: string
          payload: Json
          updated_at: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          hit_count?: number
          model: string
          payload: Json
          updated_at?: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          hit_count?: number
          model?: string
          payload?: Json
          updated_at?: string
        }
        Relationships: []
      }
      dat_claims: {
        Row: {
          amount: number
          block_number: number | null
          created_at: string
          error: string | null
          id: string
          reason: string
          reason_key: string | null
          status: string
          tx_hash: string | null
          updated_at: string
          wallet: string
        }
        Insert: {
          amount: number
          block_number?: number | null
          created_at?: string
          error?: string | null
          id?: string
          reason: string
          reason_key?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          wallet: string
        }
        Update: {
          amount?: number
          block_number?: number | null
          created_at?: string
          error?: string | null
          id?: string
          reason?: string
          reason_key?: string | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          wallet?: string
        }
        Relationships: []
      }
      dat_mint_audit: {
        Row: {
          action: string
          created_at: string
          error: string | null
          id: string
          ip: string | null
          payload: Json | null
          result: Json | null
          status: string
          wallet: string | null
        }
        Insert: {
          action: string
          created_at?: string
          error?: string | null
          id?: string
          ip?: string | null
          payload?: Json | null
          result?: Json | null
          status: string
          wallet?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          error?: string | null
          id?: string
          ip?: string | null
          payload?: Json | null
          result?: Json | null
          status?: string
          wallet?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          body: string
          category: string | null
          created_at: string
          display_name: string | null
          id: string
          is_approved: boolean
          is_public: boolean
          rating: number | null
          user_id: string | null
        }
        Insert: {
          body: string
          category?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_approved?: boolean
          is_public?: boolean
          rating?: number | null
          user_id?: string | null
        }
        Update: {
          body?: string
          category?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_approved?: boolean
          is_public?: boolean
          rating?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      institution_api_keys: {
        Row: {
          created_at: string
          id: string
          key_hash: string
          label: string
          last_used_at: string | null
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key_hash: string
          label: string
          last_used_at?: string | null
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key_hash?: string
          label?: string
          last_used_at?: string | null
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_dispatch: {
        Row: {
          attempts: number
          body: string
          created_at: string
          email: string
          error: string | null
          id: string
          recipient: string
          recipient_kind: string
          sent_at: string | null
          solver: string
          status: string
          subject: string
          theory: string
        }
        Insert: {
          attempts?: number
          body: string
          created_at?: string
          email: string
          error?: string | null
          id?: string
          recipient: string
          recipient_kind: string
          sent_at?: string | null
          solver: string
          status?: string
          subject: string
          theory: string
        }
        Update: {
          attempts?: number
          body?: string
          created_at?: string
          email?: string
          error?: string | null
          id?: string
          recipient?: string
          recipient_kind?: string
          sent_at?: string | null
          solver?: string
          status?: string
          subject?: string
          theory?: string
        }
        Relationships: []
      }
      owner_inventions: {
        Row: {
          breakdown: Json
          category: string
          civilization: string | null
          created_at: string
          emailed_at: string | null
          id: string
          legal: string | null
          materials: Json
          problem: string | null
          report_md: string
          safety: string | null
          steps: Json
          summary: string
          title: string
        }
        Insert: {
          breakdown?: Json
          category: string
          civilization?: string | null
          created_at?: string
          emailed_at?: string | null
          id?: string
          legal?: string | null
          materials?: Json
          problem?: string | null
          report_md: string
          safety?: string | null
          steps?: Json
          summary: string
          title: string
        }
        Update: {
          breakdown?: Json
          category?: string
          civilization?: string | null
          created_at?: string
          emailed_at?: string | null
          id?: string
          legal?: string | null
          materials?: Json
          problem?: string | null
          report_md?: string
          safety?: string | null
          steps?: Json
          summary?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          updated_at: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          updated_at?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          updated_at?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      public_achievements: {
        Row: {
          achievement_id: string
          created_at: string
          description: string | null
          id: string
          operator: string | null
          reward: number
          tier: string
          title: string
          unlocked_at: string
        }
        Insert: {
          achievement_id: string
          created_at?: string
          description?: string | null
          id?: string
          operator?: string | null
          reward?: number
          tier?: string
          title: string
          unlocked_at?: string
        }
        Update: {
          achievement_id?: string
          created_at?: string
          description?: string | null
          id?: string
          operator?: string | null
          reward?: number
          tier?: string
          title?: string
          unlocked_at?: string
        }
        Relationships: []
      }
      run_cards: {
        Row: {
          backend_version: string
          created_at: string
          id: string
          input_hash: string
          job_id: string
          output_hash: string
          payload: Json
          run_id: string
          seed: number | null
          user_id: string
        }
        Insert: {
          backend_version: string
          created_at?: string
          id?: string
          input_hash: string
          job_id: string
          output_hash: string
          payload?: Json
          run_id: string
          seed?: number | null
          user_id: string
        }
        Update: {
          backend_version?: string
          created_at?: string
          id?: string
          input_hash?: string
          job_id?: string
          output_hash?: string
          payload?: Json
          run_id?: string
          seed?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "run_cards_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "compute_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alerts: {
        Row: {
          body: string | null
          created_at: string
          emailed_at: string | null
          finding_id: string | null
          id: string
          payload: Json | null
          read_at: string | null
          severity: string
          source: string
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          emailed_at?: string | null
          finding_id?: string | null
          id?: string
          payload?: Json | null
          read_at?: string | null
          severity: string
          source: string
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          emailed_at?: string | null
          finding_id?: string | null
          id?: string
          payload?: Json | null
          read_at?: string | null
          severity?: string
          source?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_alerts_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "security_findings"
            referencedColumns: ["id"]
          },
        ]
      }
      security_findings: {
        Row: {
          affected_resource: string | null
          created_at: string
          description: string | null
          detected_at: string
          external_id: string | null
          fix_log: Json | null
          fix_strategy: string | null
          id: string
          payload: Json | null
          resolved_at: string | null
          severity: string
          source: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          affected_resource?: string | null
          created_at?: string
          description?: string | null
          detected_at?: string
          external_id?: string | null
          fix_log?: Json | null
          fix_strategy?: string | null
          id?: string
          payload?: Json | null
          resolved_at?: string | null
          severity: string
          source: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          affected_resource?: string | null
          created_at?: string
          description?: string | null
          detected_at?: string
          external_id?: string | null
          fix_log?: Json | null
          fix_strategy?: string | null
          id?: string
          payload?: Json | null
          resolved_at?: string | null
          severity?: string
          source?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      siwe_nonces: {
        Row: {
          created_at: string
          expires_at: string
          nonce: string
          used_at: string | null
          wallet_address: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          nonce: string
          used_at?: string | null
          wallet_address?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          nonce?: string
          used_at?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      solved_theories: {
        Row: {
          abstract: string | null
          created_at: string
          id: string
          math: string | null
          solver: string
          source: string
          theory: string
          transcript: string | null
        }
        Insert: {
          abstract?: string | null
          created_at?: string
          id?: string
          math?: string | null
          solver?: string
          source?: string
          theory: string
          transcript?: string | null
        }
        Update: {
          abstract?: string | null
          created_at?: string
          id?: string
          math?: string | null
          solver?: string
          source?: string
          theory?: string
          transcript?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          credits_granted: number
          credits_remaining: number
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          plan: string
          price_id: string | null
          product_id: string | null
          purchased_addons: Json
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          credits_granted?: number
          credits_remaining?: number
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          plan?: string
          price_id?: string | null
          product_id?: string | null
          purchased_addons?: Json
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          credits_granted?: number
          credits_remaining?: number
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          plan?: string
          price_id?: string | null
          product_id?: string | null
          purchased_addons?: Json
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      system_quarantine: {
        Row: {
          active: boolean
          cleared_at: string | null
          created_at: string
          key: string
          reason: string | null
          triggered_at: string | null
          triggered_by: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          cleared_at?: string | null
          created_at?: string
          key: string
          reason?: string | null
          triggered_at?: string | null
          triggered_by?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          cleared_at?: string | null
          created_at?: string
          key?: string
          reason?: string | null
          triggered_at?: string | null
          triggered_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      usage_counters: {
        Row: {
          id: string
          period_start: string
          runs_count: number
          user_id: string
        }
        Insert: {
          id?: string
          period_start?: string
          runs_count?: number
          user_id: string
        }
        Update: {
          id?: string
          period_start?: string
          runs_count?: number
          user_id?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      [_ in never]: never
    }
    Functions: {
      admin_list_cron_jobs: {
        Args: never
        Returns: {
          active: boolean
          command: string
          jobid: number
          jobname: string
          schedule: string
        }[]
      }
      admin_list_cron_runs: {
        Args: { _limit?: number }
        Returns: {
          end_time: string
          job_pid: number
          jobid: number
          return_message: string
          runid: number
          start_time: string
          status: string
        }[]
      }
      cern_pocket_report: {
        Args: { _solver: string; _theory: string }
        Returns: string
      }
      check_user_quota: {
        Args: { _user_id: string }
        Returns: {
          allowed: boolean
          plan: string
          reason: string
          runs_limit: number
          runs_used: number
        }[]
      }
      consume_credit: {
        Args: { _amount?: number; _user_id: string }
        Returns: number
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      grant_plan_credits: {
        Args: { _credits: number; _plan: string; _user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_quarantined: { Args: { _key: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      promote_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _target_user: string
        }
        Returns: undefined
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "free" | "pro" | "institution" | "admin" | "viewer"
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
      app_role: ["free", "pro", "institution", "admin", "viewer"],
    },
  },
} as const
