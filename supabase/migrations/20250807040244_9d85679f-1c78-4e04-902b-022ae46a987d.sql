-- Update chicken_types table to separate egg production into two fields
ALTER TABLE public.chicken_types 
DROP COLUMN IF EXISTS egg_production_rate;

ALTER TABLE public.chicken_types 
ADD COLUMN eggs_per_period integer NOT NULL DEFAULT 1,
ADD COLUMN days_per_period integer NOT NULL DEFAULT 1;

-- Update existing data to maintain current behavior (1 egg per day)
UPDATE public.chicken_types 
SET eggs_per_period = 1, days_per_period = 1;