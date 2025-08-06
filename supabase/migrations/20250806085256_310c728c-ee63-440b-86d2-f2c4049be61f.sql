-- Allow admins to update any service package
CREATE POLICY "Admins can update any service package" 
ON public.service_packages 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role])
));

-- Allow admins to view all service packages  
CREATE POLICY "Admins can view all service packages" 
ON public.service_packages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role])
));