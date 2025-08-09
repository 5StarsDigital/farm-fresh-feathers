-- 1) Add columns to profiles if not exist
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS uncollected_egg integer NOT NULL DEFAULT 0;

-- Ensure username is unique (create unique index if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'profiles_username_unique'
  ) THEN
    CREATE UNIQUE INDEX profiles_username_unique ON public.profiles ((lower(username)));
  END IF;
END $$;

-- 2) Create egg_adjustments table if not exists
CREATE TABLE IF NOT EXISTS public.egg_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  before_value integer NOT NULL DEFAULT 0,
  change_amount integer NOT NULL DEFAULT 0,
  after_value integer NOT NULL DEFAULT 0,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.egg_adjustments ENABLE ROW LEVEL SECURITY;

-- Policies: Admins can insert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'egg_adjustments' AND policyname = 'Admins can insert egg adjustments'
  ) THEN
    CREATE POLICY "Admins can insert egg adjustments" ON public.egg_adjustments
    FOR INSERT
    WITH CHECK (public.is_admin() AND admin_id = auth.uid());
  END IF;

  -- Admins can view all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'egg_adjustments' AND policyname = 'Admins can view all egg adjustments'
  ) THEN
    CREATE POLICY "Admins can view all egg adjustments" ON public.egg_adjustments
    FOR SELECT
    USING (public.is_admin());
  END IF;

  -- Users can view their own
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'egg_adjustments' AND policyname = 'Users can view their own egg adjustments'
  ) THEN
    CREATE POLICY "Users can view their own egg adjustments" ON public.egg_adjustments
    FOR SELECT
    USING (user_id = auth.uid());
  END IF;
END $$;

-- Indexes to speed up queries
CREATE INDEX IF NOT EXISTS egg_adjustments_user_id_idx ON public.egg_adjustments (user_id);
CREATE INDEX IF NOT EXISTS egg_adjustments_created_at_idx ON public.egg_adjustments (created_at DESC);

-- 3) Create RPC function to adjust uncollected_egg atomically
CREATE OR REPLACE FUNCTION public.adjust_uncollected_egg(
  p_user_id uuid,
  p_mode text,
  p_amount integer DEFAULT NULL,
  p_set_value integer DEFAULT NULL,
  p_reason text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_before integer;
  v_after integer;
  v_change integer;
BEGIN
  -- Only admins can execute
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can adjust eggs';
  END IF;

  -- Lock the profile row
  SELECT uncollected_egg INTO v_before
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_before IS NULL THEN
    RAISE EXCEPTION 'User not found or uncollected_egg not available';
  END IF;

  CASE lower(coalesce(p_mode, ''))
    WHEN 'set' THEN v_after := coalesce(p_set_value, v_before);
    WHEN 'add' THEN v_after := v_before + coalesce(p_amount, 0);
    WHEN 'subtract' THEN v_after := v_before - coalesce(p_amount, 0);
    ELSE RAISE EXCEPTION 'Invalid mode: %', p_mode;
  END CASE;

  IF v_after < 0 THEN
    RAISE EXCEPTION 'after_value cannot be negative';
  END IF;

  v_change := v_after - v_before;

  -- Update profile
  UPDATE public.profiles
  SET uncollected_egg = v_after, updated_at = now()
  WHERE id = p_user_id;

  -- Insert history
  INSERT INTO public.egg_adjustments (user_id, admin_id, before_value, change_amount, after_value, reason)
  VALUES (p_user_id, auth.uid(), v_before, v_change, v_after, p_reason);

  RETURN json_build_object(
    'before_value', v_before,
    'after_value', v_after,
    'change_amount', v_change
  );
END;
$$;