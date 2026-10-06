-- Demo Educación Física: ejecutar solo en un proyecto Supabase elegido para esta app.
-- Este archivo no se ha aplicado a ninguna base de datos.
-- Las preguntas públicas incluyen respuestas: adecuado para la demo, no para un examen protegido.

create table if not exists public.courses (
  id text primary key,
  title text not null,
  description text not null default '',
  is_published boolean not null default false,
  sort_order integer not null default 0
);

create table if not exists public.topics (
  id text primary key,
  course_id text not null references public.courses(id) on delete cascade,
  title text not null,
  description text not null default '',
  audio_url text,
  is_published boolean not null default false,
  sort_order integer not null default 0
);

create table if not exists public.questions (
  id text primary key,
  topic_id text not null references public.topics(id) on delete cascade,
  prompt text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 6),
  correct_index integer not null check (correct_index >= 0),
  explanation text not null,
  option_explanations jsonb not null default '[]'::jsonb check (jsonb_typeof(option_explanations) = 'array'),
  source text not null,
  year integer check (year between 1900 and 2100),
  is_demo boolean not null default false,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  constraint correct_index_in_options check (correct_index < jsonb_array_length(options)),
  constraint explanations_match_options check (jsonb_array_length(option_explanations) = jsonb_array_length(options))
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.questions(id) on delete cascade,
  selected_index integer not null,
  is_correct boolean not null,
  mode text not null check (mode in ('practice', 'challenge', 'mock')),
  created_at timestamptz not null default now()
);

create index if not exists attempts_user_created_idx on public.attempts(user_id, created_at);
create index if not exists attempts_user_question_idx on public.attempts(user_id, question_id, created_at desc);

create table if not exists public.topic_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id text not null references public.topics(id) on delete cascade,
  answered_count integer not null default 0 check (answered_count >= 0),
  correct_count integer not null default 0 check (correct_count >= 0 and correct_count <= answered_count),
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

alter table public.courses enable row level security;
alter table public.topics enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;
alter table public.topic_progress enable row level security;

-- Revocar posibles permisos automáticos antiguos. SQL Editor conserva la administración.
revoke all on public.courses, public.topics, public.questions, public.attempts, public.topic_progress from anon, authenticated;
grant select on public.courses, public.topics, public.questions to anon, authenticated;
grant select on public.attempts, public.topic_progress to authenticated;

create policy "read published courses" on public.courses for select to anon, authenticated
using (is_published);
create policy "read published topics" on public.topics for select to anon, authenticated
using (is_published and exists (select 1 from public.courses c where c.id = course_id and c.is_published));
create policy "read published questions" on public.questions for select to anon, authenticated
using (is_published and exists (
  select 1 from public.topics t
  join public.courses c on c.id = t.course_id
  where t.id = topic_id and t.is_published and c.is_published
));
create policy "read own attempts" on public.attempts for select to authenticated
using ((select auth.uid()) = user_id);
create policy "read own progress" on public.topic_progress for select to authenticated
using ((select auth.uid()) = user_id);

-- La función privilegiada vive en un esquema no expuesto por Data API.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

-- Solo esta función registra respuestas: el cliente no puede escribir is_correct ni user_id.
create or replace function private.submit_answer_internal(
  p_question_id text,
  p_selected_index integer,
  p_mode text default 'practice'
)
returns table (is_correct boolean, correct_index integer, explanation text, option_explanations jsonb)
language plpgsql security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_question public.questions%rowtype;
  v_correct boolean;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesión para guardar el avance en línea.';
  end if;
  if p_mode not in ('practice', 'challenge', 'mock') then
    raise exception 'Modo no válido.';
  end if;
  select q.* into v_question from public.questions q
  join public.topics t on t.id = q.topic_id
  join public.courses c on c.id = t.course_id
  where q.id = p_question_id and q.is_published and t.is_published and c.is_published;
  if not found then
    raise exception 'Pregunta no disponible.';
  end if;
  if p_selected_index is null or p_selected_index < 0 or p_selected_index >= jsonb_array_length(v_question.options) then
    raise exception 'Alternativa fuera de rango.';
  end if;
  v_correct := p_selected_index = v_question.correct_index;
  insert into public.attempts (user_id, question_id, selected_index, is_correct, mode)
  values (v_user, p_question_id, p_selected_index, v_correct, p_mode);
  insert into public.topic_progress (user_id, topic_id, answered_count, correct_count)
  values (v_user, v_question.topic_id, 1, case when v_correct then 1 else 0 end)
  on conflict (user_id, topic_id) do update
    set answered_count = public.topic_progress.answered_count + 1,
        correct_count = public.topic_progress.correct_count + case when v_correct then 1 else 0 end,
        updated_at = now();
  return query select v_correct, v_question.correct_index, v_question.explanation, v_question.option_explanations;
end;
$$;

revoke all on function private.submit_answer_internal(text, integer, text) from public, anon;
grant execute on function private.submit_answer_internal(text, integer, text) to authenticated;

-- Punto de acceso sin privilegios elevados; llama a la implementación privada.
create or replace function public.submit_answer(
  p_question_id text,
  p_selected_index integer,
  p_mode text default 'practice'
)
returns table (is_correct boolean, correct_index integer, explanation text, option_explanations jsonb)
language sql security invoker
set search_path = ''
as $$
  select * from private.submit_answer_internal(p_question_id, p_selected_index, p_mode);
$$;

revoke all on function public.submit_answer(text, integer, text) from public, anon;
grant execute on function public.submit_answer(text, integer, text) to authenticated;
