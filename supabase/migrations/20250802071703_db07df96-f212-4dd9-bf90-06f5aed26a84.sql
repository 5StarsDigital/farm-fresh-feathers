-- Remove seller role from app_role enum and update existing seller users to customer
-- First, update all users with seller role to customer role
UPDATE public.user_roles 
SET role = 'customer' 
WHERE role = 'seller';

-- Remove the default value temporarily
ALTER TABLE public.user_roles ALTER COLUMN role DROP DEFAULT;

-- Create new enum without seller
CREATE TYPE app_role_new AS ENUM ('customer', 'admin', 'super_admin');

-- Update the user_roles table to use the new enum
ALTER TABLE public.user_roles 
ALTER COLUMN role TYPE app_role_new 
USING role::text::app_role_new;

-- Drop the old enum and rename the new one
DROP TYPE app_role;
ALTER TYPE app_role_new RENAME TO app_role;

-- Add back the default value
ALTER TABLE public.user_roles ALTER COLUMN role SET DEFAULT 'customer'::app_role;