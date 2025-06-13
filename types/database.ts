export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          avatar_url: string | null;
          visible: boolean;
          last_seen: string;
          status: 'online' | 'offline' | 'ghost';
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          avatar_url?: string | null;
          visible?: boolean;
          last_seen?: string;
          status?: 'online' | 'offline' | 'ghost';
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          avatar_url?: string | null;
          visible?: boolean;
          last_seen?: string;
          status?: 'online' | 'offline' | 'ghost';
          created_at?: string;
        };
      };
      friends: {
        Row: {
          id: string;
          user_id: string;
          friend_id: string;
          status: 'pending' | 'accepted' | 'blocked';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          status?: 'pending' | 'accepted' | 'blocked';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          friend_id?: string;
          status?: 'pending' | 'accepted' | 'blocked';
          created_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          user_id: string;
          latitude: number;
          longitude: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          latitude: number;
          longitude: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          latitude?: number;
          longitude?: number;
          updated_at?: string;
        };
      };
    };
  };
}

export type User = Database['public']['Tables']['users']['Row'];
export type Friend = Database['public']['Tables']['friends']['Row'];
export type Location = Database['public']['Tables']['locations']['Row'];