import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useShiftStore } from '../stores/shiftStore';
import { sendShiftExchangeResponse } from '../lib/email';

export function ShiftExchangeResponse() {
  const { action, requesterId, shiftDate } = useParams();
  const navigate = useNavigate();
  const { respondToRequest } = useShiftStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleResponse();
  }, [action, requesterId, shiftDate]);

  const handleResponse = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!requesterId || !shiftDate || !action) {
        throw new Error('Missing required parameters');
      }

      const accepted = action === 'accept';

      // Update the shift exchange request status
      await respondToRequest(requesterId, accepted);

      // Send email notification
      await sendShiftExchangeResponse(requesterId, requesterId, shiftDate, accepted);

      // Redirect to calendar
      navigate('/calendar');
    } catch (error) {
      console.error('Error handling shift exchange response:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return null;
}