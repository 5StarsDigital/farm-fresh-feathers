-- Create table for coop quote requests
CREATE TABLE public.coop_quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  design_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  estimated_price NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'quoted', 'completed', 'cancelled')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coop_quote_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own quote requests"
ON public.coop_quote_requests
FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own requests
CREATE POLICY "Users can insert their own quote requests"
ON public.coop_quote_requests
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Admins can view all requests
CREATE POLICY "Admins can view all quote requests"
ON public.coop_quote_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role])
  )
);

-- Admins can update all requests
CREATE POLICY "Admins can update quote requests"
ON public.coop_quote_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = ANY(ARRAY['admin'::app_role, 'super_admin'::app_role])
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_coop_quote_requests_updated_at
BEFORE UPDATE ON public.coop_quote_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_coop_quote_requests_user_id ON public.coop_quote_requests(user_id);
CREATE INDEX idx_coop_quote_requests_status ON public.coop_quote_requests(status);
CREATE INDEX idx_coop_quote_requests_created_at ON public.coop_quote_requests(created_at DESC);