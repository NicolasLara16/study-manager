-- ============================================================
-- prisma/sql/001_constraints_rls.sql
-- Backend E1 (op-logica) — anexar à migration inicial do Prisma. NÃO EXECUTAR aqui.
--
-- Contém o que o Prisma não expressa:
--   A) CHECK constraints relativas (invariantes de sessão, progresso, metas)
--   B) Índice parcial de sessão ativa única por usuário
--   C) Índice parcial deduplicando meta semanal global (goal_id NULL)
--   D) RLS deny-by-default + policies por usuário (2ª camada p/ PostgREST/Storage;
--      as queries do Prisma são protegidas pelo userId obrigatório no repository — ver relatório §2)
--
-- Notas de execução:
-- - Requer o schema `auth` do Supabase (auth.uid()). Em banco local sem Supabase,
--   os blocos condicionais (§E e chamadas a auth.uid()) pulam/dependem de polyfill:
--   CREATE SCHEMA auth; e auth.uid() RETORNANDO NULL.
-- - Executar como a MESMA role/owner usada pelo Prisma (DATABASE_URL) para que
--   as tabelas e policies tenham owner coerente. O usuário do Prisma precisa BYPASSRLS
--   ou ser superuser (comportamento do RLS: owner não é automaticamente isento,
--   a menos que FORCE ROW LEVEL SECURITY seja usado — aqui não usamos FORCE).
-- ============================================================

--------------------------------------------------------------------
-- A) CHECK constraints
--------------------------------------------------------------------

-- user_settings: durações e metas positivas, ciclos plausíveis
ALTER TABLE "user_settings" ADD CONSTRAINT user_settings_positive_targets
  CHECK ("weekly_target_minutes" > 0
     AND ("daily_target_minutes" IS NULL OR "daily_target_minutes" > 0));

ALTER TABLE "user_settings" ADD CONSTRAINT user_settings_pomodoro_durations
  CHECK ("pomodoro_focus_sec" >= 60 AND "pomodoro_focus_sec" <= 7200
     AND "pomodoro_short_break_sec" >= 30 AND "pomodoro_short_break_sec" <= 1800
     AND "pomodoro_long_break_sec" >= 60 AND "pomodoro_long_break_sec" <= 3600
     AND "cycles_before_long_break" >= 1 AND "cycles_before_long_break" <= 12);

-- study_sessions: ordem temporal, sessão completa tem duração, sessão aberta não pode estar completa
ALTER TABLE "study_sessions" ADD CONSTRAINT study_sessions_ended_after_started
  CHECK ("ended_at" IS NULL OR "ended_at" >= "started_at");

ALTER TABLE "study_sessions" ADD CONSTRAINT study_sessions_completed_has_duration
  CHECK ("status" <> 'completed' OR "duration_sec" > 0);

ALTER TABLE "study_sessions" ADD CONSTRAINT study_sessions_open_matches_status
  CHECK (("ended_at" IS NULL) = ("status" IN ('in_progress', 'paused')));

ALTER TABLE "study_sessions" ADD CONSTRAINT study_sessions_time_tracking_nonnegative
  CHECK ("duration_sec" >= 0 AND "paused_sec" >= 0 AND "pomodoro_cycles" >= 0 AND "cycles_target" >= 1);

ALTER TABLE "session_breaks" ADD CONSTRAINT session_breaks_ended_after_started
  CHECK ("ended_at" IS NULL OR "ended_at" >= "started_at");

-- saved_materials: progresso 0..100; concluído ⇔ 100
ALTER TABLE "saved_materials" ADD CONSTRAINT saved_materials_progress_range
  CHECK ("progress" >= 0 AND "progress" <= 100);

ALTER TABLE "saved_materials" ADD CONSTRAINT saved_materials_done_means_full
  CHECK ("status" <> 'done' OR "progress" = 100);

-- planned_blocks: grade semanal válida
ALTER TABLE "planned_blocks" ADD CONSTRAINT planned_blocks_day_of_week_range
  CHECK ("day_of_week" BETWEEN 0 AND 6);

ALTER TABLE "planned_blocks" ADD CONSTRAINT planned_blocks_start_time_format
  CHECK ("start_time" ~ '^[0-9]{2}:[0-9]{2}$');

ALTER TABLE "planned_blocks" ADD CONSTRAINT planned_blocks_duration_range
  CHECK ("duration_min" >= 15 AND "duration_min" <= 240);

-- weekly / discipline weekly goals: metas positivas
ALTER TABLE "weekly_goals" ADD CONSTRAINT weekly_goals_target_positive
  CHECK ("target_minutes" > 0);

ALTER TABLE "discipline_weekly_goals" ADD CONSTRAINT discipline_weekly_goals_target_positive
  CHECK ("target_minutes" > 0);

-- goals: meta por objetivo positiva; cor em hex; arquivado tem timestamp
ALTER TABLE "goals" ADD CONSTRAINT goals_color_hex
  CHECK ("color" ~ '^#[0-9A-Fa-f]{6}$');

ALTER TABLE "goals" ADD CONSTRAINT goals_weekly_target_positive
  CHECK ("weekly_target_minutes" IS NULL OR "weekly_target_minutes" > 0);

ALTER TABLE "goals" ADD CONSTRAINT goals_archived_consistent
  CHECK (("status" = 'archived') = ("archived_at" IS NOT NULL));

-- materials: rating 0..5 e minutos positivos; dedupe exige externalId quando fonte externa
ALTER TABLE "materials" ADD CONSTRAINT materials_rating_range
  CHECK ("rating" IS NULL OR ("rating" >= 0 AND "rating" <= 5));

ALTER TABLE "materials" ADD CONSTRAINT materials_minutes_positive
  CHECK ("minutes" IS NULL OR "minutes" > 0);

--------------------------------------------------------------------
-- B) Sessão ativa única por usuário (partial unique index)
--------------------------------------------------------------------

-- No máximo uma sessão em andamento ou pausada por usuário.
-- Tentativa concorrente = violação de unicidade (service mapeia p/ AppError CONFLICT/409).
CREATE UNIQUE INDEX IF NOT EXISTS study_sessions_one_active_per_user
  ON "study_sessions" ("user_id")
  WHERE "status" IN ('in_progress', 'paused');

--------------------------------------------------------------------
-- C) Meta semanal global única quando goal_id é NULL
-- (o constraint de 3 colunas do Prisma tolera múltiplos NULLs em goal_id;
--  este índice parcial fecha o buraco para as metas globais do usuário)
--------------------------------------------------------------------

CREATE UNIQUE INDEX IF NOT EXISTS weekly_goals_one_global_per_user_week
  ON "weekly_goals" ("user_id", "week_start")
  WHERE "goal_id" IS NULL;

--------------------------------------------------------------------
-- D) Row Level Security (deny-by-default)
-- Camada de defesa em profundidade: protege PostgREST/anon key e o Storage.
-- As queries do Prisma usam conexão dedicada e aplicam userId no repository.
-- Requer auth.uid() do Supabase (ver §E para o condicional do schema auth).
--------------------------------------------------------------------

ALTER TABLE "profiles"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_settings"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "goals"                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "disciplines"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "topics"                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "weekly_goals"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "discipline_weekly_goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "planned_blocks"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "study_sessions"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "session_breaks"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saved_materials"         ENABLE ROW LEVEL SECURITY;

-- materiais é catálogo compartilhado: RLS não habilitado (leitura global; escrita via service_role).

-- policies simples para tabelas com user_id/id do próprio usuário
-- (também condicionais ao schema auth: CREATE POLICY referencia auth.uid(),
--  que não existe em Postgres puro — nesse caso as tabelas ficam com RLS
--  habilitado e sem policies = deny-by-default total para roles sem bypass,
--  o que é seguro; o Prisma usa conexão própria com o userId no repository)
DO $do$
DECLARE
  t text;
  has_auth_schema boolean :=
    EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth');
BEGIN
  IF NOT has_auth_schema THEN
    RAISE NOTICE '§D: schema auth ausente — policies RLS não criadas (deny-by-default total).';
  ELSE
    -- profiles: linha é do próprio usuário (id = auth.uid())
    EXECUTE $policy$
      CREATE POLICY profiles_self ON "profiles"
      FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid())
    $policy$;

    FOREACH t IN ARRAY ARRAY[
      'user_settings', 'goals', 'disciplines', 'topics', 'weekly_goals',
      'discipline_weekly_goals', 'planned_blocks', 'study_sessions', 'saved_materials'
    ] LOOP
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())',
        t || '_self', t
      );
    END LOOP;

    -- session_breaks: pertence ao usuário via study_sessions
    EXECUTE $policy$
      CREATE POLICY session_breaks_self ON "session_breaks"
      FOR ALL
      USING (EXISTS (SELECT 1 FROM "study_sessions" s WHERE s.id = "session_breaks"."session_id" AND s.user_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM "study_sessions" s WHERE s.id = "session_breaks"."session_id" AND s.user_id = auth.uid()))
    $policy$;
  END IF;
END
$do$;

--------------------------------------------------------------------
-- E) Vínculo com auth.users — FK em cascata + criação de perfil
-- Condicionais: sem o schema `auth` (banco local sem Supabase), o bloco
-- inteiro é pulado e o ensureProfile() (service) segue como fallback idempotente.
--------------------------------------------------------------------

DO $do$
DECLARE
  has_auth_schema boolean :=
    EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth');
BEGIN
  IF has_auth_schema THEN
    -- FK da conta: excluir o usuário no Supabase apaga o perfil e, em cascata,
    -- settings, objetivos, sessões, blocos e biblioteca (todos com ON DELETE CASCADE
    -- via userId no schema Prisma; Material.ownerId é SetNull e não perde registros).
    ALTER TABLE "profiles"
      DROP CONSTRAINT IF EXISTS "profiles_id_fkey";
    ALTER TABLE "profiles"
      ADD CONSTRAINT "profiles_id_fkey"
      FOREIGN KEY ("id") REFERENCES "auth"."users" ("id")
      ON DELETE CASCADE;

    -- Criação automática do perfil no primeiro signUp:
    -- nome do metadata do signUp (ex.: "Marina Costa") ou o prefixo do e-mail.
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = ''
    AS $fn$
    BEGIN
      INSERT INTO "public"."profiles" ("id", "name")
      VALUES (
        NEW."id",
        COALESCE(
          NEW."raw_user_meta_data" ->> 'name',
          split_part(NEW."email", '@', 1)
        )
      )
      ON CONFLICT ("id") DO NOTHING;
      RETURN NEW;
    END;
    $fn$;

    DROP TRIGGER IF EXISTS "on_auth_user_created" ON "auth"."users";
    CREATE TRIGGER "on_auth_user_created"
    AFTER INSERT ON "auth"."users"
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

    RAISE NOTICE '§E: FK profiles->auth.users e trigger de criação de perfil instalados.';
  ELSE
    RAISE NOTICE '§E: schema auth ausente — FK/trigger de perfil não criados (usar ensureProfile como fallback).';
  END IF;
END
$do$;
