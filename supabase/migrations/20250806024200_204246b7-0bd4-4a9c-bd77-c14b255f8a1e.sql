-- Create service packages table to track purchased service packages
CREATE TABLE public.service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  farm_id UUID NOT NULL,
  package_id TEXT NOT NULL, -- 'basic', 'advanced', 'vip'
  package_name TEXT NOT NULL,
  package_price NUMERIC NOT NULL,
  coop_id TEXT, -- selected coop design or farm rental
  coop_name TEXT,
  coop_price NUMERIC DEFAULT 0,
  selected_chicken_type_id UUID, -- the chicken type selected for this package
  selected_chicken_type_name TEXT,
  selected_chicken_quantity INTEGER DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'active',
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own service packages" 
ON public.service_packages 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own service packages" 
ON public.service_packages 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own service packages" 
ON public.service_packages 
FOR UPDATE 
USING (user_id = auth.uid());

-- Add trigger for timestamp updates
CREATE TRIGGER update_service_packages_updated_at
BEFORE UPDATE ON public.service_packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to add more chickens to existing package
CREATE OR REPLACE FUNCTION add_chickens_to_package(
  package_id_param UUID,
  additional_quantity INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  package_record service_packages%ROWTYPE;
  chicken_type_record chicken_types%ROWTYPE;
  additional_cost NUMERIC;
  farm_record farms%ROWTYPE;
  result JSON;
BEGIN
  -- Get the service package
  SELECT * INTO package_record 
  FROM service_packages 
  WHERE id = package_id_param AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Package not found');
  END IF;
  
  -- Get chicken type info
  SELECT * INTO chicken_type_record 
  FROM chicken_types 
  WHERE id = package_record.selected_chicken_type_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Chicken type not found');
  END IF;
  
  -- Calculate additional cost
  additional_cost := chicken_type_record.price * additional_quantity;
  
  -- Get farm info
  SELECT * INTO farm_record 
  FROM farms 
  WHERE id = package_record.farm_id AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Farm not found');
  END IF;
  
  -- Check if user has enough balance
  IF farm_record.account_balance < additional_cost THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;
  
  -- Update farm balance
  UPDATE farms 
  SET account_balance = account_balance - additional_cost
  WHERE id = package_record.farm_id;
  
  -- Update package chicken quantity
  UPDATE service_packages 
  SET 
    selected_chicken_quantity = selected_chicken_quantity + additional_quantity,
    total_amount = total_amount + additional_cost,
    updated_at = now()
  WHERE id = package_id_param;
  
  -- Update user_chickens table
  INSERT INTO user_chickens (farm_id, chicken_type_id, quantity)
  VALUES (package_record.farm_id, package_record.selected_chicken_type_id, additional_quantity)
  ON CONFLICT (farm_id, chicken_type_id) 
  DO UPDATE SET 
    quantity = user_chickens.quantity + additional_quantity,
    updated_at = now();
  
  -- Create transaction record
  INSERT INTO transactions (
    farm_id, 
    transaction_type, 
    amount, 
    quantity, 
    description
  ) VALUES (
    package_record.farm_id,
    'chicken_purchase',
    -additional_cost,
    additional_quantity,
    'Mua thêm ' || additional_quantity || ' con ' || chicken_type_record.name || ' cho gói ' || package_record.package_name
  );
  
  -- Get updated balance
  SELECT account_balance INTO farm_record.account_balance 
  FROM farms 
  WHERE id = package_record.farm_id;
  
  RETURN json_build_object(
    'success', true, 
    'additional_cost', additional_cost,
    'new_balance', farm_record.account_balance,
    'new_quantity', package_record.selected_chicken_quantity + additional_quantity
  );
END;
$$;