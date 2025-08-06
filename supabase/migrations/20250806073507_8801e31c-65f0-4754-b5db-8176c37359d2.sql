CREATE OR REPLACE FUNCTION public.add_chickens_to_package(package_id_param uuid, additional_quantity integer)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  package_record service_packages%ROWTYPE;
  chicken_type_record chicken_types%ROWTYPE;
  additional_cost NUMERIC;
  farm_record farms%ROWTYPE;
  current_user_id UUID;
  result JSON;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Log debug info
  RAISE LOG 'Current user ID: %', current_user_id;
  RAISE LOG 'Looking for package ID: %', package_id_param;
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;
  
  -- Get the service package
  SELECT * INTO package_record 
  FROM service_packages 
  WHERE id = package_id_param;
  
  IF NOT FOUND THEN
    RAISE LOG 'Package with ID % not found at all', package_id_param;
    RETURN json_build_object('success', false, 'error', 'Package not found in database');
  END IF;
  
  RAISE LOG 'Found package, user_id: %, current_user_id: %', package_record.user_id, current_user_id;
  
  -- Check if package belongs to current user
  IF package_record.user_id != current_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Package does not belong to current user');
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
  
  -- Get farm info (remove user_id filter since we already checked package ownership)
  SELECT * INTO farm_record 
  FROM farms 
  WHERE id = package_record.farm_id;
  
  IF NOT FOUND THEN
    RAISE LOG 'Farm with ID % not found', package_record.farm_id;
    RETURN json_build_object('success', false, 'error', 'Farm not found');
  END IF;
  
  RAISE LOG 'Found farm, balance: %', farm_record.account_balance;
  
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
$function$;