-- Mi Cita: grupo familiar (pantallas 03 y 10 del prototipo del módulo 1).
-- Cada usuario registra a sus familiares para agendarles citas eligiéndolos de una lista,
-- en vez de escribir su nombre cada vez (reconocimiento antes que memoria, heurística 6).

create table public.familiares (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre text not null check (char_length(trim(nombre)) between 3 and 80),
  parentesco text not null check (parentesco in ('Hijo', 'Hija', 'Padre', 'Madre', 'Pareja', 'Hermano', 'Hermana', 'Otro')),
  fecha_nacimiento date check (fecha_nacimiento <= current_date),
  creado_en timestamptz not null default now()
);
create index familiares_user_idx on public.familiares (user_id);

-- La cita puede quedar asociada a un familiar. Si el familiar se borra, la cita se conserva
-- (el nombre ya quedó guardado en "paciente") y solo se pierde el enlace.
alter table public.citas
  add column familiar_id bigint references public.familiares (id) on delete set null;
create index citas_familiar_idx on public.citas (familiar_id);

-- Seguridad por fila: cada usuario ve y administra solo su propio grupo familiar
alter table public.familiares enable row level security;

create policy "Cada usuario ve sus familiares" on public.familiares
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Cada usuario agrega sus familiares" on public.familiares
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Cada usuario edita sus familiares" on public.familiares
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "Cada usuario quita sus familiares" on public.familiares
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Una cita solo puede asociarse a un familiar del mismo usuario.
-- Se reemplaza la política de creación de citas para exigirlo.
drop policy "Cada usuario crea sus citas" on public.citas;
create policy "Cada usuario crea sus citas" on public.citas
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      familiar_id is null
      or exists (
        select 1 from public.familiares f
        where f.id = familiar_id and f.user_id = (select auth.uid())
      )
    )
  );

-- Lo mismo al actualizar (por ejemplo, al cancelar): no se puede apuntar la cita a un familiar ajeno
drop policy "Cada usuario cancela sus citas" on public.citas;
create policy "Cada usuario cancela sus citas" on public.citas
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      familiar_id is null
      or exists (
        select 1 from public.familiares f
        where f.id = familiar_id and f.user_id = (select auth.uid())
      )
    )
  );
