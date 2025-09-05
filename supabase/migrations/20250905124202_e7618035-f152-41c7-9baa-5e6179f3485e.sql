-- Create media storage bucket for direct file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
);

-- Create RLS policies for media bucket
CREATE POLICY "Anyone can view media files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'media');

CREATE POLICY "Authenticated users can upload media files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'media' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own media files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own media files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'media' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create media_files table to track uploads
CREATE TABLE public.media_files (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  thumbnail_path text,
  alt_text text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on media_files
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;

-- RLS policies for media_files
CREATE POLICY "Users can view their own media files"
ON public.media_files FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own media files"
ON public.media_files FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own media files"
ON public.media_files FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own media files"
ON public.media_files FOR DELETE
USING (user_id = auth.uid());

-- Admins can view all media files
CREATE POLICY "Admins can view all media files"
ON public.media_files FOR SELECT
USING (is_admin());

-- Create updated_at trigger
CREATE TRIGGER update_media_files_updated_at
  BEFORE UPDATE ON public.media_files
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();