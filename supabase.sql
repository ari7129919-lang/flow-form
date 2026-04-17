-- Flow Form schema
-- Run this in Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.ff_forms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  welcome_title text not null default 'שלום! 👋',
  welcome_subtitle text not null default 'בוא נתחיל בכמה שאלות קצרות.',
  completion_title text not null default 'תודה! הטופס התקבל',
  completion_subtitle text not null default 'אפשר לסגור את החלון.',
  chat_copy jsonb not null default '{"introTitle":"שלום! 👋","introSubtitle":"כדי להתחיל נבקש כמה פרטים ואז נשלח קוד אימות למייל.","askName":"מה שמך? (לא חובה)","askEmail":"מה המייל שנשלח אליו קוד אימות?","askPhone":"מה מספר הטלפון שלך?","otpPrompt":"שלחתי קוד אימות למייל — הזן אותו כאן:"}'::jsonb,
  nudges jsonb not null default '[]'::jsonb,
  nudge_question_order int null,
  nudge_text text null,
  created_at timestamptz not null default now()
);

alter table public.ff_forms
  add column if not exists completion_title text not null default 'תודה! הטופס התקבל';

alter table public.ff_forms
  add column if not exists completion_subtitle text not null default 'אפשר לסגור את החלון.';

alter table public.ff_forms
  add column if not exists nudges jsonb not null default '[]'::jsonb;

alter table public.ff_forms
  add column if not exists chat_copy jsonb not null default '{"introTitle":"שלום! 👋","introSubtitle":"כדי להתחיל נבקש כמה פרטים ואז נשלח קוד אימות למייל.","askName":"מה שמך? (לא חובה)","askEmail":"מה המייל שנשלח אליו קוד אימות?","askPhone":"מה מספר הטלפון שלך?","otpPrompt":"שלחתי קוד אימות למייל — הזן אותו כאן:"}'::jsonb;

create table if not exists public.ff_questions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.ff_forms(id) on delete cascade,
  "order" int not null,
  text text not null,
  required boolean not null default true,
  allow_other boolean not null default true,
  created_at timestamptz not null default now(),
  unique(form_id, "order")
);

create table if not exists public.ff_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.ff_sessions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.ff_forms(id) on delete cascade,
  name text null,
  email text not null,
  phone text null,
  status text not null default 'started',
  otp_hash text null,
  otp_expires_at timestamptz null,
  verified_at timestamptz null,
  current_question_order int not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz null
);

alter table public.ff_sessions
  add column if not exists treatment_status text not null default 'untreated';

alter table public.ff_sessions
  add column if not exists treatment_note text null;

alter table public.ff_sessions
  add column if not exists treated_at timestamptz null;

alter table public.ff_sessions
  add column if not exists admin_viewed_at timestamptz null;

alter table public.ff_sessions
  add column if not exists admin_view_count int not null default 0;

create index if not exists ff_sessions_form_id_idx on public.ff_sessions(form_id);
create index if not exists ff_sessions_email_idx on public.ff_sessions(email);
create index if not exists ff_sessions_phone_idx on public.ff_sessions(phone);

create table if not exists public.ff_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ff_sessions(id) on delete cascade,
  question_id uuid not null references public.ff_questions(id) on delete cascade,
  answer text not null,
  other_text text null,
  created_at timestamptz not null default now(),
  unique(session_id, question_id)
);

create index if not exists ff_answers_session_id_idx on public.ff_answers(session_id);

create table if not exists public.ff_events (
  id bigserial primary key,
  session_id uuid not null references public.ff_sessions(id) on delete cascade,
  type text not null,
  question_order int null,
  meta jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists ff_events_session_id_idx on public.ff_events(session_id);
create index if not exists ff_events_type_idx on public.ff_events(type);

alter table public.ff_forms enable row level security;
alter table public.ff_questions enable row level security;
alter table public.ff_settings enable row level security;
alter table public.ff_sessions enable row level security;
alter table public.ff_answers enable row level security;
alter table public.ff_events enable row level security;

-- Seed: demo form and 30 sample questions
insert into public.ff_forms (slug, name, nudge_question_order, nudge_text)
values ('demo', 'טופס דמו', 25, 'יפה מאוד! עוד מעט וסיימת 🙌')
on conflict (slug) do nothing;

with f as (
  select id from public.ff_forms where slug = 'demo'
)
insert into public.ff_questions (form_id, "order", text)
select f.id, q.ord, q.txt
from f
cross join (
  values
    (1, 'שאלה 1'), (2, 'שאלה 2'), (3, 'שאלה 3'), (4, 'שאלה 4'), (5, 'שאלה 5'),
    (6, 'שאלה 6'), (7, 'שאלה 7'), (8, 'שאלה 8'), (9, 'שאלה 9'), (10, 'שאלה 10'),
    (11, 'שאלה 11'), (12, 'שאלה 12'), (13, 'שאלה 13'), (14, 'שאלה 14'), (15, 'שאלה 15'),
    (16, 'שאלה 16'), (17, 'שאלה 17'), (18, 'שאלה 18'), (19, 'שאלה 19'), (20, 'שאלה 20'),
    (21, 'שאלה 21'), (22, 'שאלה 22'), (23, 'שאלה 23'), (24, 'שאלה 24'), (25, 'שאלה 25'),
    (26, 'שאלה 26'), (27, 'שאלה 27'), (28, 'שאלה 28'), (29, 'שאלה 29'), (30, 'שאלה 30')
) as q(ord, txt)
on conflict (form_id, "order") do nothing;

insert into public.ff_settings (key, value)
values ('admin_receiver_email', '')
on conflict (key) do nothing;
