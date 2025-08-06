-- Add chicken per coop fields to available_farms table
ALTER TABLE public.available_farms 
ADD COLUMN min_chickens_per_coop integer DEFAULT 0,
ADD COLUMN max_chickens_per_coop integer DEFAULT 0;