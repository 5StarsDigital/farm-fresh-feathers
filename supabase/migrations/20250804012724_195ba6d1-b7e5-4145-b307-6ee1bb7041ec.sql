-- Set very large balance for demo purposes (max allowed by numeric(10,2))
UPDATE public.farms 
SET account_balance = 99999999.99 
WHERE user_id = 'c04e339b-3a4f-4e43-9241-f78f71120878';