-- Add package_code column to service_packages table
ALTER TABLE public.service_packages 
ADD COLUMN package_code text UNIQUE;

-- Create function to generate package code
CREATE OR REPLACE FUNCTION public.generate_package_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_code text;
  code_number integer;
BEGIN
  -- Get the highest existing code number
  SELECT COALESCE(MAX(CAST(SUBSTRING(package_code FROM 3) AS integer)), 0) + 1
  INTO code_number
  FROM public.service_packages
  WHERE package_code ~ '^GA[0-9]+$';
  
  -- Generate new code with leading zeros
  new_code := 'GA' || LPAD(code_number::text, 3, '0');
  
  RETURN new_code;
END;
$$;

-- Create trigger function to auto-generate package code
CREATE OR REPLACE FUNCTION public.auto_generate_package_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only generate code if not provided
  IF NEW.package_code IS NULL OR NEW.package_code = '' THEN
    NEW.package_code := public.generate_package_code();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-generating package codes
CREATE TRIGGER trigger_auto_package_code
  BEFORE INSERT ON public.service_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_package_code();

-- Generate codes for existing packages
UPDATE public.service_packages 
SET package_code = 'GA' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 3, '0')
WHERE package_code IS NULL;

-- Make package_code not null after migration
ALTER TABLE public.service_packages 
ALTER COLUMN package_code SET NOT NULL;