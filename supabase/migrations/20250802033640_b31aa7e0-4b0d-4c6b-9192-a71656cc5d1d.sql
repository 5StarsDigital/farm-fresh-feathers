-- Add user information columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN user_email TEXT,
ADD COLUMN user_name TEXT;

-- Update existing transactions with user information
UPDATE public.transactions 
SET 
  user_email = p.email,
  user_name = p.full_name
FROM farms f
JOIN profiles p ON f.user_id = p.id
WHERE transactions.farm_id = f.id
AND transactions.user_email IS NULL;

-- Add user information columns to payment_transactions table
ALTER TABLE public.payment_transactions
ADD COLUMN user_email TEXT,
ADD COLUMN user_name TEXT;

-- Update existing payment_transactions with user information
UPDATE public.payment_transactions
SET 
  user_email = p.email,
  user_name = p.full_name
FROM profiles p
WHERE payment_transactions.user_id = p.id
AND payment_transactions.user_email IS NULL;