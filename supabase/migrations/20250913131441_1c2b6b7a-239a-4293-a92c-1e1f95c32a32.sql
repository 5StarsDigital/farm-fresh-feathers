-- Update the balance change trigger to include reason from recent transactions
CREATE OR REPLACE FUNCTION public.notify_balance_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_transaction RECORD;
  reason_text TEXT := null;
BEGIN
  IF NEW.account_balance IS DISTINCT FROM OLD.account_balance THEN
    -- Look for recent transaction (within last 5 seconds) for this farm to get context
    SELECT transaction_type, description, quantity, amount 
    INTO recent_transaction
    FROM public.transactions 
    WHERE farm_id = NEW.id 
      AND created_at >= NOW() - INTERVAL '5 seconds'
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Generate reason based on transaction type
    IF recent_transaction.transaction_type = 'egg_sale' THEN
      reason_text := 'Bán ' || COALESCE(recent_transaction.quantity, 0) || ' quả trứng với giá 3,000đ/quả';
    ELSIF recent_transaction.transaction_type = 'package_purchase' THEN
      reason_text := 'Mua gói dịch vụ';
    ELSIF recent_transaction.transaction_type = 'daily_billing' THEN
      reason_text := 'Thanh toán hóa đơn hằng ngày';
    ELSIF recent_transaction.transaction_type = 'deposit' THEN
      reason_text := 'Nạp tiền vào tài khoản';
    END IF;
    
    INSERT INTO public.notifications (user_id, title, content, type, send_email, status, metadata)
    VALUES (
      NEW.user_id,
      'Biến động số dư',
      'Số dư thay đổi từ ' || format_vnd_amount(COALESCE(OLD.account_balance, 0)) || ' thành ' || format_vnd_amount(COALESCE(NEW.account_balance, 0)),
      'balance_change',
      false,
      'sent',
      jsonb_build_object(
        'previous', COALESCE(OLD.account_balance, 0),
        'current', COALESCE(NEW.account_balance, 0),
        'delta', COALESCE(NEW.account_balance, 0) - COALESCE(OLD.account_balance, 0),
        'reason', reason_text
      )
    );
  END IF;
  RETURN NEW;
END;
$$;