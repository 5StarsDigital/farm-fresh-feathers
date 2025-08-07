-- Create billing settings table for admin to manage billing date
CREATE TABLE public.billing_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  monthly_billing_date integer NOT NULL DEFAULT 1 CHECK (monthly_billing_date >= 1 AND monthly_billing_date <= 28),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on billing_settings
ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for billing_settings
CREATE POLICY "Admins can view billing settings" 
ON public.billing_settings 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role])
));

CREATE POLICY "Admins can update billing settings" 
ON public.billing_settings 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role])
));

CREATE POLICY "Admins can insert billing settings" 
ON public.billing_settings 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role])
));

-- Insert default billing settings (monthly billing on 1st of each month)
INSERT INTO public.billing_settings (monthly_billing_date) VALUES (1);

-- Add trigger for billing_settings
CREATE TRIGGER update_billing_settings_updated_at
BEFORE UPDATE ON public.billing_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create monthly_bills table to track monthly billing
CREATE TABLE public.monthly_bills (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id uuid NOT NULL,
  package_id text NOT NULL,
  package_name text NOT NULL,
  chicken_quantity integer NOT NULL DEFAULT 0,
  daily_price numeric NOT NULL DEFAULT 0,
  days_in_period integer NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  billing_period_start date NOT NULL,
  billing_period_end date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on monthly_bills
ALTER TABLE public.monthly_bills ENABLE ROW LEVEL SECURITY;

-- Create policies for monthly_bills
CREATE POLICY "Users can view their own bills" 
ON public.monthly_bills 
FOR SELECT 
USING (farm_id IN (
  SELECT id FROM farms WHERE user_id = auth.uid()
));

CREATE POLICY "System can insert bills" 
ON public.monthly_bills 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all bills" 
ON public.monthly_bills 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role])
));

-- Add trigger for monthly_bills
CREATE TRIGGER update_monthly_bills_updated_at
BEFORE UPDATE ON public.monthly_bills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update service_packages table to track start date and billing info
ALTER TABLE public.service_packages 
ADD COLUMN IF NOT EXISTS service_start_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS last_billing_date date DEFAULT NULL;