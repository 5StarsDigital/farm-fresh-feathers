-- Enable required extensions for scheduling and HTTP calls (idempotent)
create schema if not exists extensions;
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Helper to check admin role (idempotent)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role = any(array['admin'::app_role, 'super_admin'::app_role])
  );
$$;

-- Create function to enable daily schedule for process-monthly-billing
create or replace function public.enable_process_monthly_billing(cron_expr text default '0 1 * * *')
returns boolean
language plpgsql
security definer
set search_path = 'public','extensions'
as $$
declare
  v_url text := 'https://jyqbgqududwxhypyrkrb.supabase.co/functions/v1/process-monthly-billing';
  v_headers text := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5cWJncXVkdWR3eGh5cHlya3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzg4NjIsImV4cCI6MjA2OTM1NDg2Mn0.apfLNtDOlq33kaHCIrTJDIvTJYQDpk5JrP5Pq7B-BL0"}';
  cmd text;
begin
  if not public.is_admin() then
    raise exception 'Only admins can manage billing schedule';
  end if;

  -- Unschedule existing job if any
  perform 1 from cron.job where jobname = 'process-monthly-billing-daily';
  if found then
    perform cron.unschedule('process-monthly-billing-daily');
  end if;

  cmd := format(
    'select net.http_post(url:=%L, headers:=%L::jsonb, body:=%L::jsonb);',
    v_url,
    v_headers,
    '{"force": false}'
  );

  perform cron.schedule('process-monthly-billing-daily', cron_expr, cmd);
  return true;
end;
$$;

-- Create function to disable schedule
create or replace function public.disable_process_monthly_billing()
returns boolean
language plpgsql
security definer
set search_path = 'public','extensions'
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can manage billing schedule';
  end if;

  perform cron.unschedule('process-monthly-billing-daily');
  return true;
end;
$$;

-- Create function to check current schedule status
create or replace function public.get_process_monthly_billing_status()
returns table(jobname text, schedule text, active boolean)
language sql
security definer
set search_path = 'public','extensions'
as $$
  select jobname, schedule, active
  from cron.job
  where jobname = 'process-monthly-billing-daily';
$$;