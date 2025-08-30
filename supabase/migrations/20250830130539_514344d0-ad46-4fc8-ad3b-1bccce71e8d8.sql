-- Create guide_sections table for storing guide content
CREATE TABLE public.guide_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '{"images": [], "videos": [], "content": ""}'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  parent_id UUID NULL REFERENCES public.guide_sections(id),
  icon TEXT NULL DEFAULT '📖',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.guide_sections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active guide sections" 
ON public.guide_sections 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage guide sections" 
ON public.guide_sections 
FOR ALL 
USING (EXISTS ( 
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() 
  AND role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role])
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_guide_sections_updated_at
BEFORE UPDATE ON public.guide_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default guide sections
INSERT INTO public.guide_sections (title, slug, content, order_index, icon) VALUES
('Giới thiệu tổng quan', 'introduction', '{"content": "# Chào mừng đến với hệ thống chăn nuôi gà thông minh\n\nHệ thống của chúng tôi giúp bạn quản lý trang trại gà một cách hiệu quả và thông minh.", "images": [], "videos": []}', 1, '🏠'),
('Đăng ký và thiết lập tài khoản', 'account-setup', '{"content": "# Thiết lập tài khoản\n\nHướng dẫn từng bước để tạo và cấu hình tài khoản của bạn.", "images": [], "videos": []}', 2, '👤'),
('Sử dụng cửa hàng', 'shop-usage', '{"content": "# Hướng dẫn sử dụng cửa hàng\n\nCách mua gà, thuê trang trại và quản lý đơn hàng.", "images": [], "videos": []}', 3, '🛒'),
('Quản lý trang trại', 'farm-management', '{"content": "# Quản lý trang trại\n\nHướng dẫn chi tiết cách quản lý trang trại, theo dõi gà và thu hoạch trứng.", "images": [], "videos": []}', 4, '🚜'),
('Hệ thống tài chính', 'financial-system', '{"content": "# Hệ thống tài chính\n\nCách nạp tiền, theo dõi chi tiêu và quản lý hóa đơn.", "images": [], "videos": []}', 5, '💰'),
('Thông báo và cảnh báo', 'notifications', '{"content": "# Hệ thống thông báo\n\nCách thiết lập và quản lý thông báo từ hệ thống.", "images": [], "videos": []}', 6, '🔔'),
('Câu hỏi thường gặp', 'faq', '{"content": "# Câu hỏi thường gặp\n\n## Làm thế nào để bắt đầu?\nBạn cần đăng ký tài khoản và nạp tiền để bắt đầu sử dụng dịch vụ.", "images": [], "videos": []}', 7, '❓');