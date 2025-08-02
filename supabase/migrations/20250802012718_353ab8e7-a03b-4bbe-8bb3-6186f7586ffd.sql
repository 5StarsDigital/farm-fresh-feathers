-- Update user role to superadmin (highest privilege level)
UPDATE public.user_roles 
SET role = 'superadmin'::public.app_role 
WHERE user_id = 'eae0f4cf-4954-4e6a-8b96-fbe60c320ec0';