import { supabase, typedSupabase, User, AuthUser, Session, ApiResponse } from './supabase-client';
import { AuthError, AuthResponse, AuthTokenResponse } from '@supabase/supabase-js';

export interface SignUpData {
  email: string;
  password: string;
  options?: {
    data?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface UpdatePasswordData {
  password: string;
}

export interface UpdateProfileData {
  full_name?: string;
  avatar_url?: string;
  subscription_tier?: 'free' | 'pro' | 'enterprise';
}

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
}

export class AuthService {
  private authStateListeners: ((state: AuthState) => void)[] = [];

  constructor() {
    // Set up auth state change listener
    supabase.auth.onAuthStateChange((event, session) => {
      const authState: AuthState = {
        user: session?.user || null,
        session,
        loading: false
      };

      this.notifyAuthStateListeners(authState);
    });
  }

  /**
   * Sign up a new user
   */
  async signUp(data: SignUpData): Promise<ApiResponse<AuthResponse>> {
    try {
      const { email, password, options } = data;
      
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          ...options,
          emailRedirectTo: this.getRedirectUrl('/auth/callback')
        }
      });

      if (response.error) {
        throw response.error;
      }

      // Create user profile if user was created
      if (response.data.user && !response.data.user.email_confirmed_at) {
        await this.createUserProfile(response.data.user, options?.data);
      }

      return {
        data: response,
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as AuthError,
        status: 'error'
      };
    }
  }

  /**
   * Sign in an existing user
   */
  async signIn(data: SignInData): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await supabase.auth.signInWithPassword(data);

      if (response.error) {
        throw response.error;
      }

      return {
        data: response,
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as AuthError,
        status: 'error'
      };
    }
  }

  /**
   * Sign in with OAuth provider
   */
  async signInWithProvider(provider: 'google' | 'github' | 'discord'): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: this.getRedirectUrl('/auth/callback')
        }
      });

      if (response.error) {
        throw response.error;
      }

      return {
        data: response,
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as AuthError,
        status: 'error'
      };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      return {
        data: null,
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as AuthError,
        status: 'error'
      };
    }
  }

  /**
   * Get current user
   */
  async getUser(): Promise<ApiResponse<AuthUser>> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        throw error;
      }

      return {
        data: user,
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as AuthError,
        status: 'error'
      };
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<ApiResponse<Session>> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      return {
        data: session,
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as AuthError,
        status: 'error'
      };
    }
  }

  /**
   * Reset password for email
   */
  async resetPassword(data: ResetPasswordData): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: this.getRedirectUrl('/auth/reset-password')
      });

      if (error) {
        throw error;
      }

      return {
        data: null,
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as AuthError,
        status: 'error'
      };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(data: UpdatePasswordData): Promise<ApiResponse<AuthUser>> {
    try {
      const { data: response, error } = await supabase.auth.updateUser({
        password: data.password
      });

      if (error) {
        throw error;
      }

      return {
        data: response.user,
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as AuthError,
        status: 'error'
      };
    }
  }

  /**
   * Update user profile in users table
   */
  async updateProfile(data: UpdateProfileData): Promise<ApiResponse<User>> {
    try {
      const user = await this.getCurrentAuthUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: updatedUser, error } = await typedSupabase
        .from('users')
        .update(data)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        data: updatedUser,
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        status: 'error'
      };
    }
  }

  /**
   * Get user profile from users table
   */
  async getUserProfile(): Promise<ApiResponse<User>> {
    try {
      const user = await this.getCurrentAuthUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: profile, error } = await typedSupabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        throw error;
      }

      return {
        data: profile,
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        status: 'error'
      };
    }
  }

  /**
   * Check if user has sufficient credits
   */
  async hasCredits(amount: number = 1): Promise<boolean> {
    try {
      const { data: profile } = await this.getUserProfile();
      return profile ? profile.credits >= amount : false;
    } catch {
      return false;
    }
  }

  /**
   * Get user's current credit balance
   */
  async getCredits(): Promise<number> {
    try {
      const { data: profile } = await this.getUserProfile();
      return profile?.credits || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Add credits to user account
   */
  async addCredits(amount: number): Promise<ApiResponse<User>> {
    try {
      const user = await this.getCurrentAuthUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: updatedUser, error } = await typedSupabase
        .from('users')
        .update({
          credits: await this.getCredits() + amount
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        data: updatedUser,
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
        status: 'error'
      };
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (state: AuthState) => void): () => void {
    this.authStateListeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.authStateListeners = this.authStateListeners.filter(
        listener => listener !== callback
      );
    };
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: user } = await this.getUser();
      return !!user;
    } catch {
      return false;
    }
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<ApiResponse<AuthTokenResponse>> {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        throw error;
      }

      return {
        data,
        error: null,
        status: 'success'
      };
    } catch (error) {
      return {
        data: null,
        error: error as AuthError,
        status: 'error'
      };
    }
  }

  // Private methods
  private async getCurrentAuthUser(): Promise<AuthUser | null> {
    const { data } = await this.getUser();
    return data;
  }

  private async createUserProfile(
    authUser: AuthUser,
    profileData?: { full_name?: string; avatar_url?: string }
  ): Promise<void> {
    try {
      await typedSupabase.from('users').insert({
        id: authUser.id,
        email: authUser.email!,
        full_name: profileData?.full_name || null,
        avatar_url: profileData?.avatar_url || null,
        subscription_tier: 'free',
        credits: 10 // Free credits to start
      });
    } catch (error) {
      console.error('Failed to create user profile:', error);
      // Don't throw here to avoid breaking the sign-up flow
    }
  }

  private getRedirectUrl(path: string): string {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${path}`;
    }
    return `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${path}`;
  }

  private notifyAuthStateListeners(state: AuthState): void {
    this.authStateListeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }
}

// Create singleton instance
export const authService = new AuthService();
export default AuthService;