-- Add the new enum values
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'saler';  
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';