-- Esquema para Supabase Postgres.
-- Pégalo y ejecútalo en Supabase → SQL Editor. Es idempotente: se puede ejecutar varias veces.

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table if not exists public.submissions (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  name                text not null,
  age                 smallint not null,
  mood                smallint not null,
  emotions            text[] not null,
  duration            text not null,
  impact              smallint not null,
  sleep               text not null,
  appetite            text not null,
  self_harm_thoughts  text not null,
  priority            text not null,
  email               text not null,
  phone               text,
  best_time           text not null,
  consent             boolean not null,
  status              text not null default 'nuevo',
  notes               text,
  constraint submissions_age_check      check (age between 10 and 100),
  constraint submissions_mood_check     check (mood between 1 and 5),
  constraint submissions_impact_check   check (impact between 0 and 10),
  constraint submissions_emotions_check check (cardinality(emotions) >= 1),
  constraint submissions_self_harm_check
    check (self_harm_thoughts in ('no', 'a_veces', 'con_frecuencia')),
  constraint submissions_priority_check check (priority in ('alta', 'normal')),
  constraint submissions_status_check   check (status in ('nuevo', 'contactado', 'cerrado')),
  constraint submissions_consent_check  check (consent = true)
);

create index if not exists submissions_created_at_idx on public.submissions (created_at desc);
create index if not exists submissions_status_idx     on public.submissions (status);
create index if not exists submissions_priority_idx   on public.submissions (priority);

create table if not exists public.roulette_images (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  image_url     text not null,
  storage_path  text not null,
  active        boolean not null default true
);

create table if not exists public.allies (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null,
  logo_url      text not null,
  storage_path  text not null,
  website_url   text not null,
  position      integer not null default 0,
  active        boolean not null default true,
  constraint allies_website_url_check check (website_url ~* '^https?://')
);

create index if not exists allies_position_idx on public.allies (position);

create table if not exists public.volunteers (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  first_name    text not null,
  last_name     text not null,
  career        text not null,
  semester      text,
  email         text not null,
  phone         text not null,
  help_areas    text[] not null,
  availability  text not null,
  message       text,
  consent       boolean not null,
  status        text not null default 'nuevo',
  notes         text,
  constraint volunteers_help_areas_check
    check (
      cardinality(help_areas) >= 1
      and help_areas <@ array[
        'atencion_psicologica', 'escucha_acompanamiento', 'difusion_redes', 'eventos',
        'logistica_admin', 'diseno_comunicacion', 'tecnologia', 'donaciones', 'otra'
      ]
    ),
  constraint volunteers_availability_check
    check (availability in ('pocas_horas', 'semanal', 'medio_tiempo', 'tiempo_completo')),
  constraint volunteers_status_check
    check (status in ('nuevo', 'contactado', 'activo', 'descartado')),
  constraint volunteers_message_check   check (message is null or char_length(message) <= 500),
  constraint volunteers_consent_check   check (consent = true)
);

create index if not exists volunteers_created_at_idx on public.volunteers (created_at desc);
create index if not exists volunteers_status_idx     on public.volunteers (status);

-- Administradores del panel. password_hash guarda un hash bcrypt, nunca la contraseña.
create table if not exists public.admins (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  name           text not null,
  email          text not null,
  password_hash  text not null,
  role           text not null default 'admin',
  active         boolean not null default true,
  last_login_at  timestamptz,
  constraint admins_email_key         unique (email),
  constraint admins_email_lower_check check (email = lower(email)),
  constraint admins_role_check        check (role in ('superadmin', 'admin'))
);

-- ---------------------------------------------------------------------------
-- Seguridad: RLS activado y SIN políticas públicas.
-- Solo el backend (conexión directa con el rol postgres / service key) accede a los datos.
-- ---------------------------------------------------------------------------

alter table public.submissions     enable row level security;
alter table public.roulette_images enable row level security;
alter table public.allies          enable row level security;
alter table public.volunteers      enable row level security;
alter table public.admins          enable row level security;

-- Refuerzo: quita permisos a los roles públicos de la API de Supabase (si existen).
do $$
declare
  role_name text;
begin
  foreach role_name in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = role_name) then
      execute format(
        'revoke all on table public.submissions, public.roulette_images, public.allies, public.volunteers, public.admins from %I',
        role_name
      );
    end if;
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Storage: buckets públicos de lectura (la escritura solo la hace el backend con la service key)
-- ---------------------------------------------------------------------------

do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values
      ('roulette', 'roulette', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp']),
      ('allies', 'allies', true, 2097152,
        array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])
    on conflict (id) do update
      set public = excluded.public,
          file_size_limit = excluded.file_size_limit,
          allowed_mime_types = excluded.allowed_mime_types;
  end if;
end
$$;
