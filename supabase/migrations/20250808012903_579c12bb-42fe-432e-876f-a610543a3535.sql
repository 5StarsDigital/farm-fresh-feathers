-- Clean up duplicate records first, keeping the latest one for each farm
DELETE FROM public.eggs_inventory 
WHERE id NOT IN (
  SELECT DISTINCT ON (farm_id) id
  FROM public.eggs_inventory
  ORDER BY farm_id, created_at DESC
);

-- Now create unique constraint for eggs_inventory to prevent future duplicates
ALTER TABLE public.eggs_inventory ADD CONSTRAINT eggs_inventory_farm_id_key UNIQUE (farm_id);