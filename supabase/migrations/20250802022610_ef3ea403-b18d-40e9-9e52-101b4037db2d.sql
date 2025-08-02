-- Allow super_admin to view all transactions
CREATE POLICY "Super admins can view all transactions"
ON public.transactions
FOR SELECT
TO public
USING (is_current_user_super_admin());

-- Allow super_admin to view all payment transactions  
CREATE POLICY "Super admins can view all payment transactions"
ON public.payment_transactions
FOR SELECT
TO public
USING (is_current_user_super_admin());