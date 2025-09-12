-- Create or replace resync function to ensure consistency of user_chickens
CREATE OR REPLACE FUNCTION public.resync_user_chickens(p_farm_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_upserted integer := 0;
  v_deleted integer := 0;
BEGIN
  -- Upsert aggregated quantities from active service packages
  WITH agg AS (
    SELECT 
      selected_chicken_type_id AS chicken_type_id,
      COALESCE(SUM(selected_chicken_quantity), 0)::integer AS quantity
    FROM public.service_packages
    WHERE farm_id = p_farm_id
      AND status = 'active'
      AND selected_chicken_type_id IS NOT NULL
    GROUP BY selected_chicken_type_id
  )
  INSERT INTO public.user_chickens (farm_id, chicken_type_id, quantity)
  SELECT p_farm_id, a.chicken_type_id, a.quantity
  FROM agg a
  ON CONFLICT (farm_id, chicken_type_id) DO UPDATE
    SET quantity = EXCLUDED.quantity,
        updated_at = now();
  GET DIAGNOSTICS v_upserted = ROW_COUNT;

  -- Remove any chicken rows that are no longer represented by active packages
  DELETE FROM public.user_chickens uc
  WHERE uc.farm_id = p_farm_id
    AND NOT EXISTS (
      SELECT 1 FROM public.service_packages sp
      WHERE sp.farm_id = p_farm_id
        AND sp.status = 'active'
        AND sp.selected_chicken_type_id IS NOT NULL
        AND sp.selected_chicken_type_id = uc.chicken_type_id
    );
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RETURN json_build_object('success', true, 'upserted', v_upserted, 'deleted', v_deleted);
END;
$$;

-- Update delete_service_package to use resync after deletion
CREATE OR REPLACE FUNCTION public.delete_service_package(p_package_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pkg service_packages%ROWTYPE;
  v_invoice_items_deleted integer := 0;
  v_monthly_bills_deleted integer := 0;
  v_package_deleted integer := 0;
  v_resync json;
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

  -- 4) Re-sync user_chickens based on remaining active packages
  v_resync := public.resync_user_chickens(v_pkg.farm_id);

  RETURN json_build_object(
    'success', true,
    'invoice_items_deleted', v_invoice_items_deleted,
    'monthly_bills_deleted', v_monthly_bills_deleted,
    'package_deleted', v_package_deleted,
    'resync', v_resync
  );
END;
$$;

-- Optional but recommended: keep data consistent whenever packages change
CREATE OR REPLACE FUNCTION public.after_service_packages_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.resync_user_chickens(COALESCE(NEW.farm_id, OLD.farm_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers if not already present (idempotent guards)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_service_packages_ai_resync'
  ) THEN
    CREATE TRIGGER tr_service_packages_ai_resync
    AFTER INSERT ON public.service_packages
    FOR EACH ROW EXECUTE FUNCTION public.after_service_packages_change();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_service_packages_au_resync'
  ) THEN
    CREATE TRIGGER tr_service_packages_au_resync
    AFTER UPDATE ON public.service_packages
    FOR EACH ROW EXECUTE FUNCTION public.after_service_packages_change();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_service_packages_ad_resync'
  ) THEN
    CREATE TRIGGER tr_service_packages_ad_resync
    AFTER DELETE ON public.service_packages
    FOR EACH ROW EXECUTE FUNCTION public.after_service_packages_change();
  END IF;
END $$;