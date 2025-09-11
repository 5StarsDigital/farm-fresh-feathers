-- Update function to also adjust user_chickens when deleting a package
CREATE OR REPLACE FUNCTION public.delete_service_package(p_package_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_pkg service_packages%ROWTYPE;
  v_invoice_items_deleted integer := 0;
  v_monthly_bills_deleted integer := 0;
  v_user_chickens_updated integer := 0;
  v_user_chickens_deleted integer := 0;
  v_package_deleted integer := 0;
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

  -- 0) Adjust user_chickens stock for this farm and chicken type
  IF v_pkg.selected_chicken_type_id IS NOT NULL AND v_pkg.selected_chicken_quantity IS NOT NULL THEN
    UPDATE public.user_chickens
      SET quantity = GREATEST(quantity - v_pkg.selected_chicken_quantity, 0),
          updated_at = now()
      WHERE farm_id = v_pkg.farm_id
        AND chicken_type_id = v_pkg.selected_chicken_type_id;
    GET DIAGNOSTICS v_user_chickens_updated = ROW_COUNT;

    -- Remove rows that drop to 0
    DELETE FROM public.user_chickens
      WHERE farm_id = v_pkg.farm_id
        AND chicken_type_id = v_pkg.selected_chicken_type_id
        AND quantity <= 0;
    GET DIAGNOSTICS v_user_chickens_deleted = ROW_COUNT;
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

  -- 3) Finally delete the service package
  DELETE FROM public.service_packages
  WHERE id = p_package_id;
  GET DIAGNOSTICS v_package_deleted = ROW_COUNT;

  IF v_package_deleted = 0 THEN
    RETURN json_build_object('success', false, 'error', 'Failed to delete package (RLS or FK constraint)');
  END IF;

  RETURN json_build_object(
    'success', true,
    'invoice_items_deleted', v_invoice_items_deleted,
    'monthly_bills_deleted', v_monthly_bills_deleted,
    'user_chickens_updated', v_user_chickens_updated,
    'user_chickens_deleted', v_user_chickens_deleted,
    'package_deleted', v_package_deleted
  );
END;
$function$;