import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

// Create Supabase client instance
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database Types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at'>>;
      };
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Project, 'id' | 'created_at'>>;
      };
      templates: {
        Row: Template;
        Insert: Omit<Template, 'id' | 'created_at' | 'usage_count'>;
        Update: Partial<Omit<Template, 'id' | 'created_at'>>;
      };
      generations: {
        Row: Generation;
        Insert: Omit<Generation, 'id' | 'created_at'>;
        Update: Partial<Omit<Generation, 'id' | 'created_at'>>;
      };
    };
    Functions: {
      decrement_credits: {
        Args: { user_id: string; amount: number };
        Returns: void;
      };
    };
  };
}

// Core Entity Types
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  domain: string | null;
  blueprint: Record<string, any> | null;
  files: Record<string, any> | null;
  preview_url: string | null;
  deployed_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  credits: number;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  description: string | null;
  domain: string | null;
  blueprint: Record<string, any> | null;
  thumbnail_url: string | null;
  is_premium: boolean;
  usage_count: number;
  created_at: string;
}

export interface Generation {
  id: string;
  user_id: string;
  project_id: string | null;
  prompt: string;
  domain: string | null;
  tokens_used: number | null;
  quality_score: number | null;
  created_at: string;
}

// Extended types for application use
export interface ProjectWithStats extends Project {
  generation_count: number;
  last_generated: string | null;
  quality_score: number | null;
}

export interface UserWithStats extends User {
  project_count: number;
  total_generations: number;
  avg_quality_score: number | null;
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Auth Types
export interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  phone: string | null;
  confirmed_at: string | null;
  last_sign_in_at: string | null;
  app_metadata: Record<string, any>;
  user_metadata: Record<string, any>;
  role: string;
  aud: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  refresh_token: string;
  user: AuthUser;
}

// Configuration and Settings
export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey?: string;
}

export interface StorageBucket {
  id: string;
  name: string;
  owner: string;
  created_at: string;
  updated_at: string;
  public: boolean;
}

export interface FileUploadOptions {
  cacheControl?: string;
  contentType?: string;
  upsert?: boolean;
}

// Realtime Types
export interface RealtimeChannel {
  subscribe: () => void;
  unsubscribe: () => void;
}

export interface RealtimePayload<T> {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
}

// Error Types
export interface SupabaseError {
  message: string;
  details: string;
  hint: string;
  code: string;
}

export interface DatabaseError extends SupabaseError {
  table?: string;
  column?: string;
}

export interface AuthError extends SupabaseError {
  status?: number;
}

export interface StorageError extends SupabaseError {
  statusCode?: number;
}

// Utility Functions
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

export const getSupabaseConfig = (): SupabaseConfig => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not properly configured. Please check your environment variables.');
  }
  
  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  };
};

// Health check function
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    return !error;
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return false;
  }
};

// Type-safe query builder helpers
export const createTypedSupabaseClient = () => {
  return supabase as SupabaseClient<Database>;
};

// Export configured client with types
export const typedSupabase = createTypedSupabaseClient();

export default supabase;