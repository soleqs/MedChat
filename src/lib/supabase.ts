import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true,
      storage: localStorage
    },
    global: {
      headers: {
        'X-Client-Info': 'medchat-mobile'
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    storage: {
      retryAttempts: 3,
      retryInterval: 1000
    }
  }
);

// Add error handling for fetch failures
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
    // Clear any cached data
    localStorage.clear();
    
    // Clean up any active subscriptions
    supabase.getChannels().forEach(channel => {
      supabase.removeChannel(channel);
    });
  }
});

// Helper function to handle storage errors
export const handleStorageError = (error: any): string => {
  if (error?.message?.includes('storage/object-not-found')) {
    return 'File not found';
  }
  if (error?.message?.includes('storage/unauthorized')) {
    return 'Unauthorized access';
  }
  if (error?.message?.includes('storage/quota-exceeded')) {
    return 'Storage quota exceeded';
  }
  return error?.message || 'An error occurred during file operation';
};

// Helper function to check if session is valid
export const isValidSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};