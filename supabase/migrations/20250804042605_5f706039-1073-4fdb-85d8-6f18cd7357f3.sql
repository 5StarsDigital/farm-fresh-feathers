-- Enable pg_cron and pg_net extensions for scheduled tasks
SELECT cron.schedule(
  'acb-auto-topup-every-15-seconds',
  '*/15 * * * * *', -- every 15 seconds
  $$
  SELECT
    net.http_post(
        url:='https://jyqbgqududwxhypyrkrb.supabase.co/functions/v1/acb-auto-topup',
        headers:='{"Content-Type": "application/json"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);