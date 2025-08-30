-- Create contact_settings table for admin management
CREATE TABLE public.contact_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_type TEXT NOT NULL, -- 'phone', 'zalo', 'facebook', 'telegram', etc.
  label TEXT NOT NULL,
  value TEXT NOT NULL, -- phone number, zalo link, etc.
  icon TEXT NOT NULL, -- lucide icon name
  color TEXT DEFAULT '#10b981', -- hex color
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active contact settings" 
ON public.contact_settings 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Only admins can manage contact settings" 
ON public.contact_settings 
FOR ALL 
USING (public.is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_contact_settings_updated_at
BEFORE UPDATE ON public.contact_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default contact settings
INSERT INTO public.contact_settings (contact_type, label, value, icon, color, display_order) VALUES
('phone', 'Gọi điện', '0123456789', 'Phone', '#10b981', 1),
('zalo', 'Chat Zalo', 'https://zalo.me/0123456789', 'MessageCircle', '#0068ff', 2),
('facebook', 'Facebook', 'https://m.me/yourpage', 'Facebook', '#1877f2', 3),
('telegram', 'Telegram', 'https://t.me/yourusername', 'Send', '#0088cc', 4);