-- Kiểm tra trigger hiện tại cho notify_balance_change
-- Và cập nhật để luôn có lý do cho mọi biến động số dư

-- Cập nhật function notify_balance_change để có lý do đầy đủ hơn
CREATE OR REPLACE FUNCTION public.notify_balance_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  recent_transaction RECORD;
  reason_text TEXT := null;
BEGIN
  IF NEW.account_balance IS DISTINCT FROM OLD.account_balance THEN
    -- Look for recent transaction (within last 10 seconds) for this farm to get context
    SELECT transaction_type, description, quantity, amount 
    INTO recent_transaction
    FROM public.transactions 
    WHERE farm_id = NEW.id 
      AND created_at >= NOW() - INTERVAL '10 seconds'
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Generate reason based on transaction type with more detailed descriptions
    IF recent_transaction.transaction_type = 'egg_sale' THEN
      reason_text := 'Bán ' || COALESCE(recent_transaction.quantity, 0) || ' quả trứng với giá 3,000đ/quả';
    ELSIF recent_transaction.transaction_type = 'package_purchase' THEN
      reason_text := 'Mua gói dịch vụ: ' || COALESCE(recent_transaction.description, 'Gói dịch vụ');
    ELSIF recent_transaction.transaction_type = 'purchase_chicken' OR recent_transaction.transaction_type = 'chicken_purchase' THEN
      reason_text := COALESCE(recent_transaction.description, 'Mua thêm gà giống');
    ELSIF recent_transaction.transaction_type = 'daily_billing' THEN
      reason_text := 'Thanh toán hóa đơn hằng ngày';
    ELSIF recent_transaction.transaction_type = 'monthly_billing' THEN
      reason_text := 'Thanh toán hóa đơn hằng tháng';
    ELSIF recent_transaction.transaction_type = 'deposit' THEN
      reason_text := COALESCE(recent_transaction.description, 'Nạp tiền vào tài khoản');
    ELSIF recent_transaction.transaction_type = 'withdrawal' THEN
      reason_text := 'Rút tiền từ tài khoản';
    ELSIF recent_transaction.transaction_type = 'refund' THEN
      reason_text := 'Hoàn tiền: ' || COALESCE(recent_transaction.description, 'Giao dịch hoàn tiền');
    ELSIF recent_transaction.transaction_type = 'accessory_purchase' THEN
      reason_text := COALESCE(recent_transaction.description, 'Mua phụ kiện');
    ELSIF recent_transaction.transaction_type = 'farm_rental' THEN
      reason_text := 'Thuê trang trại';
    ELSIF recent_transaction.transaction_type = 'chicken_rental' THEN
      reason_text := COALESCE(recent_transaction.description, 'Thuê gà giống');
    ELSIF recent_transaction.transaction_type = 'egg_collection' THEN
      reason_text := 'Thu hoạch trứng tự động';
    ELSE
      -- If we have a recent transaction but unknown type, use its description
      IF recent_transaction.description IS NOT NULL THEN
        reason_text := recent_transaction.description;
      ELSE
        -- Determine reason based on balance change direction
        IF NEW.account_balance > OLD.account_balance THEN
          reason_text := 'Nạp tiền vào tài khoản';
        ELSE
          reason_text := 'Chi tiêu từ tài khoản';
        END IF;
      END IF;
    END IF;
    
    -- If no recent transaction found, provide generic reason based on balance change
    IF reason_text IS NULL THEN
      IF NEW.account_balance > OLD.account_balance THEN
        reason_text := 'Nạp tiền vào tài khoản';
      ELSE
        reason_text := 'Chi tiêu từ tài khoản';
      END IF;
    END IF;
    
    INSERT INTO public.notifications (user_id, title, content, type, send_email, status, metadata)
    VALUES (
      NEW.user_id,
      'Biến động số dư',
      'Số dư thay đổi từ ' || format_vnd_amount(COALESCE(OLD.account_balance, 0)) || ' thành ' || format_vnd_amount(COALESCE(NEW.account_balance, 0)) || 
      CASE WHEN reason_text IS NOT NULL THEN '. Lý do: ' || reason_text ELSE '' END,
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
$function$;

-- Đảm bảo trigger được gắn vào bảng farms
DROP TRIGGER IF EXISTS notify_balance_change_trigger ON public.farms;
CREATE TRIGGER notify_balance_change_trigger
  AFTER UPDATE ON public.farms
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_balance_change();