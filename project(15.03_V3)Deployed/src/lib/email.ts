import { supabase } from './supabase';

export async function sendShiftExchangeRequest(
  requesterId: string,
  requestedId: string,
  shiftDate: string
) {
  try {
    const { data: requester } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', requesterId)
      .single();

    const { data: requested } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', requestedId)
      .single();

    if (!requester || !requested) {
      throw new Error('Could not find user profiles');
    }

    // Send email using Supabase Edge Function
    const { error } = await supabase.functions.invoke('send-shift-exchange-email', {
      body: {
        to: requested.email,
        requesterName: requester.name,
        requesterRole: requester.role,
        requesterAvatar: requester.avatar_url,
        shiftDate,
        requestedId,
        requesterId,
        acceptUrl: `${window.location.origin}/shift-exchange/accept/${requesterId}/${shiftDate}`,
        rejectUrl: `${window.location.origin}/shift-exchange/reject/${requesterId}/${shiftDate}`
      }
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error sending shift exchange email:', error);
    throw error;
  }
}

export async function sendShiftExchangeResponse(
  requesterId: string,
  requestedId: string,
  shiftDate: string,
  accepted: boolean
) {
  try {
    const { data: requester } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', requesterId)
      .single();

    const { data: requested } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', requestedId)
      .single();

    if (!requester || !requested) {
      throw new Error('Could not find user profiles');
    }

    // Send email using Supabase Edge Function
    const { error } = await supabase.functions.invoke('send-shift-exchange-response', {
      body: {
        to: requester.email,
        responderName: requested.name,
        shiftDate,
        accepted
      }
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error sending shift exchange response email:', error);
    throw error;
  }
}