-- Create function to enable cron job for checking insufficient balance
CREATE OR REPLACE FUNCTION public.enable_insufficient_balance_check(cron_expr text DEFAULT '0 18 28-31 * *'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_url text := 'https://jyqbgqududwxhypyrkrb.supabase.co/functions/v1/check-insufficient-balance';
  v_headers text := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5cWJncXVkdWR3eGh5cHlya3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3Nzg4NjIsImV4cCI6MjA2OTM1NDg2Mn0.apfLNtDOlq33kaHCIrTJDIvTJYQDpk5JrP5Pq7B-BL0"}';
  cmd text;
begin
  if not public.is_admin() then
    raise exception 'Only admins can manage balance check schedule';
  end if;

  -- Unschedule existing job if any
  perform 1 from cron.job where jobname = 'check-insufficient-balance-monthly';
  if found then
    perform cron.unschedule('check-insufficient-balance-monthly');
  end if;

  cmd := format(
    'select net.http_post(url:=%L, headers:=%L::jsonb, body:=%L::jsonb);',
    v_url,
    v_headers,
    '{"force": false}'
  );

  -- Schedule to run at 6PM on 28th, 29th, 30th, 31st of each month
  perform cron.schedule('check-insufficient-balance-monthly', cron_expr, cmd);
  return true;
end;
$function$;

-- Create function to disable the cron job
CREATE OR REPLACE FUNCTION public.disable_insufficient_balance_check()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
begin
  if not public.is_admin() then
    raise exception 'Only admins can manage balance check schedule';
  end if;

  perform cron.unschedule('check-insufficient-balance-monthly');
  return true;
end;
$function$;

-- Create function to get the status of insufficient balance check
CREATE OR REPLACE FUNCTION public.get_insufficient_balance_check_status()
 RETURNS TABLE(jobname text, schedule text, active boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
  select jobname, schedule, active
  from cron.job
  where jobname = 'check-insufficient-balance-monthly';
$function$;