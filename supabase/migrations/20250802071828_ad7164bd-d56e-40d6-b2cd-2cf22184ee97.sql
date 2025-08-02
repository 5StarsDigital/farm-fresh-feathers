-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Insert default role as customer
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.populate_transaction_user_info()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Get user info from farm and profile
  SELECT p.email, p.full_name
  INTO NEW.user_email, NEW.user_name
  FROM public.farms f
  JOIN public.profiles p ON f.user_id = p.id
  WHERE f.id = NEW.farm_id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.populate_payment_user_info()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Get user info from profile
  SELECT p.email, p.full_name
  INTO NEW.user_email, NEW.user_name
  FROM public.profiles p
  WHERE p.id = NEW.user_id;
  
  RETURN NEW;
END;
$function$;