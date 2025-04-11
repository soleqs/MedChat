/*
  # Initial schema for MedChat

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - matches auth.users.id
      - `name` (text) - full name
      - `avatar_url` (text) - profile picture URL
      - `role` (text) - user role (nurse, doctor, assistant, headNurse)
      - `phone` (text) - contact number
      - `shift` (text) - current shift (day, night, off)
      - `social_links` (jsonb) - social media links
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `chat_rooms`
      - `id` (uuid, primary key)
      - `name` (text) - room name
      - `type` (text) - room type (general, nurses, doctors, assistants)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `messages`
      - `id` (uuid, primary key)
      - `room_id` (uuid) - reference to chat_rooms
      - `user_id` (uuid) - reference to profiles
      - `content` (text) - message content
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `shifts`
      - `id` (uuid, primary key)
      - `user_id` (uuid) - reference to profiles
      - `date` (date) - shift date
      - `type` (text) - shift type (day, night, off)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `shift_exchange_requests`
      - `id` (uuid, primary key)
      - `requester_id` (uuid) - reference to profiles
      - `requested_id` (uuid) - reference to profiles
      - `shift_id` (uuid) - reference to shifts
      - `status` (text) - request status (pending, accepted, rejected)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated access
    - Add policies for role-based access where needed
*/

-- Create custom types
CREATE TYPE shift_type AS ENUM ('day', 'night', 'off');
CREATE TYPE user_role AS ENUM ('nurse', 'doctor', 'assistant', 'headNurse');
CREATE TYPE room_type AS ENUM ('general', 'nurses', 'doctors', 'assistants');
CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  avatar_url text,
  role user_role NOT NULL DEFAULT 'nurse',
  phone text,
  shift shift_type NOT NULL DEFAULT 'day',
  social_links jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type room_type NOT NULL DEFAULT 'general',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  type shift_type NOT NULL DEFAULT 'day',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create shift_exchange_requests table
CREATE TABLE IF NOT EXISTS shift_exchange_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  requested_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  shift_id uuid REFERENCES shifts(id) ON DELETE CASCADE NOT NULL,
  status request_status NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_exchange_requests ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Chat rooms policies
CREATE POLICY "Users can view all chat rooms"
  ON chat_rooms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can create chat rooms"
  ON chat_rooms FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'headNurse'
  ));

-- Messages policies
CREATE POLICY "Users can view messages in their rooms"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE id = room_id
      AND (
        type = 'general'
        OR (type = 'nurses' AND EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND (role = 'nurse' OR role = 'headNurse')
        ))
        OR (type = 'doctors' AND EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'doctor'
        ))
        OR (type = 'assistants' AND EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'assistant'
        ))
      )
    )
  );

CREATE POLICY "Users can create messages in their rooms"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE id = room_id
      AND (
        type = 'general'
        OR (type = 'nurses' AND EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND (role = 'nurse' OR role = 'headNurse')
        ))
        OR (type = 'doctors' AND EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'doctor'
        ))
        OR (type = 'assistants' AND EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'assistant'
        ))
      )
    )
  );

-- Shifts policies
CREATE POLICY "Users can view all shifts"
  ON shifts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own shifts"
  ON shifts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own shifts"
  ON shifts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Head nurses can manage all shifts"
  ON shifts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'headNurse'
    )
  );

-- Shift exchange requests policies
CREATE POLICY "Users can view their exchange requests"
  ON shift_exchange_requests FOR SELECT
  TO authenticated
  USING (
    requester_id = auth.uid()
    OR requested_id = auth.uid()
  );

CREATE POLICY "Users can create exchange requests"
  ON shift_exchange_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    requester_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM shifts
      WHERE id = shift_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their exchange requests"
  ON shift_exchange_requests FOR UPDATE
  TO authenticated
  USING (
    requested_id = auth.uid()
    AND status = 'pending'
  );

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_chat_rooms_updated_at
  BEFORE UPDATE ON chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_shifts_updated_at
  BEFORE UPDATE ON shifts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_shift_exchange_requests_updated_at
  BEFORE UPDATE ON shift_exchange_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();