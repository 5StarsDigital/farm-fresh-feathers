-- Add last_billed_at to farm_rentals for daily billing tracking
ALTER TABLE public.farm_rentals
ADD COLUMN IF NOT EXISTS last_billed_at TIMESTAMP WITH TIME ZONE;

-- Optional index for queries by user or farm and status
CREATE INDEX IF NOT EXISTS idx_farm_rentals_user_status ON public.farm_rentals (user_id, status);
CREATE INDEX IF NOT EXISTS idx_farm_rentals_farm_status ON public.farm_rentals (farm_id, status);
