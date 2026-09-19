-- ============================================================
-- Migration 0029: Three-State Question Classification,
-- Domain Performance RPC, and Level-Categories Join Table
-- ============================================================

-- 1. Add status column to student_answers ('correct' | 'incorrect' | 'unanswered')
alter table student_answers
  add column if not exists status text check (status in ('correct', 'incorrect', 'unanswered'));

-- Backfill existing rows based on current is_correct and answered state
update student_answers
set status = case
  when is_correct = true then 'correct'
  when is_correct = false and (
    (answer_data->>'choice_id') is not null
    or (answer_data->>'value') is not null
    or (answer_data->>'text') is not null
    or (answer_data->>'selected_choice_ids') is not null
  ) then 'incorrect'
  else 'unanswered'
end
where status is null;

-- Default status to 'unanswered' for future records
alter table student_answers
  alter column status set default 'unanswered';

-- Index for fast status aggregation
create index if not exists idx_student_answers_status on student_answers(attempt_id, status);

-- 2. Create level_categories join table for category-linked levels
create table if not exists level_categories (
  id uuid primary key default gen_random_uuid(),
  level_id uuid not null references levels(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (level_id, category_id)
);

create index if not exists idx_level_categories_level on level_categories(level_id);
create index if not exists idx_level_categories_category on level_categories(category_id);

alter table level_categories enable row level security;

-- Teachers/Admins can manage level_categories for their organization
create policy "Teachers can manage level categories" on level_categories for all
  using (
    exists (
      select 1 from levels l
      where l.id = level_categories.level_id
        and l.organization_id = (select organization_id from profiles where id = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from levels l
      where l.id = level_categories.level_id
        and l.organization_id = (select organization_id from profiles where id = auth.uid())
    )
  );

-- Public can view active level categories
create policy "Public can view active level categories" on level_categories for select
  using (
    exists (
      select 1 from levels l
      where l.id = level_categories.level_id
        and l.is_active = true
    )
  );

-- 3. Upgrade grade_attempt to enforce three-state classification and insert missing unanswered rows
create or replace function grade_attempt(
  p_attempt_id uuid,
  p_resume_token uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_answer record;
  v_missing record;
  v_assessment_id uuid;
  v_org_id uuid;
  v_first_module_attempt_id uuid;
begin
  if not verify_attempt_token(p_attempt_id, p_resume_token) then
    raise exception 'Invalid attempt or resume token.';
  end if;

  select assessment_id, organization_id into v_assessment_id, v_org_id
  from attempts where id = p_attempt_id;

  select id into v_first_module_attempt_id
  from module_attempts
  where attempt_id = p_attempt_id
  order by created_at asc
  limit 1;

  -- Insert explicit 'unanswered' records for any assessment question that was not answered/saved
  for v_missing in
    select mq.question_id, coalesce(ma.id, v_first_module_attempt_id) as target_module_attempt_id
    from modules m
    join module_questions mq on mq.module_id = m.id
    left join module_attempts ma on ma.module_id = m.id and ma.attempt_id = p_attempt_id
    where m.assessment_id = v_assessment_id
      and not exists (
        select 1 from student_answers sa
        where sa.attempt_id = p_attempt_id
          and sa.question_id = mq.question_id
      )
  loop
    if v_missing.target_module_attempt_id is not null then
      insert into student_answers (
        attempt_id,
        module_attempt_id,
        question_id,
        answer_data,
        is_correct,
        points_earned,
        status,
        time_spent_seconds
      ) values (
        p_attempt_id,
        v_missing.target_module_attempt_id,
        v_missing.question_id,
        '{"unanswered": true}'::jsonb,
        false,
        0,
        'unanswered',
        0
      )
      on conflict (module_attempt_id, question_id) do nothing;
    end if;
  end loop;

  -- Grade every answer in this attempt
  for v_answer in
    select sa.id, sa.question_id, sa.answer_data,
           coalesce(mq.points_override, q.points) as effective_points,
           at.code as answer_type_code
    from student_answers sa
    join module_attempts ma on ma.id = sa.module_attempt_id
    join module_questions mq on mq.module_id = ma.module_id and mq.question_id = sa.question_id
    join questions q on q.id = sa.question_id
    join answer_types at on at.id = q.answer_type_id
    where sa.attempt_id = p_attempt_id
  loop
    declare
      v_is_correct boolean := false;
      v_is_answered boolean := false;
      v_status text := 'unanswered';
    begin
      -- Check if answer is provided
      if v_answer.answer_data is not null and v_answer.answer_data <> '{}'::jsonb and coalesce((v_answer.answer_data->>'unanswered')::boolean, false) = false then
        if v_answer.answer_type_code = 'MCQ' then
          if (v_answer.answer_data->>'choice_id') is not null and trim(v_answer.answer_data->>'choice_id') <> '' then
            v_is_answered := true;
            select exists (
              select 1 from question_choices
              where question_id = v_answer.question_id
                and is_correct = true
                and id::text = v_answer.answer_data->>'choice_id'
            ) into v_is_correct;
          end if;

        elsif v_answer.answer_type_code = 'TRUE_FALSE' then
          if (v_answer.answer_data->>'value') is not null then
            v_is_answered := true;
            select exists (
              select 1 from question_correct_answers
              where question_id = v_answer.question_id
                and (answer_data->>'value')::boolean = (v_answer.answer_data->>'value')::boolean
            ) into v_is_correct;
          end if;

        elsif v_answer.answer_type_code = 'GRID_IN' then
          if (v_answer.answer_data->>'value') is not null and trim(v_answer.answer_data->>'value') <> '' then
            v_is_answered := true;
            select exists (
              select 1 from question_correct_answers qca
              where qca.question_id = v_answer.question_id
                and abs(
                  (qca.answer_data->>'value')::numeric - (v_answer.answer_data->>'value')::numeric
                ) <= coalesce((qca.answer_data->>'tolerance')::numeric, 0)
            ) into v_is_correct;
          end if;
        end if;
      end if;

      if not v_is_answered then
        v_status := 'unanswered';
        v_is_correct := false;
      elsif v_is_correct then
        v_status := 'correct';
      else
        v_status := 'incorrect';
      end if;

      update student_answers
      set is_correct = v_is_correct,
          points_earned = case when v_is_correct then v_answer.effective_points else 0 end,
          status = v_status,
          updated_at = now()
      where id = v_answer.id;
    end;
  end loop;

  update attempts
  set status = 'completed',
      completed_at = now()
  where id = p_attempt_id;

  -- Recompute aggregated scores & breakdowns
  perform calculate_attempt_results(p_attempt_id);
end;
$$;

-- 4. RPC function to get domain performance
create or replace function get_domain_performance(p_attempt_id uuid)
returns table (
  domain_id uuid,
  domain_name text,
  domain_type text,
  total bigint,
  correct bigint,
  unanswered bigint,
  accuracy_pct numeric,
  avg_time_sec numeric,
  classification text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    c.id as domain_id,
    c.name as domain_name,
    'category'::text as domain_type,
    count(sa.id) as total,
    count(case when sa.status = 'correct' or sa.is_correct = true then 1 end) as correct,
    count(case when sa.status = 'unanswered' then 1 end) as unanswered,
    coalesce(
      round((count(case when sa.status = 'correct' or sa.is_correct = true then 1 end)::numeric / nullif(count(sa.id), 0)) * 100, 1),
      0
    ) as accuracy_pct,
    coalesce(
      round(avg(coalesce(sa.time_spent_seconds, 0))::numeric, 1),
      0
    ) as avg_time_sec,
    case
      when coalesce(round((count(case when sa.status = 'correct' or sa.is_correct = true then 1 end)::numeric / nullif(count(sa.id), 0)) * 100, 1), 0) >= 75 then 'Strong'
      when coalesce(round((count(case when sa.status = 'correct' or sa.is_correct = true then 1 end)::numeric / nullif(count(sa.id), 0)) * 100, 1), 0) >= 50 then 'Moderate'
      else 'Weak'
    end as classification
  from student_answers sa
  join questions q on q.id = sa.question_id
  join categories c on c.id = q.category_id
  where sa.attempt_id = p_attempt_id
  group by c.id, c.name
  order by accuracy_pct desc;
end;
$$;

grant execute on function get_domain_performance(uuid) to anon, authenticated;
