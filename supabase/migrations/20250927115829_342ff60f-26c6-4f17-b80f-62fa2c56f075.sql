-- Step 1: Add service_package_id reference to farm_rentals table
ALTER TABLE public.farm_rentals 
ADD COLUMN service_package_id uuid REFERENCES public.service_packages(id) ON DELETE CASCADE;

-- Step 2: Create index for better performance
CREATE INDEX idx_farm_rentals_service_package_id ON public.farm_rentals(service_package_id);

-- Step 3: Update existing farm_rentals to link with service_packages
-- This attempts to match based on user_id, farm_id, and creation time proximity
UPDATE public.farm_rentals fr
SET service_package_id = (
  SELECT sp.id 
  FROM public.service_packages sp
  WHERE sp.user_id = fr.user_id 
    AND sp.farm_id = fr.farm_id
    AND sp.package_id IN ('advanced', 'vip')
    AND ABS(EXTRACT(epoch FROM (sp.created_at - fr.created_at))) < 60 -- within 1 minute
  ORDER BY ABS(EXTRACT(epoch FROM (sp.created_at - fr.created_at))) ASC
  LIMIT 1
)
WHERE service_package_id IS NULL;

-- Step 4: Update the delete_service_package function to also delete farm_rentals
CREATE OR REPLACE FUNCTION public.delete_service_package(p_package_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pkg service_packages%ROWTYPE;
  v_invoice_items_deleted integer := 0;
  v_monthly_bills_deleted integer := 0;
  v_farm_rentals_deleted integer := 0;
  v_package_deleted integer := 0;
  v_resync json;
  v_available_farm_id uuid;
BEGIN
  -- Only admins/super_admins can delete packages
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can delete packages';
  END IF;

  -- Fetch the package
  SELECT * INTO v_pkg FROM public.service_packages WHERE id = p_package_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Package not found');
  END IF;

  -- 1) Delete invoice_items that reference this package (by UUID)
  DELETE FROM public.invoice_items
  WHERE package_id = p_package_id;
  GET DIAGNOSTICS v_invoice_items_deleted = ROW_COUNT;

  -- 2) Delete any monthly_bills for this package (by farm + text package_id + package_name)
  DELETE FROM public.monthly_bills
  WHERE farm_id = v_pkg.farm_id
    AND package_id = v_pkg.package_id
    AND package_name = v_pkg.package_name;
  GET DIAGNOSTICS v_monthly_bills_deleted = ROW_COUNT;

  -- 3) Delete farm_rentals linked to this service package and restore available_coops
  DELETE FROM public.farm_rentals
  WHERE service_package_id = p_package_id
  RETURNING available_farm_id INTO v_available_farm_id;
  GET DIAGNOSTICS v_farm_rentals_deleted = ROW_COUNT;

  -- Restore available_coops if farm rental was deleted
  IF v_farm_rentals_deleted > 0 AND v_available_farm_id IS NOT NULL THEN
    UPDATE public.available_farms
    SET available_coops = available_coops + 1
    WHERE id = v_available_farm_id;
  END IF;

  -- 4) Finally delete the service package
  DELETE FROM public.service_packages
  WHERE id = p_package_id;
  GET DIAGNOSTICS v_package_deleted = ROW_COUNT;

  IF v_package_deleted = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Failed to delete package (RLS or FK constraint)');
  END IF;

  -- 5) Re-sync user_chickens based on remaining active packages
  v_resync := public.resync_user_chickens(v_pkg.farm_id);

  RETURN json_build_object(
    'success', true,
    'invoice_items_deleted', v_invoice_items_deleted,
    'monthly_bills_deleted', v_monthly_bills_deleted,
    'farm_rentals_deleted', v_farm_rentals_deleted,
    'package_deleted', v_package_deleted,
    'resync', v_resync
  );
END;
$function$;