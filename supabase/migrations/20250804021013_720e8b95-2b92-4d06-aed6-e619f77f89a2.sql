-- Update user farm balance to 50 million VND
UPDATE public.farms 
SET account_balance = 50000000 
WHERE user_id = auth.uid();