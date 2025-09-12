-- 1) Deduplicate user_chickens table and add unique constraint
BEGIN;

-- First, delete all duplicate rows by keeping the row with the earliest created_at
WITH duplicate_groups AS (
  SELECT farm_id, chicken_type_id, 
         ROW_NUMBER() OVER (PARTITION BY farm_id, chicken_type_id ORDER BY created_at) as rn,
         SUM(quantity) OVER (PARTITION BY farm_id, chicken_type_id) as total_qty,
         id
  FROM public.user_chickens
),
rows_to_keep AS (
  SELECT farm_id, chicken_type_id, id, total_qty
  FROM duplicate_groups
  WHERE rn = 1 AND total_qty > 0
)
UPDATE public.user_chickens uc
SET quantity = rtk.total_qty,
    updated_at = now()
FROM rows_to_keep rtk
WHERE uc.id = rtk.id;

-- Delete all duplicate rows (keep only the first one per farm_id, chicken_type_id)
DELETE FROM public.user_chickens uc
WHERE uc.id NOT IN (
  SELECT id
  FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY farm_id, chicken_type_id ORDER BY created_at) as rn
    FROM public.user_chickens
  ) ranked
  WHERE rn = 1
);

-- Add unique constraint if it doesn't exist
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

-- 2) Ensure auto-generate package_code trigger exists
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

-- 3) Ensure trigger to resync user_chickens after service_packages changes
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