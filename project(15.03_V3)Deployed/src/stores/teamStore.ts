import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface TeamState {
  members: Profile[];
  loading: boolean;
  error: string | null;
  loadMembers: () => Promise<void>;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  members: [],
  loading: false,
  error: null,
  loadMembers: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ 
          members: [],
          loading: false,
          error: null 
        });
        return;
      }

      // Get the user's hospital_id first
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('hospital_id')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      if (!userProfile?.hospital_id) {
        set({ 
          members: [],
          loading: false,
          error: 'User not assigned to a hospital'
        });
        return;
      }

      // Then get all members from the same hospital
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('hospital_id', userProfile.hospital_id)
        .order('role', { ascending: true })
        .order('name', { ascending: true });

      if (error) {
        if (error.message.includes('JWT')) {
          set({ 
            members: [],
            loading: false,
            error: null 
          });
          return;
        }
        throw error;
      }
      
      set({ members: data || [], loading: false, error: null });
    } catch (error) {
      console.error('Error loading team members:', error);
      set({ 
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load team members',
        members: [] 
      });
    }
  }
}));