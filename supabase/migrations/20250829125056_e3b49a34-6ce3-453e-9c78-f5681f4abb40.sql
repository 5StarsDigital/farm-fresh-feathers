-- Add rich content columns to available_farms and chicken_types tables
ALTER TABLE public.available_farms 
ADD COLUMN IF NOT EXISTS detailed_content JSONB DEFAULT '{"content": "", "images": [], "videos": []}',
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]';

ALTER TABLE public.chicken_types 
ADD COLUMN IF NOT EXISTS detailed_content JSONB DEFAULT '{"content": "", "images": [], "videos": []}',
ADD COLUMN IF NOT EXISTS characteristics JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS care_requirements JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]';

-- Update existing records with default values if they don't have content
UPDATE public.available_farms 
SET detailed_content = '{"content": "", "images": [], "videos": []}'
WHERE detailed_content IS NULL;

UPDATE public.available_farms 
SET features = '[]'
WHERE features IS NULL;

UPDATE public.available_farms 
SET gallery_images = '[]'
WHERE gallery_images IS NULL;

UPDATE public.chicken_types 
SET detailed_content = '{"content": "", "images": [], "videos": []}'
WHERE detailed_content IS NULL;

UPDATE public.chicken_types 
SET characteristics = '[]'
WHERE characteristics IS NULL;

UPDATE public.chicken_types 
SET care_requirements = '[]'
WHERE care_requirements IS NULL;

UPDATE public.chicken_types 
SET gallery_images = '[]'
WHERE gallery_images IS NULL;