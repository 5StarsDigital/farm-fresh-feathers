-- Create function to execute checkout transaction atomically (fix parameter order)
CREATE OR REPLACE FUNCTION public.execute_checkout_transaction(
  p_user_id UUID,
  p_farm_id UUID,
  p_package_id TEXT,
  p_package_name TEXT,
  p_package_price NUMERIC,
  p_selected_chicken_type_id UUID,
  p_selected_chicken_type_name TEXT,
  p_selected_chicken_quantity INTEGER,
  p_total_amount NUMERIC,
  p_coop_id TEXT DEFAULT NULL,
  p_selected_chickens JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_farm_balance NUMERIC;
  v_coop_name TEXT := 'Chuồng Nuôi Chung';
  v_coop_price NUMERIC := 0;
  v_available_farm RECORD;
  v_coop_designs RECORD;
  v_chicken_entry RECORD;
  v_existing_chicken RECORD;
  v_chicken_quantity INTEGER;
BEGIN
  -- Start transaction (implicit in function)
  
  -- Lock and check farm balance
  SELECT account_balance INTO v_farm_balance
  FROM public.farms 
  WHERE id = p_farm_id AND user_id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Farm not found for user';
  END IF;
  
  IF v_farm_balance < p_total_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Deduct balance
  UPDATE public.farms 
  SET account_balance = account_balance - p_total_amount,
      updated_at = now()
  WHERE id = p_farm_id;
  
  -- Handle farm rental if it's advanced or vip package
  IF (p_package_id = 'advanced' OR p_package_id = 'vip') AND p_coop_id IS NOT NULL THEN
    -- Check if coopId is actually an available_farm_id
    SELECT * INTO v_available_farm
    FROM public.available_farms
    WHERE id = p_coop_id::uuid;
    
    IF FOUND THEN
      v_coop_name := v_available_farm.name;
      v_coop_price := v_available_farm.rental_price;
      
      -- Create farm rental record
      INSERT INTO public.farm_rentals (
        user_id,
        farm_id,
        available_farm_id,
        rental_price,
        monthly_cost,
        status
      ) VALUES (
        p_user_id,
        p_farm_id,
        p_coop_id::uuid,
        v_available_farm.rental_price,
        v_available_farm.monthly_cost,
        'active'
      );
      
      -- Decrease available coops
      UPDATE public.available_farms
      SET available_coops = available_coops - 1
      WHERE id = p_coop_id::uuid;
    END IF;
  ELSIF p_coop_id IS NOT NULL THEN
    -- Handle regular coop designs
    CASE p_coop_id
      WHEN 'shared' THEN
        v_coop_name := 'Chuồng Nuôi Chung';
        v_coop_price := 0;
      WHEN 'individual' THEN
        v_coop_name := 'Chuồng Riêng Biệt';
        v_coop_price := 100000;
      WHEN 'luxury' THEN
        v_coop_name := 'Chuồng Cao Cấp';
        v_coop_price := 200000;
      WHEN 'ai-designed' THEN
        v_coop_name := 'Chuồng Thiết Kế AI';
        v_coop_price := 300000;
      ELSE
        v_coop_name := 'Chuồng Nuôi Chung';
        v_coop_price := 0;
    END CASE;
  END IF;
  
  -- Add chickens to user's farm
  FOR v_chicken_entry IN 
    SELECT key as chicken_type_id, value::integer as quantity
    FROM jsonb_each_text(p_selected_chickens)
    WHERE value::integer > 0
  LOOP
    -- Check if user already has this chicken type
    SELECT * INTO v_existing_chicken
    FROM public.user_chickens
    WHERE farm_id = p_farm_id 
    AND chicken_type_id = v_chicken_entry.chicken_type_id::uuid;
    
    IF FOUND THEN
      -- Update existing quantity
      UPDATE public.user_chickens
      SET quantity = quantity + v_chicken_entry.quantity,
          updated_at = now()
      WHERE id = v_existing_chicken.id;
    ELSE
      -- Insert new chicken record
      INSERT INTO public.user_chickens (
        farm_id,
        chicken_type_id,
        quantity
      ) VALUES (
        p_farm_id,
        v_chicken_entry.chicken_type_id::uuid,
        v_chicken_entry.quantity
      );
    END IF;
  END LOOP;
  
  -- Create service package record
  INSERT INTO public.service_packages (
    user_id,
    farm_id,
    package_id,
    package_name,
    package_price,
    coop_id,
    coop_name,
    coop_price,
    selected_chicken_type_id,
    selected_chicken_type_name,
    selected_chicken_quantity,
    total_amount
  ) VALUES (
    p_user_id,
    p_farm_id,
    p_package_id,
    p_package_name,
    p_package_price,
    p_coop_id,
    v_coop_name,
    v_coop_price,
    p_selected_chicken_type_id,
    p_selected_chicken_type_name,
    p_selected_chicken_quantity,
    p_total_amount
  );
  
  -- Record transaction
  INSERT INTO public.transactions (
    farm_id,
    transaction_type,
    amount,
    description
  ) VALUES (
    p_farm_id,
    'package_purchase',
    -p_total_amount,
    'Mua gói ' || p_package_name || ' - ' || p_selected_chicken_type_name || ' (' || p_selected_chicken_quantity || ' con) - Tổng tiền: ' || p_total_amount || ' VND'
  );
  
  -- If we get here, all operations succeeded
END;
$$;