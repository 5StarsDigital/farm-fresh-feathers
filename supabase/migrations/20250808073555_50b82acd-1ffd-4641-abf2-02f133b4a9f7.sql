-- Create function and trigger to notify on balance changes
CREATE OR REPLACE FUNCTION public.notify_balance_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_balance IS DISTINCT FROM OLD.account_balance THEN
    INSERT INTO public.notifications (user_id, title, content, type, send_email, status, metadata)
    VALUES (
      NEW.user_id,
      'Biến động số dư',
      'Số dư thay đổi từ ' || COALESCE(OLD.account_balance, 0) || ' thành ' || COALESCE(NEW.account_balance, 0),
      'general',
      false,
      'sent',
      jsonb_build_object('previous', COALESCE(OLD.account_balance, 0), 'current', COALESCE(NEW.account_balance, 0), 'delta', COALESCE(NEW.account_balance, 0) - COALESCE(OLD.account_balance, 0))
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_balance_change ON public.farms;
CREATE TRIGGER trg_notify_balance_change
AFTER UPDATE OF account_balance ON public.farms
FOR EACH ROW
EXECUTE FUNCTION public.notify_balance_change();

-- Create function and trigger to notify when monthly bill cannot be paid due to insufficient balance
CREATE OR REPLACE FUNCTION public.notify_insufficient_monthly_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bal numeric;
BEGIN
  SELECT account_balance INTO bal FROM public.farms WHERE id = NEW.farm_id;

  IF bal IS NULL THEN
    RETURN NEW;
  END IF;

  IF bal < NEW.total_amount THEN
    INSERT INTO public.notifications (user_id, title, content, type, send_email, status, metadata)
    SELECT f.user_id,
           'Số dư không đủ',
           'Số dư hiện tại (' || bal || ') không đủ để thanh toán hóa đơn tháng ' || to_char(NEW.billing_period_start, 'MM/YYYY'),
           'general',
           false,
           'sent',
           jsonb_build_object('required', NEW.total_amount, 'current', bal, 'bill_id', NEW.id)
    FROM public.farms f
    WHERE f.id = NEW.farm_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_insufficient_monthly_balance ON public.monthly_bills;
CREATE TRIGGER trg_notify_insufficient_monthly_balance
AFTER INSERT ON public.monthly_bills
FOR EACH ROW
EXECUTE FUNCTION public.notify_insufficient_monthly_balance();