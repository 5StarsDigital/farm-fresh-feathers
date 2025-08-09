-- Ensure notifications storage bucket exists and policies are set (idempotent)

-- Create bucket if missing
insert into storage.buckets (id, name, public)
values ('notifications','notifications', true)
on conflict (id) do nothing;

-- Public read policy
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Public read notifications'
  ) then
    create policy "Public read notifications"
    on storage.objects
    for select
    using (bucket_id = 'notifications');
  end if;
end$$;

-- Admin INSERT policy
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Admin insert notifications objects'
  ) then
    create policy "Admin insert notifications objects"
    on storage.objects
    for insert
    with check (bucket_id = 'notifications' and public.is_admin());
  end if;
end$$;

-- Admin UPDATE policy
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Admin update notifications objects'
  ) then
    create policy "Admin update notifications objects"
    on storage.objects
    for update
    using (bucket_id = 'notifications' and public.is_admin());
  end if;
end$$;

-- Admin DELETE policy
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'Admin delete notifications objects'
  ) then
    create policy "Admin delete notifications objects"
    on storage.objects
    for delete
    using (bucket_id = 'notifications' and public.is_admin());
  end if;
end$$;