/*
  # Update schema for hospital-based groups and chats

  1. Changes
    - Add hospital_id to chat_rooms table
    - Update chat room policies to be hospital-specific
    - Add unique constraint for room type within hospital
    - Update existing policies for hospital-based access

  2. Security
    - Enable RLS for all tables
    - Add policies for hospital-based access
    - Maintain data integrity with constraints
*/

-- Add hospital_id to chat_rooms
ALTER TABLE chat_rooms 
ADD COLUMN hospital_id uuid REFERENCES hospitals(id) ON DELETE CASCADE;

-- Add unique constraint for room type within hospital
ALTER TABLE chat_rooms
ADD CONSTRAINT unique_room_type_per_hospital UNIQUE (type, hospital_id);

-- Update chat room policies
DROP POLICY IF EXISTS "Users can view all chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Only admins can create chat rooms" ON chat_rooms;

CREATE POLICY "Users can view chat rooms in their hospital"
  ON chat_rooms FOR SELECT
  TO authenticated
  USING (
    hospital_id = (
      SELECT hospital_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Head nurses can manage hospital chat rooms"
  ON chat_rooms FOR ALL
  TO authenticated
  USING (
    hospital_id = (
      SELECT hospital_id 
      FROM profiles 
      WHERE id = auth.uid()
      AND role = 'headNurse'
    )
  );

-- Update message policies
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON messages;
DROP POLICY IF EXISTS "Users can create messages in their rooms" ON messages;

CREATE POLICY "Users can view messages in their hospital rooms"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM chat_rooms cr
      JOIN profiles p ON p.hospital_id = cr.hospital_id
      WHERE cr.id = room_id
      AND p.id = auth.uid()
      AND (
        cr.type = 'general'
        OR (cr.type = 'nurses' AND p.role IN ('nurse', 'headNurse'))
        OR (cr.type = 'doctors' AND p.role = 'doctor')
        OR (cr.type = 'assistants' AND p.role = 'assistant')
      )
    )
  );

CREATE POLICY "Users can create messages in their hospital rooms"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM chat_rooms cr
      JOIN profiles p ON p.hospital_id = cr.hospital_id
      WHERE cr.id = room_id
      AND p.id = auth.uid()
      AND user_id = auth.uid()
      AND (
        cr.type = 'general'
        OR (cr.type = 'nurses' AND p.role IN ('nurse', 'headNurse'))
        OR (cr.type = 'doctors' AND p.role = 'doctor')
        OR (cr.type = 'assistants' AND p.role = 'assistant')
      )
    )
  );

-- Create default chat rooms for each hospital
DO $$
DECLARE
    h RECORD;
BEGIN
    FOR h IN SELECT id FROM hospitals
    LOOP
        -- General chat room
        INSERT INTO chat_rooms (name, type, hospital_id)
        VALUES ('General Chat', 'general', h.id);

        -- Role-specific chat rooms
        INSERT INTO chat_rooms (name, type, hospital_id)
        VALUES 
            ('Nurses Room', 'nurses', h.id),
            ('Doctors Room', 'doctors', h.id),
            ('Assistants Room', 'assistants', h.id);
    END LOOP;
END $$;