// Default authentication system with pre-configured account
export interface DefaultUser {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar_url?: string;
  visible: boolean;
  status: 'online' | 'offline' | 'ghost';
  last_seen: string;
  created_at: string;
}

// Default account credentials
export const DEFAULT_ACCOUNT: DefaultUser = {
  id: 'default-user-001',
  name: 'Demo User',
  email: 'demo@spotme.app',
  password: 'demo123',
  visible: true,
  status: 'online',
  last_seen: new Date().toISOString(),
  created_at: new Date().toISOString(),
};

// Mock friends for demo
export const DEFAULT_FRIENDS = [
  {
    id: 'friend-001',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    status: 'online',
    latitude: 37.7849,
    longitude: -122.4094,
    last_seen: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
  },
  {
    id: 'friend-002',
    name: 'Mike Chen',
    email: 'mike@example.com',
    status: 'ghost',
    latitude: 37.7849,
    longitude: -122.4194,
    last_seen: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
  },
  {
    id: 'friend-003',
    name: 'Emma Wilson',
    email: 'emma@example.com',
    status: 'offline',
    latitude: 37.7749,
    longitude: -122.4194,
    last_seen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
];

// Simple authentication functions
export const authenticateUser = (email: string, password: string): DefaultUser | null => {
  if (email === DEFAULT_ACCOUNT.email && password === DEFAULT_ACCOUNT.password) {
    return DEFAULT_ACCOUNT;
  }
  return null;
};

export const createDemoAccount = (name: string, email: string, password: string): DefaultUser => {
  return {
    id: `user-${Date.now()}`,
    name,
    email,
    password,
    visible: true,
    status: 'online',
    last_seen: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
};