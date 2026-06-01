-- ============================================================
--  ContaFácil · Migración 0001 — Perfiles de microempresario
-- ============================================================
--  Ejecuta este archivo completo en: Supabase Dashboard → SQL Editor.
-- ============================================================

-- 1) TABLA DE PERFILES ---------------------------------------------------------
--    La PK es el mismo id del usuario en auth.users: relación 1:1 y borrado
--    en cascada si se elimina la cuenta. Así nunca quedan perfiles huérfanos.
create table if not exists public.profiles (
  id            uuid        primary key references auth.users (id) on delete cascade,
  business_name text,                                   -- Nombre del negocio
  full_name     text,                                   -- Nombre del responsable
  phone         text,                                   -- Teléfono de contacto
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is 'Perfil del microempresario (1:1 con auth.users).';

-- 2) ROW LEVEL SECURITY --------------------------------------------------------
--    Al activar RLS, por defecto NADIE puede leer ni escribir filas. Solo lo
--    permitido explícitamente por una política pasa. Es la base del aislamiento
--    de datos entre usuarios.
alter table public.profiles enable row level security;

--    Nota de rendimiento: envolver auth.uid() en (select ...) hace que Postgres
--    lo evalúe UNA vez por consulta (initPlan), no una vez por fila.

-- SELECT: cada usuario solo ve su propio perfil.
create policy "Los usuarios ven su propio perfil"
  on public.profiles
  for select
  using ( (select auth.uid()) = id );

-- UPDATE: cada usuario solo edita su propio perfil.
--   using       -> qué filas puede tocar (las suyas)
--   with check  -> que tras editar la fila siga siendo suya (no puede robar otra)
create policy "Los usuarios editan su propio perfil"
  on public.profiles
  for update
  using ( (select auth.uid()) = id )
  with check ( (select auth.uid()) = id );

-- INSERT: respaldo por si se crea el perfil desde el cliente.
--   (Normalmente lo crea el trigger de abajo, que corre como SECURITY DEFINER.)
create policy "Los usuarios crean su propio perfil"
  on public.profiles
  for insert
  with check ( (select auth.uid()) = id );

-- 3) TRIGGER: crear perfil automáticamente al registrarse --------------------
--    SECURITY DEFINER -> la función corre con permisos del dueño (postgres),
--    así puede insertar saltándose RLS en el momento del alta.
--    set search_path = '' -> blindaje de seguridad: obliga a calificar los
--    nombres (public.profiles) y evita secuestro del search_path.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) TRIGGER: mantener updated_at actualizado en cada UPDATE -----------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 5) BACKFILL: crear perfiles para usuarios que ya existían ------------------
--    (Por si registraste algún usuario de prueba antes de instalar el trigger.)
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;
