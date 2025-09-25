-- Allow admins to view, update, and delete all farm rentals
CREATE POLICY "Admins can view all farm rentals"
ON farm_rentals FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role])
  )
);

CREATE POLICY "Admins can update all farm rentals"
ON farm_rentals FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role])
  )
);

CREATE POLICY "Admins can delete all farm rentals"
ON farm_rentals FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role])
  )
);