-- ============================================================
--  ContaFácil · Migración 0003 — Glosario Interactivo
-- ============================================================

-- 1) TABLA DE FEEDBACK DEL GLOSARIO ---------------------------
-- Guarda los votos de los usuarios sobre la claridad de cada término.
create table if not exists public.glossary_feedback (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles (id) on delete cascade,
  term_key    text        not null,
  is_helpful  boolean     not null,
  created_at  timestamptz not null default now(),
  constraint unique_user_term_feedback unique (user_id, term_key)
);

comment on table public.glossary_feedback is 'Votos de utilidad (útil/confuso) de los usuarios para cada término del glosario.';

-- Activar Row Level Security (RLS)
alter table public.glossary_feedback enable row level security;

-- Políticas de RLS
create policy "Ver votos de glosario"
  on public.glossary_feedback for select
  to authenticated
  using ( true );

create policy "Crear mi propio voto"
  on public.glossary_feedback for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

create policy "Actualizar mi propio voto"
  on public.glossary_feedback for update
  to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );


-- 2) TABLA DE SUGERENCIAS DEL GLOSARIO ------------------------
-- Guarda los términos que los usuarios sugieren para explicar en el futuro.
create table if not exists public.glossary_suggestions (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles (id) on delete cascade,
  term_name   text        not null check (char_length(trim(term_name)) > 0),
  description text,
  created_at  timestamptz not null default now()
);

comment on table public.glossary_suggestions is 'Términos sugeridos por los usuarios para ser traducidos o explicados.';

-- Activar RLS
alter table public.glossary_suggestions enable row level security;

-- Políticas de RLS
create policy "Ver sugerencias de glosario"
  on public.glossary_suggestions for select
  to authenticated
  using ( true );

create policy "Crear mi sugerencia"
  on public.glossary_suggestions for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

create policy "Borrar mi sugerencia"
  on public.glossary_suggestions for delete
  to authenticated
  using ( (select auth.uid()) = user_id );
