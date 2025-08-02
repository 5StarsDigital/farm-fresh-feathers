-- Update the current user to super_admin role
-- First, let's check if the user exists and update their role
UPDATE public.user_roles 
SET role = 'super_admin' 
WHERE user_id = 'c04e339b-3a4f-4e43-9241-f78f71120878';

-- If no rows were updated, insert a new role record
INSERT INTO public.user_roles (user_id, role)
SELECT 'c04e339b-3a4f-4e43-9241-f78f71120878', 'super_admin'
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = 'c04e339b-3a4f-4e43-9241-f78f71120878'
);