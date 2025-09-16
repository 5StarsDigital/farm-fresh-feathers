-- Create enum types for chicken categorization
CREATE TYPE chicken_category AS ENUM ('egg_laying', 'meat');
CREATE TYPE chicken_gender AS ENUM ('hen', 'rooster', 'mixed');

-- Add new columns to chicken_types table
ALTER TABLE public.chicken_types 
ADD COLUMN chicken_category chicken_category DEFAULT 'egg_laying',
ADD COLUMN gender chicken_gender DEFAULT 'hen';

-- Update existing data based on egg production
-- Gà Ai Cập và Gà Ri (có eggs_per_period > 0) → Gà đẻ trứng
UPDATE public.chicken_types 
SET chicken_category = 'egg_laying', gender = 'hen'
WHERE eggs_per_period > 0;

-- Gà Đông Tảo và Gà Tre (eggs_per_period = 0 hoặc thấp) → Gà thịt
UPDATE public.chicken_types 
SET chicken_category = 'meat', gender = 'hen', eggs_per_period = 0, days_per_period = 1
WHERE eggs_per_period = 0 OR eggs_per_period <= 1;

-- Create rooster versions for meat chickens
INSERT INTO public.chicken_types (
  name, description, price, eggs_per_period, days_per_period, 
  chicken_category, gender, image_url, characteristics, care_requirements, 
  detailed_content, gallery_images
)
SELECT 
  name || ' (Trống)', 
  COALESCE(description, '') || ' - Gà trống có thịt chắc, thơm ngon hơn gà mái.',
  price * 1.3, -- Gà trống giá cao hơn 30%
  0, -- Gà trống không đẻ trứng
  1,
  'meat',
  'rooster',
  image_url,
  characteristics,
  care_requirements,
  detailed_content,
  gallery_images
FROM public.chicken_types 
WHERE chicken_category = 'meat' AND gender = 'hen';