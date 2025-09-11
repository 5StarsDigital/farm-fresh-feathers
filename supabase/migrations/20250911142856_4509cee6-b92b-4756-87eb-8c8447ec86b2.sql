-- Create a secure function to delete a service package and its related debts
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
    'package_deleted', v_package_deleted
  );
END;
$function$;

-- Allow authenticated users to call the function (it performs its own admin check)
REVOKE ALL ON FUNCTION public.delete_service_package(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_service_package(uuid) TO authenticated;