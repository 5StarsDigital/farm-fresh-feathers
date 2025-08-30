-- Sửa function format_vnd_amount để thêm search_path
CREATE OR REPLACE FUNCTION public.format_vnd_amount(amount numeric)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Chuyển đổi số thành chuỗi với dấu phẩy phân cách hàng nghìn và thêm "đ"
  RETURN trim(to_char(amount, '999,999,999,999')) || 'đ';
END;
$$;