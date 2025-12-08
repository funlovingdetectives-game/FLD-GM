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
      games: {
        Row: {
          id: string;
          name: string;
          config: Json;
          branding: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          config?: Json;
          branding?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          config?: Json;
          branding?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      team_quizzes: {
        Row: {
          id: string;
          game_id: string;
          questions: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          questions?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          questions?: Json;
          created_at?: string;
        };
      };
      individual_quizzes: {
        Row: {
          id: string;
          game_id: string;
          questions: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          questions?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          questions?: Json;
          created_at?: string;
        };
      };
      game_state: {
        Row: {
          id: string;
          game_id: string;
          is_running: boolean;
          current_round: number;
          time_remaining: number;
          is_paused: boolean;
          team_quiz_unlocked: boolean;
          individual_quiz_unlocked: boolean;
          scores_revealed: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          is_running?: boolean;
          current_round?: number;
          time_remaining?: number;
          is_paused?: boolean;
          team_quiz_unlocked?: boolean;
          individual_quiz_unlocked?: boolean;
          scores_revealed?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          is_running?: boolean;
          current_round?: number;
          time_remaining?: number;
          is_paused?: boolean;
          team_quiz_unlocked?: boolean;
          individual_quiz_unlocked?: boolean;
          scores_revealed?: boolean;
          updated_at?: string;
        };
      };
      team_submissions: {
        Row: {
          id: string;
          game_id: string;
          team_id: string;
          answers: Json;
          score: number;
          submitted: boolean;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          team_id: string;
          answers?: Json;
          score?: number;
          submitted?: boolean;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          team_id?: string;
          answers?: Json;
          score?: number;
          submitted?: boolean;
          submitted_at?: string;
        };
      };
      individual_submissions: {
        Row: {
          id: string;
          game_id: string;
          team_id: string;
          player_name: string;
          answers: Json;
          score: number;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          team_id: string;
          player_name: string;
          answers?: Json;
          score?: number;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          team_id?: string;
          player_name?: string;
          answers?: Json;
          score?: number;
          submitted_at?: string;
        };
      };
    };
  };
}
