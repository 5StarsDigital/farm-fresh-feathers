-- 1) Deduplicate and add unique constraint for user_chickens to support ON CONFLICT (farm_id, chicken_type_id)
BEGIN;

-- Merge duplicate rows by (farm_id, chicken_type_id)
WITH grouped AS (
  SELECT farm_id, chicken_type_id, MIN(id) AS keep_id, SUM(quantity)::int AS total_qty, COUNT(*) AS cnt
  FROM public.user_chickens
  GROUP BY farm_id, chicken_type_id
  HAVING COUNT(*) > 1
)
UPDATE public.user_chickens uc
SET quantity = g.total_qty,
    updated_at = now()
FROM grouped g
WHERE uc.id = g.keep_id;

DELETE FROM public.user_chickens uc
USING (
  SELECT farm_id, chicken_type_id, MIN(id) AS keep_id
  FROM public.user_chickens
  GROUP BY farm_id, chicken_type_id
  HAVING COUNT(*) > 1
) d
WHERE uc.farm_id = d.farm_id
  AND uc.chicken_type_id = d.chicken_type_id
  AND uc.id <> d.keep_id;

-- Add the unique constraint (or ensure it exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_chickens_farm_type_unique'
  ) THEN
    ALTER TABLE public.user_chickens
    ADD CONSTRAINT user_chickens_farm_type_unique UNIQUE (farm_id, chicken_type_id);
  END IF;
END $$;

COMMIT;

-- 2) Ensure trigger to auto-generate package_code exists so INSERT into service_packages won't fail Not-Null
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_auto_generate_package_code'
  ) THEN
    CREATE TRIGGER trg_auto_generate_package_code
    BEFORE INSERT ON public.service_packages
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_generate_package_code();
  END IF;
END $$;

-- 3) Ensure trigger to resync user_chickens after service_packages changes (uses ON CONFLICT now backed by the unique constraint)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_after_service_packages_change'
  ) THEN
    CREATE TRIGGER trg_after_service_packages_change
    AFTER INSERT OR UPDATE OR DELETE ON public.service_packages
    FOR EACH ROW
    EXECUTE FUNCTION public.after_service_packages_change();
  END IF;
END $$;