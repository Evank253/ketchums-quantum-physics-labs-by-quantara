-- Public chat room + user feedback (widget + public board).
-- Designed to play nicely with the cold-compute thermal governor: writes are
-- rate-limited at the app layer and reads are paginated.

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  body text not null check (length(body) between 1 and 600),
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_created_idx on public.chat_messages (created_at desc);

grant select, insert on public.chat_messages to authenticated;
grant select on public.chat_messages to anon;
grant all on public.chat_messages to service_role;

alter table public.chat_messages enable row level security;

create policy "chat read all"
  on public.chat_messages for select
  to anon, authenticated
  using (true);

create policy "chat insert own"
  on public.chat_messages for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "chat delete own"
  on public.chat_messages for delete
  to authenticated
  using (auth.uid() = user_id);

-- Realtime
alter publication supabase_realtime add table public.chat_messages;

-- Feedback
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  display_name text,
  rating int check (rating between 1 and 5),
  category text check (category in ('bug','idea','praise','other')) default 'other',
  body text not null check (length(body) between 1 and 2000),
  is_public boolean not null default false,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists feedback_public_idx on public.feedback (is_public, is_approved, created_at desc);

grant select, insert on public.feedback to authenticated;
grant select, insert on public.feedback to anon;
grant all on public.feedback to service_role;

alter table public.feedback enable row level security;

-- Anyone (including anon) can submit feedback.
create policy "feedback submit any"
  on public.feedback for insert
  to anon, authenticated
  with check (
    -- can only set user_id to your own (or null if anon)
    (user_id is null) or (auth.uid() = user_id)
  );

-- Only approved + public entries are readable by anon/authenticated.
create policy "feedback read public approved"
  on public.feedback for select
  to anon, authenticated
  using (is_public = true and is_approved = true);

-- Users can read their own entries (even if pending).
create policy "feedback read own"
  on public.feedback for select
  to authenticated
  using (auth.uid() = user_id);

-- Admins can read everything (uses existing has_role).
create policy "feedback read admin"
  on public.feedback for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "feedback update admin"
  on public.feedback for update
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));