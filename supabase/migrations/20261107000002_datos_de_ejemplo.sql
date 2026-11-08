-- Mi Cita: datos de ejemplo (inventados; no corresponden a ninguna EPS ni sede real)

insert into public.especialidades (nombre, descripcion) values
  ('Medicina general', 'Consulta para síntomas comunes, controles y remisiones'),
  ('Pediatría', 'Atención para niños y niñas desde el nacimiento hasta los 17 años'),
  ('Odontología', 'Revisión y tratamiento de dientes y encías'),
  ('Ginecología', 'Salud de la mujer, controles y planificación'),
  ('Medicina interna', 'Seguimiento de enfermedades crónicas en adultos'),
  ('Optometría', 'Examen de la vista y fórmula de lentes');

insert into public.sedes (nombre, direccion) values
  ('Sede Norte', 'Calle 140 # 15-20'),
  ('Sede Centro', 'Carrera 7 # 32-10'),
  ('Sede Sur', 'Avenida Primero de Mayo # 68-45');

-- Agenda: días hábiles (lunes a viernes) de los próximos 45 días, de 7:00 a. m. a 4:30 p. m.,
-- espacios de 30 minutos, hora de Colombia. Los festivos se filtran en la aplicación con la API Nager.Date.
insert into public.agenda (especialidad_id, sede_id, fecha_hora)
select e.id, s.id, (d::date + time '07:00' + n * interval '30 minutes') at time zone 'America/Bogota'
from public.especialidades e
cross join public.sedes s
cross join generate_series(current_date + 1, current_date + 45, interval '1 day') as d
cross join generate_series(0, 19) as n   -- 20 espacios: 7:00, 7:30, ..., 4:30 p. m.
where extract(isodow from d) between 1 and 5;
