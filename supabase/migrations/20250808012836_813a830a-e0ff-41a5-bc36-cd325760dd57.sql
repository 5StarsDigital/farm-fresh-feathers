-- Create unique constraint for eggs_inventory to prevent duplicate records
ALTER TABLE public.eggs_inventory DROP CONSTRAINT IF EXISTS eggs_inventory_farm_id_key;
ALTER TABLE public.eggs_inventory ADD CONSTRAINT eggs_inventory_farm_id_key UNIQUE (farm_id);

-- Clean up duplicate records, keeping the latest one for each farm
DELETE FROM public.eggs_inventory a USING (
  SELECT farm_id, MAX(created_at) as max_created_at
  FROM public.eggs_inventory 
  GROUP BY farm_id
  HAVING COUNT(*) > 1
) b
WHERE a.farm_id = b.farm_id AND a.created_at < b.max_created_at;