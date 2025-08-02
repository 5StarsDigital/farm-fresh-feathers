-- Create admin_activities table to track admin actions
CREATE TABLE IF NOT EXISTS public.admin_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  target_table TEXT,
  target_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for admin activities
CREATE POLICY "Super admins can view all admin activities" 
ON public.admin_activities 
FOR SELECT 
USING (is_current_user_super_admin());

CREATE POLICY "Admins can view their own activities" 
ON public.admin_activities 
FOR SELECT 
USING (admin_id = auth.uid());

CREATE POLICY "Admins can insert their own activities" 
ON public.admin_activities 
FOR INSERT 
WITH CHECK (
  admin_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role])
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_admin_activities_updated_at
BEFORE UPDATE ON public.admin_activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to log admin activities
CREATE OR REPLACE FUNCTION public.log_admin_activity(
  p_action_type TEXT,
  p_description TEXT,
  p_details JSONB DEFAULT '{}',
  p_target_table TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  activity_id UUID;
BEGIN
  -- Only allow admins and super_admins to log activities
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role])
  ) THEN
    RAISE EXCEPTION 'Only admins can log activities';
  END IF;
  
  INSERT INTO public.admin_activities (
    admin_id,
    action_type,
    description,
    details,
    target_table,
    target_id
  ) VALUES (
    auth.uid(),
    p_action_type,
    p_description,
    p_details,
    p_target_table,
    p_target_id
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$function$;

-- Add some sample admin activities for recent admin actions
-- (These would normally be inserted by triggers on admin actions)
INSERT INTO public.admin_activities (admin_id, action_type, description, details, target_table)
SELECT 
  auth.uid(),
  'farm_management',
  'Quản lý danh sách trang trại',
  '{"action": "view_farms"}'::jsonb,
  'available_farms'
WHERE EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role])
);