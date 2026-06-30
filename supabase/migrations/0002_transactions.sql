-- ============================================================
--  ContaFácil · Migración 0002 — Transacciones financieras
-- ============================================================
--  Ejecuta este archivo completo en: Supabase Dashboard → SQL Editor.
-- ============================================================

-- 1) TABLA DE TRANSACCIONES ----------------------------------------------------
create table if not exists public.transactions (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  type        text        not null check (type in ('income', 'expense')), -- ingreso | egreso
  amount      numeric(12, 2) not null check (amount > 0),                  -- siempre positivo
  category    text,
  description text,
  occurred_at date        not null default current_date,                   -- fecha del movimiento
  created_at  timestamptz not null default now()
);

comment on table public.transactions is 'Movimientos financieros (ingresos/egresos) por usuario.';

-- Índice para las consultas por usuario y rango de fechas del dashboard.
create index if not exists transactions_user_date_idx
  on public.transactions (user_id, occurred_at);

-- 2) ROW LEVEL SECURITY --------------------------------------------------------
alter table public.transactions enable row level security;

create policy "Ver mis transacciones"
  on public.transactions
  for select
  using ( (select auth.uid()) = user_id );

create policy "Crear mis transacciones"
  on public.transactions
  for insert
  with check ( (select auth.uid()) = user_id );

create policy "Editar mis transacciones"
  on public.transactions
  for update
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

create policy "Borrar mis transacciones"
  on public.transactions
  for delete
  using ( (select auth.uid()) = user_id );

-- 3) FUNCIÓN DE DATOS SIMULADOS (mock data) -----------------------------------
--    Genera ingresos/egresos aleatorios de los últimos `months` meses para el
--    usuario indicado. Es SEGURA: si la llama un usuario vía RPC, RLS solo le
--    permite sembrar sus propias filas. Borra los datos previos del usuario
--    para que re-ejecutarla no duplique.
create or replace function public.seed_transactions(
  target_user uuid,
  months int default 6
)
returns int
language plpgsql
as $$
declare
  inserted int := 0;
  m int;
  i int;
  n int;
  income_categories  text[] := array['Ventas', 'Servicios', 'Otros ingresos'];
  expense_categories text[] := array['Renta', 'Insumos', 'Nómina', 'Servicios', 'Marketing', 'Transporte'];
begin
  delete from public.transactions where user_id = target_user;

  for m in 0..(months - 1) loop
    -- Ingresos del mes (entre 8 y 15)
    n := 8 + floor(random() * 8)::int;
    for i in 1..n loop
      insert into public.transactions (user_id, type, amount, category, description, occurred_at)
      values (
        target_user,
        'income',
        round((300000 + random() * 2200000)::numeric, 0),
        income_categories[1 + floor(random() * array_length(income_categories, 1))::int],
        'Ingreso simulado',
        (date_trunc('month', current_date)
          - (m || ' months')::interval
          + (floor(random() * 27) || ' days')::interval)::date
      );
      inserted := inserted + 1;
    end loop;

    -- Egresos del mes (entre 6 y 12)
    n := 6 + floor(random() * 7)::int;
    for i in 1..n loop
      insert into public.transactions (user_id, type, amount, category, description, occurred_at)
      values (
        target_user,
        'expense',
        round((50000 + random() * 1450000)::numeric, 0),
        expense_categories[1 + floor(random() * array_length(expense_categories, 1))::int],
        'Egreso simulado',
        (date_trunc('month', current_date)
          - (m || ' months')::interval
          + (floor(random() * 27) || ' days')::interval)::date
      );
      inserted := inserted + 1;
    end loop;
  end loop;

  return inserted;
end;
$$;

-- 4) EJECUTA EL SEED PARA TU USUARIO ------------------------------------------
--    Genera 6 meses de datos para tu cuenta (usa tu correo de registro):
--
--    select public.seed_transactions(
--      (select id from auth.users where email = 'tomasayalacoppola07@gmail.com')
--    );
--
--    (Quita el comentario de las 3 líneas de arriba y ejecútalas, o corre el
--     archivo completo: la sentencia de abajo lo hace automáticamente.)
select public.seed_transactions(
  (select id from auth.users where email = 'tomasayalacoppola07@gmail.com')
);
