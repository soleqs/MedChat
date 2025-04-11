import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { format, startOfMonth, endOfMonth } from 'date-fns';

type Shift = Database['public']['Tables']['shifts']['Row'];
type ShiftExchangeRequest = Database['public']['Tables']['shift_exchange_requests']['Row'];

interface ShiftState {
  shifts: Shift[];
  requests: ShiftExchangeRequest[];
  loading: boolean;
  error: string | null;
  loadShifts: (month: Date) => Promise<void>;
  loadRequests: () => Promise<void>;
  createShift: (date: Date, type: 'day' | 'night' | 'off') => Promise<void>;
  updateShift: (shiftId: string, type: 'day' | 'night' | 'off') => Promise<void>;
  requestExchange: (shiftId: string, requestedUserId: string) => Promise<void>;
  respondToRequest: (requestId: string, accept: boolean) => Promise<void>;
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  shifts: [],
  requests: [],
  loading: false,
  error: null,
  loadShifts: async (month: Date) => {
    try {
      set({ loading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate start and end dates for the month
      const startDate = format(startOfMonth(month), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(month), 'yyyy-MM-dd');

      // First, try to load existing shifts
      const { data: existingShifts, error: loadError } = await supabase
        .from('shifts')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (loadError) throw loadError;

      // If no shifts exist for this month, create default ones
      if (!existingShifts || existingShifts.length === 0) {
        const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
        const defaultShifts = [];

        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(month.getFullYear(), month.getMonth(), day);
          defaultShifts.push({
            user_id: user.id,
            date: format(date, 'yyyy-MM-dd'),
            type: day % 3 === 0 ? 'night' : day % 3 === 1 ? 'day' : 'off'
          });
        }

        // Insert default shifts in batches
        const batchSize = 10;
        for (let i = 0; i < defaultShifts.length; i += batchSize) {
          const batch = defaultShifts.slice(i, i + batchSize);
          const { error: insertError } = await supabase
            .from('shifts')
            .upsert(batch, {
              onConflict: 'user_id,date',
              ignoreDuplicates: false
            });

          if (insertError) throw insertError;
        }

        // Reload shifts after creating defaults
        const { data: newShifts, error: reloadError } = await supabase
          .from('shifts')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: true });

        if (reloadError) throw reloadError;
        set({ shifts: newShifts || [], error: null });
      } else {
        // Use existing shifts
        set({ shifts: existingShifts, error: null });
      }
    } catch (error) {
      console.error('Error in loadShifts:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load shifts',
        loading: false 
      });
    } finally {
      set({ loading: false });
    }
  },
  loadRequests: async () => {
    try {
      set({ loading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('shift_exchange_requests')
        .select(`
          *,
          shifts (*),
          requester:profiles!shift_exchange_requests_requester_id_fkey (name),
          requested:profiles!shift_exchange_requests_requested_id_fkey (name)
        `)
        .or(`requester_id.eq.${user.id},requested_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ requests: data || [], error: null });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load requests',
        loading: false 
      });
    } finally {
      set({ loading: false });
    }
  },
  createShift: async (date: Date, type: 'day' | 'night' | 'off') => {
    try {
      set({ loading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('shifts')
        .upsert([
          {
            user_id: user.id,
            date: format(date, 'yyyy-MM-dd'),
            type,
          },
        ], {
          onConflict: 'user_id,date',
          ignoreDuplicates: false
        });

      if (error) throw error;
      await get().loadShifts(date);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create shift',
        loading: false 
      });
    } finally {
      set({ loading: false });
    }
  },
  updateShift: async (shiftId: string, type: 'day' | 'night' | 'off') => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('shifts')
        .update({ type })
        .eq('id', shiftId);

      if (error) throw error;
      
      // Reload shifts for the current month
      const shift = get().shifts.find(s => s.id === shiftId);
      if (shift) {
        await get().loadShifts(new Date(shift.date));
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update shift',
        loading: false 
      });
    } finally {
      set({ loading: false });
    }
  },
  requestExchange: async (shiftId: string, requestedUserId: string) => {
    try {
      set({ loading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('shift_exchange_requests')
        .insert([
          {
            requester_id: user.id,
            requested_id: requestedUserId,
            shift_id: shiftId,
            status: 'pending' // Add default status
          },
        ]);

      if (error) throw error;
      await get().loadRequests();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to request exchange',
        loading: false 
      });
    } finally {
      set({ loading: false });
    }
  },
  respondToRequest: async (requestId: string, accept: boolean) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('shift_exchange_requests')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', requestId);

      if (error) throw error;
      await get().loadRequests();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to respond to request',
        loading: false 
      });
    } finally {
      set({ loading: false });
    }
  },
}));