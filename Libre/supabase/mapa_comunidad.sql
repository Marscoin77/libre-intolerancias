-- ============================================================================
-- Libre · Mapa de la comunidad (restaurantes) — esquema v1
-- ----------------------------------------------------------------------------
-- Aplica este script en Supabase → SQL Editor (una sola vez). Es idempotente:
-- se puede volver a ejecutar sin romper nada (usa IF NOT EXISTS / OR REPLACE).
--
-- ANTES de ejecutar, activa el login anónimo:
--   Supabase → Authentication → Sign In / Providers → "Anonymous sign-ins" = ON
-- (así cada móvil recibe un usuario en auth.users sin pedir email; si más
--  adelante enlaza email/Google, conserva el mismo id y no hay que migrar nada).
--
-- La app escribe con la clave PUBLISHABLE (anon) + el token del usuario anónimo.
-- Todo pasa por RLS: cada quien solo puede tocar lo suyo. La lectura es pública.
-- ============================================================================

create extension if not exists pgcrypto;  -- para gen_random_uuid()

-- ----------------------------------------------------------------------------
-- Perfil público: el apodo que se muestra junto a las aportaciones.
-- Un registro por usuario (anónimo o real).
-- ----------------------------------------------------------------------------
create table if not exists public.perfiles_publicos (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  apodo      text not null check (char_length(apodo) between 2 and 24),
  creado_en  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Restaurantes aportados por la comunidad.
-- ----------------------------------------------------------------------------
create table if not exists public.restaurantes (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null check (char_length(nombre) between 2 and 80),
  direccion   text check (char_length(direccion) <= 160),
  ciudad      text check (char_length(ciudad) <= 80),
  lat         double precision not null check (lat between -90 and 90),
  lon         double precision not null check (lon between -180 and 180),
  tipo_cocina text check (char_length(tipo_cocina) <= 40),
  telefono    text check (char_length(telefono) <= 30),
  sitio_web   text check (char_length(sitio_web) <= 200),
  -- 'activo' = visible; 'oculto' = retirado por moderación o por su autor.
  estado      text not null default 'activo' check (estado in ('activo','oculto')),
  creado_por  uuid not null references auth.users(id) on delete cascade,
  creado_en   timestamptz not null default now()
);
-- Índices pensados para cargar por zona visible del mapa (bounds) y filtrar activos.
create index if not exists restaurantes_lat_lon_idx on public.restaurantes (lat, lon);
create index if not exists restaurantes_estado_idx  on public.restaurantes (estado);

-- ----------------------------------------------------------------------------
-- Valoraciones: una por usuario y restaurante (se puede editar / sobrescribir).
-- 'intolerancias_ok' guarda los MISMOS ids que la app (gluten, lactosa, huevo…):
--   son las intolerancias que ese usuario dice que el sitio cubre bien.
-- 'comentario' queda reservado para una fase posterior; en v1 va NULL.
-- ----------------------------------------------------------------------------
create table if not exists public.valoraciones (
  id               uuid primary key default gen_random_uuid(),
  restaurante_id   uuid not null references public.restaurantes(id) on delete cascade,
  usuario_id       uuid not null references auth.users(id) on delete cascade,
  estrellas        smallint not null check (estrellas between 1 and 5),
  intolerancias_ok text[] not null default '{}',
  comentario       text check (char_length(comentario) <= 500),
  creado_en        timestamptz not null default now(),
  actualizado_en   timestamptz not null default now(),
  unique (restaurante_id, usuario_id)
);
create index if not exists valoraciones_restaurante_idx on public.valoraciones (restaurante_id);

-- ----------------------------------------------------------------------------
-- Reportes para moderación. Solo se insertan desde la app; nadie los lee con la
-- clave pública (los revisas tú desde el panel con la clave service_role).
-- ----------------------------------------------------------------------------
create table if not exists public.reportes (
  id          uuid primary key default gen_random_uuid(),
  objeto_tipo text not null check (objeto_tipo in ('restaurante','valoracion')),
  objeto_id   uuid not null,
  usuario_id  uuid not null references auth.users(id) on delete cascade,
  motivo      text check (char_length(motivo) <= 300),
  creado_en   timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Vista de resumen para el mapa y el listado: media de estrellas y nº de
-- valoraciones ya agregados, para no calcularlo en el móvil.
-- security_invoker = on  →  respeta las políticas RLS de quien consulta.
-- ----------------------------------------------------------------------------
create or replace view public.restaurantes_resumen
with (security_invoker = on) as
select
  r.id, r.nombre, r.direccion, r.ciudad, r.lat, r.lon,
  r.tipo_cocina, r.telefono, r.sitio_web, r.creado_por, r.creado_en,
  coalesce(round(avg(v.estrellas)::numeric, 1), 0)::float as media_estrellas,
  count(v.id) as num_valoraciones
from public.restaurantes r
left join public.valoraciones v on v.restaurante_id = r.id
where r.estado = 'activo'
group by r.id;

-- ============================================================================
-- RLS: lectura pública, escritura solo de lo propio.
-- ============================================================================
alter table public.perfiles_publicos enable row level security;
alter table public.restaurantes     enable row level security;
alter table public.valoraciones     enable row level security;
alter table public.reportes         enable row level security;

-- perfiles_publicos ----------------------------------------------------------
drop policy if exists "perfiles lectura publica" on public.perfiles_publicos;
create policy "perfiles lectura publica" on public.perfiles_publicos
  for select using (true);

drop policy if exists "perfiles inserta propio" on public.perfiles_publicos;
create policy "perfiles inserta propio" on public.perfiles_publicos
  for insert with check (auth.uid() = usuario_id);

drop policy if exists "perfiles edita propio" on public.perfiles_publicos;
create policy "perfiles edita propio" on public.perfiles_publicos
  for update using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

-- restaurantes ---------------------------------------------------------------
drop policy if exists "restaurantes lectura publica" on public.restaurantes;
create policy "restaurantes lectura publica" on public.restaurantes
  for select using (estado = 'activo');

drop policy if exists "restaurantes inserta autenticado" on public.restaurantes;
create policy "restaurantes inserta autenticado" on public.restaurantes
  for insert with check (auth.uid() = creado_por);

drop policy if exists "restaurantes edita propio" on public.restaurantes;
create policy "restaurantes edita propio" on public.restaurantes
  for update using (auth.uid() = creado_por) with check (auth.uid() = creado_por);

drop policy if exists "restaurantes borra propio" on public.restaurantes;
create policy "restaurantes borra propio" on public.restaurantes
  for delete using (auth.uid() = creado_por);

-- valoraciones ---------------------------------------------------------------
drop policy if exists "valoraciones lectura publica" on public.valoraciones;
create policy "valoraciones lectura publica" on public.valoraciones
  for select using (true);

drop policy if exists "valoraciones inserta propia" on public.valoraciones;
create policy "valoraciones inserta propia" on public.valoraciones
  for insert with check (auth.uid() = usuario_id);

drop policy if exists "valoraciones edita propia" on public.valoraciones;
create policy "valoraciones edita propia" on public.valoraciones
  for update using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

drop policy if exists "valoraciones borra propia" on public.valoraciones;
create policy "valoraciones borra propia" on public.valoraciones
  for delete using (auth.uid() = usuario_id);

-- reportes -------------------------------------------------------------------
-- Solo INSERT (con la clave pública). Sin política de SELECT => nadie los lee
-- salvo la clave service_role, que ignora RLS. Así se revisan desde el panel.
drop policy if exists "reportes inserta autenticado" on public.reportes;
create policy "reportes inserta autenticado" on public.reportes
  for insert with check (auth.uid() = usuario_id);

-- ============================================================================
-- Listo. Recuerda: Authentication → Anonymous sign-ins = ON.
-- ============================================================================
