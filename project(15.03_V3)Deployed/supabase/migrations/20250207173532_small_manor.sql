/*
  # Create initial chat rooms

  1. New Data
    - Creates default chat rooms for different user roles
    - General chat room for all users
    - Specialized rooms for nurses, doctors, and assistants

  2. Security
    - Rooms are read-only for regular users
    - Only head nurses can create new rooms
*/

-- Insert default chat rooms if they don't exist
DO $$
BEGIN
  -- General chat room
  IF NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE name = 'General Chat') THEN
    INSERT INTO public.chat_rooms (name, type)
    VALUES ('General Chat', 'general');
  END IF;

  -- Nurses chat room
  IF NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE name = 'Nurses Room') THEN
    INSERT INTO public.chat_rooms (name, type)
    VALUES ('Nurses Room', 'nurses');
  END IF;

  -- Doctors chat room
  IF NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE name = 'Doctors Room') THEN
    INSERT INTO public.chat_rooms (name, type)
    VALUES ('Doctors Room', 'doctors');
  END IF;

  -- Assistants chat room
  IF NOT EXISTS (SELECT 1 FROM public.chat_rooms WHERE name = 'Assistants Room') THEN
    INSERT INTO public.chat_rooms (name, type)
    VALUES ('Assistants Room', 'assistants');
  END IF;
END $$;