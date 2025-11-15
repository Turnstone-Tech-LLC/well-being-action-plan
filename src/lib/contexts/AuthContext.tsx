/**
 * Authentication Context
 *
 * Provides authentication state and functions throughout the application.
 * This context manages the current user session and provides auth operations.
 */

'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { ProviderProfile } from '@/lib/types/provider';

interface AuthContextType {
  user: User | null;
  profile: ProviderProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    metadata: {
      name: string;
      organization?: string;
    }
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<ProviderProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const loadProfile = useCallback(
    async (userId: string, isMounted: { current: boolean }) => {
      try {
        const { data, error } = await supabase
          .from('provider_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!isMounted.current) return;

        if (error) {
          console.error('Error loading profile:', error);
        } else {
          setProfile(data);
        }
      } catch (error) {
        if (!isMounted.current) return;
        console.error('Error loading profile:', error);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    },
    [supabase]
  );

  // Load user and profile on mount
  useEffect(() => {
    const isMounted = { current: true };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted.current) return;

      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id, isMounted);
      } else {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted.current) return;

      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id, isMounted);
      } else {
        if (isMounted.current) {
          setProfile(null);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, [supabase, loadProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    metadata: { name: string; organization?: string }
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<ProviderProfile>) => {
    if (!user) return;

    const isMounted = { current: true };

    try {
      const { error } = await supabase.from('provider_profiles').update(updates).eq('id', user.id);

      if (error) throw error;

      // Reload profile
      await loadProfile(user.id, isMounted);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    } finally {
      // Cleanup would be handled if this were in a component effect
      isMounted.current = false;
    }
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
