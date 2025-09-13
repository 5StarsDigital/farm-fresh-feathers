-- Create function to create balance change notification with reason
CREATE OR REPLACE FUNCTION create_balance_change_notification_with_reason(
  target_user_id uuid,
  old_balance numeric,
  new_balance numeric,
  reason_text text DEFAULT null
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, content, type, send_email, status, metadata)
  VALUES (
    target_user_id,
    'Biến động số dư',
    'Số dư thay đổi từ ' || format_vnd_amount(COALESCE(old_balance, 0)) || ' thành ' || format_vnd_amount(COALESCE(new_balance, 0)),
    'balance_change',
    false,
    'sent',
    jsonb_build_object(
      'previous', COALESCE(old_balance, 0),
      'current', COALESCE(new_balance, 0),
      'delta', COALESCE(new_balance, 0) - COALESCE(old_balance, 0),
      'reason', reason_text
    )
  );
END;
$$;