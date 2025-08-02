-- Remove seller role from app_role enum
-- First, update all users with seller role to customer role
UPDATE public.user_roles 
SET role = 'customer' 
WHERE role = 'seller';

-- Drop policies that depend on the role column
DROP POLICY IF EXISTS "Super admins update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins view all roles" ON public.user_roles;

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

-- Recreate the policies
CREATE POLICY "Super admins update roles" 
ON public.user_roles 
FOR UPDATE 
USING (EXISTS (
  SELECT 1
  FROM user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'::app_role
));

CREATE POLICY "Super admins view all roles" 
ON public.user_roles 
FOR SELECT 
USING (user_id = auth.uid() OR is_current_user_super_admin());