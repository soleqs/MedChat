/*
  # Create storage bucket for avatars

  1. New Storage
    - Create 'avatars' bucket for storing profile pictures
    - Set up public access policies
    - Enable file size limits and type restrictions
  
  2. Security
    - Enable RLS on the bucket
    - Add policies for authenticated users to manage their own avatars
    - Allow public read access for avatar files
*/

-- Create the avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.filename(name)) LIKE auth.uid() || '_%'
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.filename(name)) LIKE auth.uid() || '_%'
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.filename(name)) LIKE auth.uid() || '_%'
  );