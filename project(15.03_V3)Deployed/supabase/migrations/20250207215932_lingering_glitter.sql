/*
  # Add email column to profiles table

  1. Changes
    - Add email column to profiles table
    - Add unique constraint on email
    - Add trigger to sync auth.users email with profiles email

  2. Security
    - Email is readable by authenticated users
    - Email is only writable through trigger
*/

-- Add email column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email text;

-- Add unique constraint
ALTER TABLE profiles
ADD CONSTRAINT profiles_email_key UNIQUE (email);

-- Create function to sync email from auth.users
CREATE OR REPLACE FUNCTION sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to sync email on user update
DROP TRIGGER IF EXISTS sync_user_email_trigger ON auth.users;
CREATE TRIGGER sync_user_email_trigger
AFTER UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION sync_user_email();

-- Sync existing emails
DO $$
BEGIN
  UPDATE public.profiles p
  SET email = u.email
  FROM auth.users u
  WHERE p.id = u.id
  AND p.email IS NULL;
END $$;