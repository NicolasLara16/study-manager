# Fase 2 — Modelagem de dados e regras de negócio (op-logica, somente análise)

Fontes analisadas: `src/lib/mock-data.ts`, `src/lib/mock-stats.ts`, `study-workbench.tsx`, `planning-view.tsx`, `goals-view.tsx`, `library-view.tsx` + `saved-context.tsx`, `statistics-view.tsx`, `edital-view.tsx`, `settings-view.tsx` (e `dashboard/*` para métricas).

Sem alteração de código. Sem Prisma/migrations. Este documento é o contrato proposto para a próxima fase.

---

## 1. Enums

| Enum | Valores | Origem no mock |
|---|---|---|
| `GoalStatus` | `ativo` \| `arquivado` | `Goal.status` (mock-data) |
| `SessionMode` | `livre` \| `pomodoro` | `Mode` do workbench ("Cronômetro livre" / "Pomodoro") |
| `SessionStatus` | `in_progress` \| `paused` \| `completed` \| `cancelled` | mock usa `concluida/em-andamento/pausada/nao-iniciada` — ver §8.6 |
| `PlannedBlockStatus` | `pending` \| `in_progress` \| `completed` \| `missed` | estado implícito dos blocos planejados |
| `LibraryStatus` | `nao_iniciado` \| `em_andamento` \| `concluido` | `LibraryStatus` (mock-data) |
| `MaterialType` | `video` \| `article` \| `pdf` \| `course` | `Material.type` |
| `MaterialLevel` (`Level`) | `iniciante` \| `intermediario` \| `avancado` | `Material.level` |
| `MaterialLanguage` | `pt` \| `en` | `Material.language` ("Português"/"Inglês") |
| `BreakType` | `curta` \| `longa` | settings guarda `short`/`long`; workbench só usa "pausa" |
| `ThemeChoice` | `light` \| `dark` \| `system` | `theme-provider` |

Notas:
- `SessionMode` substitui as strings livres "Foco profundo"/"Revisão ativa"/`Pomodoro (2/4)` usadas em `mode` no mock. Sugestão: `mode` enum + campo opcional `techniqueLabel` (string livre) para etiquetas como "Revisão ativa".
- "Semana começa na segunda": fixar convenção `weekStartDay = 0` (0 = segunda) em todo o domínio (o mock de planejamento já usa 0..6 com Seg=0).
- Valores de enums em inglês-snake_case para o banco; labels pt-BR ficam na camada de UI/const `typeLabel`.

## 2. Entidades e campos

Convenção: todos os IDs são `cuid`/`uuid` string PK. Timestamps `createdAt/updatedAt`. Datas "de calendário" (weekStart, targetDate) em `Date` normalizado a meia-noite local do usuário (ver §5.5). Durações **sempre** em segundos inteiros (`durationSec`, `pausedSec`); minutos em contagens (blocos planejados: `durationMin` permitido, pois são valores de agenda, não medição — decisão: manter minutos para blocos, segundos para sessões).

### User
- `id`, `name`, `email` (unique), `imageUrl?`, timestamps.

### UserSettings (1:1 com User)
- `userId` FK unique cascade
- `weeklyTargetMinutes` int (mock: 10h → 600; UI edita em horas — converter na borda)
- `pomodoroFocusSec` int default 1500 (25 min) — mock guarda minutos {25}
- `pomodoroShortBreakSec` int default 300 (5 min)
- `pomodoroLongBreakSec` int default 900 (15 min) — hoje só existe no settings, não no workbench
- `pomodoroCyclesBeforeLongBreak` int default 4 (const `POMODORO_CYCLES` hard-coded no workbench)
- `timezone` string default `America/Sao_Paulo`
- `weekStartDay` int default 0 (segunda)
- `notifySessionReminders` bool default true (toggle "notificacoes-sessao")
- `timerSounds` bool default true (toggle "sons-cronometro")
- `theme` ThemeChoice default `system`
- `dailyTargetMinutes?` int (mock de Estatísticas exibe "meta diária: 2h 30min" — hoje não tem input; campo proposto)

### Goal (Objetivo)
- `userId` FK cascade; `title`; `description?`
- `status` GoalStatus default `ativo`
- `color` string `#RRGGBB` (mock por objetivo)
- `targetDate?` datetime (mock "Nov 2027"/"Mar 2026"; "Sem prazo" → null)
- `weeklyTargetMinutes?` int (dashboard: "Meta: 10h por semana" no objetivo ativo)
- `archivedAt?` datetime (setado quando `status = arquivado`)
- Derivadas **não persistidas**: `progress`, `disciplinesCount`, `materials` (mock os traz pré-computados)
- `disciplines` (relação) — mock aninha e pré-computa `percent/topics/materials` por disciplina

### Discipline
- `goalId` FK cascade; `userId` FK cascade (desnormalizado p/ busca global e rastreio)
- `name`; `position` int (ordenação estável); `archivedAt?` (soft-delete acompanha objetivo)
- Derivadas: contagens de tópicos/materiais, percentual de avanço
- unique `(goalId, name)` — o mesmo nome pode existir em objetivos diferentes

### Topic (Assunto)
- `disciplineId` FK cascade; `goalId`/`userId` desnormalizados cascade
- `name`; `concluded?` bool default false (mock não gerencia status de tópico; campo mínimo proposto)
- unique `(disciplineId, name)`

### WeeklyGoal (Meta semanal)
- `userId` FK cascade; `goalId?` FK set-null (meta do usuário global vs meta por objetivo)
- `weekStart` Date (primeira segunda da semana, meia-noite local); `targetMinutes` int
- `completedAt?` quando atinge 100%
- **unique `(userId, weekStart)`** — 1 meta por usuário/semana (por escopo: global ou por objetivo)

### DisciplineWeeklyGoal (metas por disciplina — aba Planejamento)
- `userId` FK cascade; `disciplineId` FK cascade; `weekStart` Date; `targetMinutes` int
- **unique `(userId, disciplineId, weekStart)`**

### StudySession
- `userId` FK cascade
- `goalId?` FK set-null (histórico deve sobreviver à exclusão do objetivo) — `statisticsHistory` mostra "Objetivo" na tabela
- `disciplineId?` FK set-null; `topicId?` FK set-null
- Snapshots para histórico: `disciplineNameSnap?`, `topicNameSnap?`, `goalTitleSnap?` (preenchidos ao finalizar; preserva relatórios mesmo após exclusão — ver §5.4)
- `plannedBlockId?` FK set-null (rastreia "planejado → realizado")
- `mode` SessionMode (`livre`|`pomodoro`)
- `status` SessionStatus: `in_progress` → `paused` → `completed` | `cancelled`
- `startedAt` datetime; `endedAt?` datetime
- `durationSec` int (tempo efetivo de FOCO, em segundos — ver §5.2); calculado ao finalizar
- `pausedSec` int (pausas manuais no modo livre; não conta como estudo)
- `pomodoroCycles` int default 0; `cyclesTarget` int default 4 (snapshot da configuração)
- `notes?` text (workbench coleta anotações; hoje não persiste)
- Regra estrutural: `endedAt == null ⟺ status ∈ {in_progress, paused}`; `durationSec > 0` quando `completed`; `endedAt ≥ startedAt`.

### SessionBreak (pausas do pomodoro)
- `sessionId` FK cascade; `type` BreakType; `startedAt`; `endedAt`; `durationSec` int
- No modo livre, pausas do usuário NÃO viram SessionBreak (ficam em `pausedSec`) — SessionBreak é só pomodoro.

### PlannedBlock (blocos semanais)
- `userId` FK cascade; `weekStart` Date (mesma semana do WeeklyGoal); `dayOfWeek` 0..6 (0=Seg)
- `startAt` Time (HH:mm) e `durationMin` int (mock "50 min"; "end" derivável)
- `disciplineId?`/`topicId?` FKs nullable (mock tem "Revisão geral" e "Simulado" sem disciplina cadastrada — ad-hoc)
- `subject?`, `topic?` strings para blocos ad-hoc (snapshot quando sem FK)
- `status` PlannedBlockStatus default `pending`
- Regra: sem sobreposição → validação de aplicação (mesma `userId+weekStart+dayOfWeek`, intervalo [startAt, startAt+durationMin[ sem interseção)

### Material (catálogo global — Explorar; sem userId)
- `id` slug público ("funcoes-quadraticas-khan"); `title`; `description`
- `type` MaterialType; `source`; `verified?` bool default false
- `minutes` int (fonte única de duração; `duration` string do mock é derivada — ver §8.4)
- `level` MaterialLevel; `language` MaterialLanguage
- `rating?` float 0..5 (mock guarda "4,8 de 5" string), `ratingCount?` int
- `url`; `format?` string (etiqueta derivável de `type` — candidato a remover)
- `subjects` — lista de tags: M2M simples `Tag(name unique)` × `MaterialTag`, ou `string[]` no Postgres
- `disciplineId?` FK para catálogo global de disciplinas (hoje `disciplinesCatalog` com `count` — derivável)

### SavedMaterial (biblioteca pessoal do usuário)
- `userId` FK cascade; `materialId` FK restrict
- `status` LibraryStatus default `nao_iniciado`
- `progress` int 0..100 (mock exibe %)
- `favorite` bool default false
- `savedAt`, `lastProgressAt?`, `completedAt?`
- **unique `(userId, materialId)`** (exigido na tarefa)
- Regra de consistência status↔progress: `nao_iniciado ⇔ progress=0`; `em_andamento ⇒ 0<progress<100`; `concluido ⇒ progress=100` (transições atualizam status automaticamente; favorito independe).

### Entidade extra detectada fora do escopo pedido (registrar para fase futura)
- `EtlUpload` (`userId`, `fileName`, `sizeBytes?`, `pages?`, `phase idle|uploading|processing|ready|error`, timestamps) + `EtlDiscipline`/`EtlTopic` (extrações retiradas de `mock-stats.ts`, hoje sem IDs) — necessária antes de ligar "Criar objetivo do edital" ao banco.

## 3. Relacionamentos e cardinalidades (onDelete)

| Relação | Cardinalidade | onDelete |
|---|---|---|
| User 1—1 UserSettings | 1:1 | Cascade |
| User 1—N Goal | 1:N | Cascade |
| Goal 1—N Discipline | 1:N | Cascade |
| Discipline 1—N Topic | 1:N | Cascade |
| User —N WeeklyGoal | 1:N | Cascade |
| User —N DisciplineWeeklyGoal | 1:N | Cascade |
| Discipline —N DisciplineWeeklyGoal | 1:N | Cascade |
| User —N StudySession | 1:N | Cascade |
| Goal —? StudySession (`goalId?`) | 0..1 : N | **SetNull** + snapshots |
| Discipline —? StudySession | 0..1 : N | SetNull + snapshots (`disciplineNameSnap`) |
| Topic —? StudySession | 0..1 : N | SetNull + snapshots |
| PlannedBlock —? StudySession | 0..1 : N | SetNull |
| StudySession 1—N SessionBreak | 1:N | Cascade |
| User —N PlannedBlock | 1:N | Cascade |
| Goal —? PlannedBlock | 0..1 : N | SetNull |
| Discipline —? PlannedBlock | 0..1 : N | SetNull + snapshot name |
| Material 1—N SavedMaterial | 1:N | **Restrict** (catálogo não pode apagar registros pessoais sem decisão de produto) |
| User —N SavedMaterial | 1:N | Cascade |

Direção geral: **dados de medição/histórico nunca são apagados em cascata** quando a causa é remoção de estrutura (objetivo/disciplina); usam SetNull + snapshot. Cascata é só do dono (User) para baixo.

## 4. Constraints e unicidades

- `User.email` unique.
- `UserSettings.userId` unique.
- `Discipline (goalId, name)` unique (mesmo nome em objetivos diferentes é permitido).
- `Topic (disciplineId, name)` unique.
- `WeeklyGoal (userId, weekStart)` unique (exigido na tarefa; se metas por objetivo: `(userId, goalId, weekStart)` unique + no máximo 1 com goalId null por semana).
- `DisciplineWeeklyGoal (userId, disciplineId, weekStart)` unique.
- `SavedMaterial (userId, materialId)` unique (exigido na tarefa).
- **Sessão ativa única por usuário**: partial unique index `StudySession (userId) WHERE status IN ('in_progress','paused')`.
- Checks: `SavedMaterial.progress BETWEEN 0 AND 100`; `Material.rating BETWEEN 0 AND 5`; `Material.minutes > 0`; `StudySession.endedAt >= startedAt`; `PlannedBlock.durationMin BETWEEN 20 AND 240` (ajustável).
- Fórmulas invariantes: `concluido ⇒ progress = 100`; `completed ⇒ durationSec > 0`;

## 5. Regras de negócio

### 5.1 Tempo e durações
- Persistência em **segundos inteiros**; string "1h 05min" só na exibição (função `formatDuration` única, hoje duplicada no workbench).
- Modo livre: tempo efetivo = tempo cronometrado − pausas manuais (`pausedSec`). "Pausa" não é estudo.
- Pomodoro: tempo efetivo = focos completos + foco corrente ao finalizar (o mock já faz isso: `completedFocusSeconds = cycles * focusSeconds + phaseSeconds`); pausas de pomodoro → `SessionBreak`, não contam.

### 5.2 Cronômetro/sessão ativa
- Máquina: `idle → in_progress → paused ⇄ → completed | cancelled`.
- Toda sessão ativa é única por usuário (§4). Novo "Iniciar" com sessão ativa → erro 409 + oferece retomar/cancelar.
- Servidor calcula elapsed: `now − startedAt − pausedSec` (não depender do tick do browser — tolerância a recarregar página/aba fechada).
- O tick de 1s do browser é só display.
- Ao finalizar: valida `canFinish = elapsed > 0`, grava `endedAt`, `durationSec`, snapshots de nomes e notas. `cancelled` descarta (mantém registro para auditoria opcional).
- Pomodoro: transição automática foco↔pausa no limite (comportamento já no mock); ciclos completos registrados; após N ciclos → pausa longa (hoje o mock não implementou — alinhar com settings).

### 5.3 Métricas semanais e sequência
- **Horas estudadas (período)**: `Σ durationSec` de sessões `completed` com `startedAt` no período local.
- **% da meta semanal**: `Σ durationSec da semana ÷ WeeklyGoal.targetMinutes × 100` (semana = seg→dom no fuso do usuário). Sem meta registrada → usa `UserSettings.weeklyTargetMinutes` fallback. Exibição pode passar de 100%.
- **Sequência (streak)**: dias locais consecutivos, terminando hoje (ou ontem, se hoje ainda sem estudo), com ≥1 sessão `completed` e efetivo > 0. Derivada; para o dashboard rápido, opcionalmente materializar `streakCurrent`/`streakBest` em tabela de estatística diária (`DayStats`) — recomendo adiar (YAGNI) e derivar por query com cache.
- **Foco médio** (dashboard "94%"): definição a validar com adm-design/produto — proposta: `média ponderada de (tempo efetivo ÷ tempo total sem relógio parado)` ou, em pomodoro, `% de ciclos de foco cumpridos até o limite`. Hoje é número sem origem — precisa de definição formal.
- **Metas cumpridas** (Estatísticas): dias com efetivo ≥ meta diária ÷ dias planejados; semanas idem por semana.
- **Distribuição/evolução**: agregações por dia/semana/mês e por disciplina a partir de `StudySession`.

### 5.4 Fuso horário e início de semana
- Todas as datas (sessions, blocks) em UTC; o "calendário local" usa `UserSettings.timezone` + `weekStartDay`.
- `weekStart` sempre a primeira segunda da semana local; jamais armazenar "Seg/Ter" sem data.
- Mudança de fuso pelo usuário não reescreve histórico — recalcula agregações on-read.
- Arquivamento vs exclusão: `Goal/Discipline` se **arquivam** (status + `archivedAt`; saem das listas/seletores automáticos, históricos intactos). Exclusão física é ação irmã e rara: SetNull nos FKs + snapshots de nome preservam as estatísticas antigas. `SavedMaterial` é registro pessoal: remover = apagar (não arquivar).

### 5.5 Planejamento semanal
- Plano é por `weekStart`; navegação ± semanas lê blocos da semana referida (hoje o mock só tem dados da semana 0 — ok para protótipo).
- Adicionar blocoよね: exige disciplId/topicId **ou** subject ad-hoc; valida sobreposição (§2 PlannedBlock).
- "Estudar" num bloco → pré-seleciona objetivo/disciplina/assunto no workbench e liga `plannedBlockId`. Ao concluir, bloco pode virar `completed` (manual ou automático).

### 5.6 Biblioteca
- Salvar no Explorar cria `SavedMaterial` (status `nao_iniciado`).
- Progresso é manual nesta fase (sem player/integração); regras de transição no §2.
- Favoritar independe do status; filtros/tabs = queries por `status`/`favorite`/busca textual.

## 6. Métricas derivadas vs persistidas

**Persistidas** (escritas no ato): `StudySession.durationSec/pausedSec/pomodoroCycles/notes/status/startedAt/endedAt/snapshots`; `WeeklyGoal/DisciplineWeeklyGoal.targetMinutes`; `UserSettings.*`; `SavedMaterial.status/progress/favorite`; `Goal.archivedAt/status/targetDate/weeklyTargetMinutes`; `Material.*`; `PlannedBlock.*`.

**Derivadas por query (não persistir)**:
- Dashboard: `weeklyActivity` (min/dia), `dashboardMetrics` (horas, sessões concluídas, streak atual, foco médio), `weeklyGoal` (feitas/total/% e mensagem de ritmo), `goalDistribution`, `recentSessions`/`upcomingSessions` (últimas 3 / próximas do plano).
- Estatísticas: `statsMetrics` (total, média diária, metas cumpridas, frequência), `statsBars` (evolução 7d/30d/90d/custom), `disciplineShares`, `statisticsHistory` (tabela com filtro/busca).
- Goals view: contadores de abas, `progress` do objetivo, contagens por disciplina.
- Planejamento: `disciplineGoals` (real vs meta por disciplina).

Exceção recomendável: `Goal.progress` pré-computado (refresh ao finalizar sessão) se a listagem ficar lenta — com volume pessoal pequeno, manter derivado.
Aggregations usam índices (§7); sem materializar na fase seguinte.

## 7. Índices sugeridos

- `StudySession (userId, startedAt desc)`; parcial `WHERE status IN ('in_progress','paused')` para sessão ativa; `(sessionId)` FK; `(goalId, startedAt)`; `(disciplineId, startedAt)`; `(plannedBlockId)`.
- `PlannedBlock (userId, weekStart)`; `(userId, weekStart, dayOfWeek, startAt)`.
- `SavedMaterial` unique `(userId, materialId)`; `(userId, status)`; `(userId, favorite)`.
- `WeeklyGoal` unique `(userId, weekStart)`; `DisciplineWeeklyGoal` unique tripla.
- `Goal (userId, status)`; `Discipline (goalId, userId)`; `Topic (disciplineId)`.
- `Material (type)`, `(level)`, `(language)`; índice de texto (`title`/`description`) opcional (GIN/FTS) quando houver busca server-side.

## 8. Inconsistências do mock (corrigir na implementação)

1. **Chaves por nome em vez de id** — `StudySession.subject/topic`, `objectivesTree` (posições por índice/nome), `goalDistribution.subject` usa abreviações "Mat/Fís/Red" que não casam com "Matemática/…", `HistoryRow.objetivo` repete "ENEM 2027" inclusive para disciplinas que não existem no objetivosTree ("Química Orgânica"). Modelo real: FKs por id + snapshots de nome.
2. **Durações em string** — `duration: "1h 05min" | "52 min" | "A definir"` em sessões e blocos; `Material.duration` duplica `minutes`; `activeGoal.progressLabel`/`weeklyGoal.done` = strings "8h 12min"/"de 10h". Persistir números (seg/min) e formatar só na UI.
3. **Biblioteca desacoplada do saved-context** — `SavedMaterialsProvider` persiste só `savedIds` em localStorage e nada é consumido pela Biblioteca: `library-view` usa `libraryData` com material inteiro aninhado (duplicação) + favoritar local `useState` não sincroniza. Modelo: `SavedMaterial(userId, materialId, status, progress, favorite)`; Explorar e Biblioteca leem/escrevem a mesma tabela.
4. **Métricas hardcoded** — `dashboardMetrics`, `weeklyActivity`, `weekDates` (14–20), `todayDate`/`todayIndex=2` fixos; números do Dashboard não batem entre si (18h40 vs soma 965min=16h05 da semana). Substituir por derivadas (§6).
5. **Modo/status de sessão como string** — `mode: "Foco profundo"/"Revisão ativa"/"Pomodoro (2/4)"`; status `nao-iniciada` no histórico de sessões reais mistura registro manual/agendado com medição. Separar `planned` (PlannedBlock) de realizado (StudySession).
6. **Pomodoro incompleto** — settings salva `long=15`, workbench não lê nem implementa pausa longa; `POMODORO_CYCLES=4` hard-coded; localStorage `study-manager-pomodoro` tem {focus, short} no workbench vs {focus, short, long} no settings (parse tolerante mas divergente).
7. **Rating/notas como string** — `Material.rating: "4,8 de 5"` → float; "A definir" como duração; notas de sessão coletadas e nunca enviadas ("não é salvo no servidor" — decidir persistir em `notes`).
8. **Seletores sem âncora estável** — workbench guarda `objectiveIdx` (índice de array) e disciplinas/assuntos por string; sem id estável, qualquer edição de objetivo/estrutura quebra o seletor. O papel de `StudySession.subject/topic` deve ser FK `disciplineId/topicId`.
9. **Metas por disciplina pré-computadas** — `disciplineGoals` traz "3.2h / 4h" + "80%" pretabulados; no modelo real vira query da semana corrente contra `DisciplineWeeklyGoal`.
10. **Tipos duplicados e espalhados** — `StudySession`/`SessionStatus` de mock-data são importados por 3 telas; consolidar todos os contratos (enums, entidades, helpers) num módulo único de tipos sob responsabilidade do op-logica, separado dos componentes.
11. **Estatísticas "custom"** — devolve os mesmos dados do 30d; na implementação precisa de query real por intervalo.

## 9. Contratos prontos para a implementação (próxima fase)

- `formatDuration(seconds)` / `parseDurationLabel(label)` helpers (única fonte).
- `getWeekStart(date, timezone, weekStartDay)`.
- `computeStreak(sessions, today)` — pure function testável.
- `computeWeeklyProgress(sessions, weeklyGoal)`.
- `sessionElapsedClock(activeSession, now)` (server-friendly).
- Requisição de sessão sem sobreposição/atualização ativa única no service.

---
*Documento produzido por op-logica para revisão do adm-eng. Sem código editado.*
