-- Create table to track processed transactions to avoid duplicates
CREATE TABLE public.processed_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_number BIGINT NOT NULL UNIQUE,
  posting_date BIGINT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.processed_transactions ENABLE ROW LEVEL SECURITY;

-- Only admins can view processed transactions
CREATE POLICY "Admins can view processed transactions" 
ON public.processed_transactions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role])
));

-- Create index for better performance
CREATE INDEX idx_processed_transactions_number ON public.processed_transactions(transaction_number);
CREATE INDEX idx_processed_transactions_date ON public.processed_transactions(posting_date);