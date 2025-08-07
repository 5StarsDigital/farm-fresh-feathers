-- Tạo bảng để quản lý giá gói gà theo ngày
CREATE TABLE public.package_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id TEXT NOT NULL UNIQUE,
  package_name TEXT NOT NULL,
  daily_price NUMERIC NOT NULL DEFAULT 0,
  original_daily_price NUMERIC NOT NULL DEFAULT 0,
  discount_percentage INTEGER DEFAULT 0,
  description TEXT,
  subtitle TEXT,
  emoji TEXT DEFAULT '🐣',
  bg_gradient TEXT DEFAULT 'from-blue-400 to-blue-500',
  features JSONB DEFAULT '[]'::jsonb,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.package_prices ENABLE ROW LEVEL SECURITY;

-- Policies cho package_prices
CREATE POLICY "Anyone can view active package prices" 
ON public.package_prices 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can insert package prices" 
ON public.package_prices 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role])
));

CREATE POLICY "Admins can update package prices" 
ON public.package_prices 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role])
));

CREATE POLICY "Admins can view all package prices" 
ON public.package_prices 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role])
));

-- Trigger để tự động cập nhật updated_at
CREATE TRIGGER update_package_prices_updated_at
BEFORE UPDATE ON public.package_prices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert dữ liệu mẫu cho các gói gà
INSERT INTO public.package_prices (package_id, package_name, daily_price, original_daily_price, discount_percentage, description, subtitle, emoji, bg_gradient, features, is_popular) VALUES
('basic', 'Gói Cơ Bản', 7000, 10000, 29, 'Chăm sóc tiết kiệm nhưng đầy đủ', '"Chăm chỉ mỗi ngày"', '🐣', 'from-blue-400 to-blue-500', '["Ăn 2 bữa/ngày thức ăn thô sạch", "Nước uống sạch mỗi ngày", "Bổ sung rau xanh tươi", "Dọn chuồng 1 lần/tuần", "Thả ra sân phơi nắng"]', false),
('advanced', 'Gói Nâng Cao', 14000, 19000, 27, 'Chăm như thú cưng, ăn ngon hơn', '"Gà có Gu"', '🥚', 'from-yellow-400 to-yellow-500', '["Tất cả dịch vụ Gói Cơ Bản", "Sâu gạo 1 lần/tuần", "Hoa quả theo mùa", "Vệ sinh chuồng 2 lần/tuần", "Báo cáo tăng trưởng hàng tháng"]', false),
('vip', 'Gói VIP', 27000, 37000, 27, 'Trải nghiệm cá nhân hóa cao cấp', '"Chủ tịch Gà"', '🐓', 'from-purple-400 to-purple-500', '["Bao gồm Gói Nâng Cao", "Thức ăn đặc biệt: dế mèn, thịt bò", "Mắc màn chống muỗi, côn trùng", "Thiết kế chuồng bằng AI", "Tư vấn chuyên gia riêng"]', true),
('king', 'Gói King Chicken', 50000, 67000, 25, 'Xa xỉ và sáng tạo tột đỉnh', '"Hoàng gia dành cho gà"', '👑', 'from-gradient-start to-gradient-end', '["Bao gồm tất cả dịch vụ VIP", "Tắm nước sạch cho gà", "Hoa quả nhập khẩu cao cấp", "Nhạc thư giãn trong chuồng", "Video vlog nuôi gà cá nhân"]', false);