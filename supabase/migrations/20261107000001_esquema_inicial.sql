-- Mi Cita: esquema inicial de la base de datos (Supabase, PostgreSQL)
-- Tablas de catálogo (especialidades, sedes, agenda) y tabla de citas de cada usuario.
-- Todas las tablas tienen RLS (seguridad por fila) activada: sin una política que lo permita, nadie lee ni escribe.

-- 1. Especialidades médicas
create table public.especialidades (
  id smallint generated always as identity primary key,
  nombre text not null unique,
  descripcion text not null          -- frase corta en lenguaje del paciente (heurística 2 de Nielsen)
);

-- 2. Sedes de atención (datos inventados: Mi Cita no corresponde a ninguna EPS real)
create table public.sedes (
  id smallint generated always as identity primary key,
  nombre text not null unique,
  direccion text not null,
  ciudad text not null default 'Bogotá'
);

-- 3. Agenda: cada fila es un espacio de 30 minutos que un médico ofrece en una sede
create table public.agenda (
  id bigint generated always as identity primary key,
  especialidad_id smallint not null references public.especialidades (id),
  sede_id smallint not null references public.sedes (id),
  fecha_hora timestamptz not null,
  unique (especialidad_id, sede_id, fecha_hora)
);
create index agenda_busqueda_idx on public.agenda (especialidad_id, sede_id, fecha_hora);

-- 4. Citas: cada usuario solo ve y cambia las suyas
create table public.citas (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  agenda_id bigint not null references public.agenda (id),
  paciente text not null,             -- para quién es la cita (el usuario o un familiar)
  estado text not null default 'Confirmada' check (estado in ('Confirmada', 'Cancelada')),
  creada_en timestamptz not null default now()
);
create index citas_user_idx on public.citas (user_id);
create index citas_agenda_idx on public.citas (agenda_id);
-- Un espacio de agenda solo puede tener una cita confirmada (evita que dos personas tomen la misma hora)
create unique index citas_un_cupo_idx on public.citas (agenda_id) where estado = 'Confirmada';

-- Seguridad por fila (RLS)
alter table public.especialidades enable row level security;
alter table public.sedes enable row level security;
alter table public.agenda enable row level security;
alter table public.citas enable row level security;

-- Catálogos: solo lectura, y solo para usuarios que iniciaron sesión
create policy "Usuarios autenticados leen especialidades" on public.especialidades
  for select to authenticated using (true);
create policy "Usuarios autenticados leen sedes" on public.sedes
  for select to authenticated using (true);
create policy "Usuarios autenticados leen la agenda" on public.agenda
  for select to authenticated using (true);

-- Citas: cada usuario ve, crea y actualiza (cancela) solo las suyas. No hay política de borrado:
-- cancelar es cambiar el estado, así queda el historial.
create policy "Cada usuario ve sus citas" on public.citas
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Cada usuario crea sus citas" on public.citas
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Cada usuario cancela sus citas" on public.citas
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Horarios disponibles: devuelve los espacios futuros sin cita confirmada.
-- Es "security definer" porque necesita saber qué espacios están ocupados por citas de OTROS usuarios,
-- que las reglas RLS no le dejan ver al paciente. Solo devuelve id y hora, nunca datos de otras personas.
create function public.horarios_disponibles(p_especialidad smallint, p_sede smallint, p_dia date)
returns table (agenda_id bigint, fecha_hora timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select a.id, a.fecha_hora
  from public.agenda a
  where a.especialidad_id = p_especialidad
    and a.sede_id = p_sede
    and (a.fecha_hora at time zone 'America/Bogota')::date = p_dia
    and a.fecha_hora > now()
    and not exists (
      select 1 from public.citas c
      where c.agenda_id = a.id and c.estado = 'Confirmada'
    )
  order by a.fecha_hora;
$$;
revoke execute on function public.horarios_disponibles(smallint, smallint, date) from public, anon;
grant execute on function public.horarios_disponibles(smallint, smallint, date) to authenticated;
