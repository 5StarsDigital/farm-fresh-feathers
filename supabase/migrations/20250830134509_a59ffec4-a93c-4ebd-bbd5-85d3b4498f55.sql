-- Tạo helper function để định dạng số tiền VND
CREATE OR REPLACE FUNCTION public.format_vnd_amount(amount numeric)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  -- Chuyển đổi số thành chuỗi với dấu phẩy phân cách hàng nghìn và thêm "đ"
  RETURN trim(to_char(amount, '999,999,999,999')) || 'đ';
END;
$$;

-- Cập nhật function notify_balance_change để sử dụng định dạng VND
CREATE OR REPLACE FUNCTION public.notify_balance_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.account_balance IS DISTINCT FROM OLD.account_balance THEN
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
        'delta', COALESCE(NEW.account_balance, 0) - COALESCE(OLD.account_balance, 0)
      )
    );
  END IF;
  RETURN NEW;
END;
$function$;