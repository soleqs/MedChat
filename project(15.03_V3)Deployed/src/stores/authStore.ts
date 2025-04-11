import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: 'nurse' | 'doctor' | 'assistant' | 'headNurse', hospitalId: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,
  clearError: () => set({ error: null }),
  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      
      const { error: signInError, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        }
        throw signInError;
      }

      if (!data.user) {
        throw new Error('Failed to get user data');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        throw new Error('Failed to load user profile');
      }

      if (!profile.hospital_id) {
        throw new Error('User not assigned to a hospital');
      }

      set({ user: data.user, profile, loading: false, error: null });
    } catch (error) {
      console.error('Sign in error:', error);
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Sign in failed',
        user: null,
        profile: null
      });
      throw error;
    }
  },
  signUp: async (email: string, password: string, name: string, role: 'nurse' | 'doctor' | 'assistant' | 'headNurse', hospitalId: string) => {
    try {
      set({ loading: true, error: null });
      
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });
      
      if (signUpError) {
        if (signUpError.message.includes('User already registered')) {
          throw new Error('Email already registered');
        }
        throw signUpError;
      }

      if (!data.user) {
        throw new Error('Failed to create user');
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            name,
            email,
            role,
            hospital_id: hospitalId,
            shift: 'day',
            social_links: {},
          },
        ])
        .select()
        .single();

      if (profileError) {
        throw new Error('Failed to create user profile');
      }

      await set({ 
        user: data.user,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Sign up error:', error);
      set({ 
        loading: false,
        error: error instanceof Error ? error.message : 'Sign up failed',
        user: null,
        profile: null
      });
      throw error;
    }
  },
  signOut: async () => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      set({ 
        user: null, 
        profile: null, 
        loading: false, 
        error: null 
      });
    } catch (error) {
      console.error('Sign out error:', error);
      set({ 
        loading: false,
        error: error instanceof Error ? error.message : 'Sign out failed'
      });
      throw error;
    }
  },
  loadUser: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;

      if (!session) {
        set({ 
          user: null, 
          profile: null, 
          loading: false, 
          error: null 
        });
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        throw new Error('Failed to load user profile');
      }

      if (!profile.hospital_id) {
        throw new Error('User not assigned to a hospital');
      }

      set({ 
        user: session.user, 
        profile, 
        loading: false, 
        error: null 
      });
    } catch (error) {
      console.error('Error loading user:', error);
      set({ 
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load user',
        user: null,
        profile: null
      });
    }
  },
}));