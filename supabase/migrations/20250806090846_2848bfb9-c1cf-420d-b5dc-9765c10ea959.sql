-- Allow admins to view all profiles for user information
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role])
));