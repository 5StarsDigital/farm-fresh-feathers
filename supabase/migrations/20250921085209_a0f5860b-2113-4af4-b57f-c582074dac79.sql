-- Update notifications type constraint to include balance_warning
ALTER TABLE public.notifications 
DROP CONSTRAINT notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY['balance_change'::text, 'monthly_billing'::text, 'package_expiry'::text, 'custom'::text, 'balance_warning'::text]));