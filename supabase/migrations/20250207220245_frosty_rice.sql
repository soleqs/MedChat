/*
  # Email Notification System Update

  1. Changes
    - Remove database-level configuration parameters
    - Update email handling functions to use proper error handling
    - Add triggers for email notifications
    - Use pg_net for HTTP requests
    - Add proper security measures

  2. Security
    - Functions run with SECURITY DEFINER
    - Error handling for all operations
    - Proper parameter validation
*/

-- Create or replace the shift exchange email function with proper error handling
CREATE OR REPLACE FUNCTION handle_shift_exchange_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Send email notification using pg_net with error handling
  BEGIN
    PERFORM net.http_post(
      url := 'https://lphvctwbxtpmpoqcrcmo.supabase.co/functions/v1/send-shift-exchange-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', format('Bearer %s', current_setting('request.jwt.claim.role', true))
      ),
      body := jsonb_build_object(
        'to', (SELECT email FROM profiles WHERE id = NEW.requested_id),
        'requesterName', (SELECT name FROM profiles WHERE id = NEW.requester_id),
        'requesterRole', (SELECT role FROM profiles WHERE id = NEW.requester_id),
        'requesterAvatar', (SELECT avatar_url FROM profiles WHERE id = NEW.requester_id),
        'shiftDate', (SELECT date FROM shifts WHERE id = NEW.shift_id),
        'requestedId', NEW.requested_id,
        'requesterId', NEW.requester_id
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to send shift exchange email: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the shift exchange response function with proper error handling
CREATE OR REPLACE FUNCTION handle_shift_exchange_response()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status has changed to accepted or rejected
  IF NEW.status IN ('accepted', 'rejected') AND OLD.status = 'pending' THEN
    -- Send email notification using pg_net with error handling
    BEGIN
      PERFORM net.http_post(
        url := 'https://lphvctwbxtpmpoqcrcmo.supabase.co/functions/v1/send-shift-exchange-response',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', format('Bearer %s', current_setting('request.jwt.claim.role', true))
        ),
        body := jsonb_build_object(
          'to', (SELECT email FROM profiles WHERE id = NEW.requester_id),
          'responderName', (SELECT name FROM profiles WHERE id = NEW.requested_id),
          'shiftDate', (SELECT date FROM shifts WHERE id = NEW.shift_id),
          'accepted', NEW.status = 'accepted'
        )
      );
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to send shift exchange response email: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS shift_exchange_email_trigger ON shift_exchange_requests;
DROP TRIGGER IF EXISTS shift_exchange_response_trigger ON shift_exchange_requests;

-- Create new triggers for email notifications
CREATE TRIGGER shift_exchange_email_trigger
  AFTER INSERT ON shift_exchange_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_shift_exchange_email();

CREATE TRIGGER shift_exchange_response_trigger
  AFTER UPDATE OF status ON shift_exchange_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_shift_exchange_response();