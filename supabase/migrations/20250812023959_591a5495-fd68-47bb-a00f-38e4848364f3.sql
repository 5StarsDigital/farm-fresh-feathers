-- Migration: Add auto billing flags, last_billed_at, and billing artifacts
-- 1) Extend billing_settings with auto flags
ALTER TABLE public.billing_settings
  ADD COLUMN IF NOT EXISTS auto_monthly_billing_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_cron_billing_enabled boolean NOT NULL DEFAULT true;

-- 2) Extend service_packages with last_billed_at (manual/auto unified)
ALTER TABLE public.service_packages
  ADD COLUMN IF NOT EXISTS last_billed_at timestamptz NULL;

-- 3) Create billing_runs (log per run)
CREATE TABLE IF NOT EXISTS public.billing_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'manual',
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz NULL,
  initiated_by uuid NULL,
  dry_run boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  summary_json jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.billing_runs ENABLE ROW LEVEL SECURITY;

-- Policies for billing_runs: admins can manage, others no access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'billing_runs' AND policyname = 'Admins can view billing runs'
  ) THEN
    CREATE POLICY "Admins can view billing runs" ON public.billing_runs FOR SELECT
      USING (public.is_admin());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'billing_runs' AND policyname = 'Admins can insert billing runs'
  ) THEN
    CREATE POLICY "Admins can insert billing runs" ON public.billing_runs FOR INSERT
      WITH CHECK (public.is_admin());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'billing_runs' AND policyname = 'Admins can update billing runs'
  ) THEN
    CREATE POLICY "Admins can update billing runs" ON public.billing_runs FOR UPDATE
      USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'billing_runs' AND policyname = 'Admins can delete billing runs'
  ) THEN
    CREATE POLICY "Admins can delete billing runs" ON public.billing_runs FOR DELETE
      USING (public.is_admin());
  END IF;
END $$;

-- 4) Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.billing_runs(id) ON DELETE CASCADE,
  farm_id uuid NULL,
  user_id uuid NULL,
  total_amount numeric NOT NULL DEFAULT 0,
  balance_before numeric NULL,
  balance_after numeric NULL,
  status text NOT NULL DEFAULT 'paid',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Policies for invoices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invoices' AND policyname = 'Admins can view all invoices'
  ) THEN
    CREATE POLICY "Admins can view all invoices" ON public.invoices FOR SELECT
      USING (public.is_admin());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invoices' AND policyname = 'System can insert invoices'
  ) THEN
    -- Allow insertion from service role and edge functions; CHECK true mirrors existing patterns
    CREATE POLICY "System can insert invoices" ON public.invoices FOR INSERT
      WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invoices' AND policyname = 'Admins can update invoices'
  ) THEN
    CREATE POLICY "Admins can update invoices" ON public.invoices FOR UPDATE
      USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invoices' AND policyname = 'Users can view their own invoices'
  ) THEN
    CREATE POLICY "Users can view their own invoices" ON public.invoices FOR SELECT
      USING (
        farm_id IN (
          SELECT f.id FROM public.farms f WHERE f.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 5) Create invoice_items table
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  package_id uuid NULL,
  package_name text NULL,
  daily_price numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 0,
  days_elapsed integer NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Policies for invoice_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invoice_items' AND policyname = 'Admins can view all invoice items'
  ) THEN
    CREATE POLICY "Admins can view all invoice items" ON public.invoice_items FOR SELECT
      USING (public.is_admin());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invoice_items' AND policyname = 'System can insert invoice items'
  ) THEN
    CREATE POLICY "System can insert invoice items" ON public.invoice_items FOR INSERT
      WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'invoice_items' AND policyname = 'Users can view their own invoice items'
  ) THEN
    CREATE POLICY "Users can view their own invoice items" ON public.invoice_items FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.invoices i
          JOIN public.farms f ON f.id = i.farm_id
          WHERE i.id = invoice_items.invoice_id
            AND f.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_run_id ON public.invoices(run_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);