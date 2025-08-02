-- First, let's properly recreate the enum with all 4 roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'saler';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';

-- Update the user's role to superadmin
UPDATE public.user_roles 
SET role = 'superadmin'::public.app_role 
WHERE user_id = 'eae0f4cf-4954-4e6a-8b96-fbe60c320ec0';