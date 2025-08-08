-- Add leftover_time column to user_chickens table to track remaining production time
ALTER TABLE public.user_chickens 
ADD COLUMN leftover_time_minutes NUMERIC DEFAULT 0;

-- Add production settings table for admin to configure egg production parameters
CREATE TABLE public.production_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_name TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on production_settings
ALTER TABLE public.production_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for production_settings
CREATE POLICY "Admins can manage production settings" 
ON public.production_settings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role])
));

CREATE POLICY "Anyone can view production settings" 
ON public.production_settings 
FOR SELECT 
USING (true);

-- Insert default production settings
INSERT INTO public.production_settings (setting_name, setting_value, description) VALUES
('egg_collection_enabled', 'true', 'Enable automatic egg collection'),
('max_uncollected_eggs_per_chicken', '10', 'Maximum uncollected eggs per chicken'),
('production_efficiency_bonus', '1.0', 'Production efficiency multiplier');

-- Add trigger for updated_at
CREATE TRIGGER update_production_settings_updated_at
BEFORE UPDATE ON public.production_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();