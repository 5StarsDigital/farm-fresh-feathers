-- Create function to auto-populate user info in transactions
CREATE OR REPLACE FUNCTION public.populate_transaction_user_info()
RETURNS TRIGGER AS $$
BEGIN
  -- Get user info from farm and profile
  SELECT p.email, p.full_name
  INTO NEW.user_email, NEW.user_name
  FROM farms f
  JOIN profiles p ON f.user_id = p.id
  WHERE f.id = NEW.farm_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for transactions
CREATE OR REPLACE TRIGGER populate_transaction_user_info_trigger
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_transaction_user_info();

-- Create function to auto-populate user info in payment_transactions
CREATE OR REPLACE FUNCTION public.populate_payment_user_info()
RETURNS TRIGGER AS $$
BEGIN
  -- Get user info from profile
  SELECT p.email, p.full_name
  INTO NEW.user_email, NEW.user_name
  FROM profiles p
  WHERE p.id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment_transactions
CREATE OR REPLACE TRIGGER populate_payment_user_info_trigger
  BEFORE INSERT ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.populate_payment_user_info();