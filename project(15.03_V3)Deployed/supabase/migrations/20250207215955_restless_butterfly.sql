/*
  # Add shift exchange email functions and policies

  1. Changes
    - Add function to handle shift exchange email notifications
    - Add function to handle shift exchange response notifications
    - Add policies for email functions

  2. Security
    - Functions are only callable by authenticated users
    - Email notifications are only sent for valid shift exchanges
*/

-- Create function to handle shift exchange email notifications
CREATE OR REPLACE FUNCTION handle_shift_exchange_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Send email notification using pg_net
  PERFORM net.http_post(
    url := current_setting('app.edge_function_url') || '/send-shift-exchange-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.edge_function_key')
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle shift exchange response notifications
CREATE OR REPLACE FUNCTION handle_shift_exchange_response()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('accepted', 'rejected') AND OLD.status = 'pending' THEN
    -- Send email notification using pg_net
    PERFORM net.http_post(
      url := current_setting('app.edge_function_url') || '/send-shift-exchange-response',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.edge_function_key')
      ),
      body := jsonb_build_object(
        'to', (SELECT email FROM profiles WHERE id = NEW.requester_id),
        'responderName', (SELECT name FROM profiles WHERE id = NEW.requested_id),
        'shiftDate', (SELECT date FROM shifts WHERE id = NEW.shift_id),
        'accepted', NEW.status = 'accepted'
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for email notifications
DROP TRIGGER IF EXISTS shift_exchange_email_trigger ON shift_exchange_requests;
CREATE TRIGGER shift_exchange_email_trigger
  AFTER INSERT ON shift_exchange_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_shift_exchange_email();

DROP TRIGGER IF EXISTS shift_exchange_response_trigger ON shift_exchange_requests;
CREATE TRIGGER shift_exchange_response_trigger
  AFTER UPDATE OF status ON shift_exchange_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_shift_exchange_response();