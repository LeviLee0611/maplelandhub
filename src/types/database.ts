export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string | null;
          server: string | null;
          job: string | null;
          level: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname?: string | null;
          server?: string | null;
          job?: string | null;
          level?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string | null;
          server?: string | null;
          job?: string | null;
          level?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          server: string;
          purpose: string;
          hunt_area: string;
          level_min: number;
          level_max: number;
          slots_total: number;
          slots_filled: number;
          status: "open" | "closed";
          bump_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          server: string;
          purpose: string;
          hunt_area: string;
          level_min: number;
          level_max: number;
          slots_total: number;
          slots_filled?: number;
          status?: "open" | "closed";
          bump_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          server?: string;
          purpose?: string;
          hunt_area?: string;
          level_min?: number;
          level_max?: number;
          slots_total?: number;
          slots_filled?: number;
          status?: "open" | "closed";
          bump_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          post_id: string;
          applicant_id: string;
          message: string;
          status: "pending" | "accepted" | "rejected";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          applicant_id: string;
          message?: string;
          status?: "pending" | "accepted" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          applicant_id?: string;
          message?: string;
          status?: "pending" | "accepted" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
