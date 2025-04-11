-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Ensure storage is properly configured
DO $$
BEGIN
    -- Create avatars bucket if it doesn't exist with proper configuration
    INSERT INTO storage.buckets (id, name, public, file_size_limit)
    VALUES (
        'avatars',
        'avatars',
        true,
        5242880  -- 5MB in bytes
    )
    ON CONFLICT (id) DO UPDATE
    SET
        public = true,
        file_size_limit = 5242880;

    -- Ensure RLS is enabled
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

    -- Recreate policies with proper checks
    CREATE POLICY "Avatar images are publicly accessible"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'avatars');

    CREATE POLICY "Users can upload their own avatar"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'avatars'
            AND (storage.filename(name)) LIKE concat(auth.uid(), '_%')
            AND (storage.extension(name) = ANY (ARRAY['jpg', 'jpeg', 'png', 'gif']))
            AND position('/' in name) = 0
        );

    CREATE POLICY "Users can update their own avatar"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (
            bucket_id = 'avatars'
            AND (storage.filename(name)) LIKE concat(auth.uid(), '_%')
        );

    CREATE POLICY "Users can delete their own avatar"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (
            bucket_id = 'avatars'
            AND (storage.filename(name)) LIKE concat(auth.uid(), '_%')
        );
END $$;

-- Add function to clean up old avatars
CREATE OR REPLACE FUNCTION clean_old_avatar()
RETURNS TRIGGER AS $$
DECLARE
    old_avatar_path TEXT;
BEGIN
    -- Get the old avatar path
    SELECT avatar_url INTO old_avatar_path
    FROM profiles
    WHERE id = NEW.id;

    -- If there's an old avatar and it's different from the new one
    IF old_avatar_path IS NOT NULL AND old_avatar_path != NEW.avatar_url THEN
        -- Extract filename from URL
        old_avatar_path := substring(old_avatar_path from '/avatars/([^/]+)$');
        
        -- Delete old avatar if it exists and belongs to the user
        IF old_avatar_path LIKE concat(NEW.id, '_%') THEN
            PERFORM storage.delete('avatars', old_avatar_path);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS clean_old_avatar_trigger ON profiles;
CREATE TRIGGER clean_old_avatar_trigger
    BEFORE UPDATE OF avatar_url ON profiles
    FOR EACH ROW
    WHEN (OLD.avatar_url IS DISTINCT FROM NEW.avatar_url)
    EXECUTE FUNCTION clean_old_avatar();