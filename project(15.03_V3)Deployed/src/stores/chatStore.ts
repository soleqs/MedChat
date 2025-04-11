import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { isValidSession } from '../lib/supabase';

type Message = Database['public']['Tables']['messages']['Row'] & {
  user?: {
    name: string;
    avatar_url: string | null;
    role: 'nurse' | 'doctor' | 'assistant' | 'headNurse';
  };
};

type ChatRoom = Database['public']['Tables']['chat_rooms']['Row'];

interface ChatState {
  messages: Message[];
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  loading: boolean;
  error: string | null;
  loadRooms: () => Promise<void>;
  loadMessages: (roomId: string) => Promise<void>;
  sendMessage: (content: string, roomId: string) => Promise<void>;
  setCurrentRoom: (room: ChatRoom) => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  rooms: [],
  currentRoom: null,
  loading: false,
  error: null,
  clearError: () => set({ error: null }),
  loadRooms: async () => {
    try {
      set({ loading: true, error: null });

      // Check if we have a valid session first
      const isValid = await isValidSession();
      if (!isValid) {
        set({ 
          rooms: [],
          currentRoom: null,
          loading: false,
          error: null 
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ 
          rooms: [],
          currentRoom: null,
          loading: false,
          error: null 
        });
        return;
      }

      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        if (error.message.includes('JWT')) {
          // Handle JWT/auth errors silently
          set({ 
            rooms: [],
            currentRoom: null,
            loading: false,
            error: null 
          });
          return;
        }
        throw error;
      }
      
      const rooms = data || [];
      set({ 
        rooms,
        currentRoom: get().currentRoom || rooms[0] || null,
        loading: false,
        error: null 
      });
      
      if (get().currentRoom) {
        await get().loadMessages(get().currentRoom.id);
      }
    } catch (error) {
      console.error('Error loading rooms:', error);
      // Handle network errors silently
      set({ 
        loading: false, 
        error: null,
        rooms: get().rooms, // Keep existing rooms if any
        currentRoom: get().currentRoom // Keep current room if any
      });
    }
  },
  loadMessages: async (roomId: string) => {
    let subscription: any;
    
    try {
      set({ loading: true, error: null });

      // Check if we have a valid session first
      const isValid = await isValidSession();
      if (!isValid) {
        set({ 
          messages: [],
          loading: false,
          error: null 
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ 
          messages: [],
          loading: false,
          error: null 
        });
        return;
      }

      // Clean up any existing subscriptions
      supabase.getChannels().forEach(channel => {
        if (channel.topic.includes('room:')) {
          supabase.removeChannel(channel);
        }
      });

      // Load initial messages
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          user:profiles(name, avatar_url, role)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) {
        if (error.message.includes('JWT')) {
          // Handle JWT/auth errors silently
          set({ 
            messages: [],
            loading: false,
            error: null 
          });
          return;
        }
        throw error;
      }

      set({ messages: data || [], loading: false, error: null });

      // Subscribe to new messages
      subscription = supabase
        .channel(`room:${roomId}`)
        .on('postgres_changes', 
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `room_id=eq.${roomId}`
          },
          async (payload) => {
            const { data: newMessage } = payload;
            if (newMessage) {
              try {
                const { data: userData, error: userError } = await supabase
                  .from('profiles')
                  .select('name, avatar_url, role')
                  .eq('id', newMessage.user_id)
                  .single();

                if (!userError && userData) {
                  set(state => ({
                    messages: [...state.messages, { ...newMessage, user: userData }]
                  }));
                }
              } catch (error) {
                console.error('Error fetching user data for message:', error);
              }
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to room:', roomId);
          }
          if (status === 'CHANNEL_ERROR') {
            console.log('Failed to subscribe to room:', roomId);
            // Retry subscription after a delay
            setTimeout(() => {
              subscription?.unsubscribe();
              get().loadMessages(roomId);
            }, 5000);
          }
        });

      return () => {
        if (subscription) {
          supabase.removeChannel(subscription);
        }
      };
    } catch (error) {
      console.error('Error loading messages:', error);
      // Handle network errors silently
      set({ 
        loading: false,
        error: null,
        messages: get().messages // Keep existing messages if any
      });
    }
  },
  sendMessage: async (content: string, roomId: string) => {
    try {
      set({ error: null });

      // Check if we have a valid session first
      const isValid = await isValidSession();
      if (!isValid) {
        throw new Error('Not authenticated');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('messages')
        .insert([
          {
            content,
            room_id: roomId,
            user_id: user.id,
          },
        ]);

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      // Only show error to user if it's not a network error
      if (error instanceof Error && !error.message.includes('Failed to fetch')) {
        set({ error: error.message });
      }
      throw error;
    }
  },
  setCurrentRoom: (room: ChatRoom) => {
    set({ currentRoom: room });
    get().loadMessages(room.id);
  },
}));