# Fase 2 — Relatório consolidado (adm-eng)

Somente análise e planejamento. Nada foi implementado, instalado ou migrado.
Fontes: auditoria do adm-eng, `docs/fase2-modelagem-dados-oplogica.md` (op-logica) e `docs/op-seg-fase2-analise-auth-autorizacao-validacao.md` (op-seg).

---

## 1. Diagnóstico do frontend

**Stack:** Next.js 14.2 (App Router), React 18, TypeScript `strict`, Tailwind 3, Recharts, lucide-react, clsx/tailwind-merge. Não há testes, backend, `middleware.ts` nem `.env`.

**Estrutura:**
- `src/app/*`: 10 rotas. Cada página tem cerca de 8 linhas e delega a uma *view* client.
- `src/components/<domínio>/*-view.tsx`: telas inteiras como Client Components, com 180 a 546 linhas cada.
- `src/components/ui/*`: componentes reutilizáveis (Button, Badge, Input, Select, Dialog, Toast, MetricCard).
- `src/components/layout/*`: estrutura da aplicação (AppShell, Sidebar, Topbar, BottomNavigation).
- `src/lib/mock-data.ts` (716 linhas) e `src/lib/mock-stats.ts` (192 linhas): todos os dados e todos os tipos.

| Rota | Real (lógica de cliente) | Demonstrativo / depende do banco |
|---|---|---|
| `/` Dashboard | — | métricas, gráfico semanal, meta 82%, sessões, objetivo ativo |
| `/estudo` | cronômetro Livre/Pomodoro (setInterval), modal, anotações | seletores com `objectivesTree`, histórico só em `useState` |
| `/planejamento` | navegação de semana e alternância de visão | `plannedBlocks`, `disciplineGoals` |
| `/objetivos` | abas e seleção | `goalsData`; não há CRUD |
| `/explorar`, `/explorar/[id]` | busca e filtros locais | catálogo mock; `generateStaticParams` a partir do mock |
| `/biblioteca` | abas e busca | `libraryData`, **desacoplado** de `saved-context` |
| `/edital` | drag & drop (UI) | não lê o PDF; o resultado é fixo |
| `/estatisticas` | filtros | todas as séries vêm pré-calculadas do mock |
| `/configuracoes` | tema e Pomodoro em localStorage | perfil "Marina Costa" fixo no código |

**Dívida técnica que bloqueia a integração:**
1. Entidades identificadas por **nome** e não por id (disciplina, assunto, objetivo nas sessões; apelidos "Mat/Fis/Red").
2. Durações em **string** ("1h 20min", "A definir").
3. Duas fontes de verdade em Materiais salvos (o `saved-context` guarda ids; a Biblioteca lê `libraryData`).
4. Configuração do Pomodoro gravada em `settings-view` e lida em `study-workbench`, sem pausa longa e com `POMODORO_CYCLES=4` fixo.
5. Tipos de domínio misturados com dados mock em `mock-data.ts`.
6. Views client monolíticas: a busca de dados terá de subir para Server Components.
7. `JSON.parse` do localStorage sem validação.
8. Nenhuma suíte de testes.

**Pontos positivos:** a separação `app/` → view já existe, os componentes de UI são reutilizáveis e os dados estão centralizados. A migração é viável sem refazer o design.

---

## 2. Arquitetura recomendada: monolito modular

```
src/
  app/                      # rotas (RSC) — buscam dados via módulos, passam props às views
    (auth)/login, signup, reset
    (app)/...rotas atuais
  modules/
    <modulo>/
      domain/               # tipos, regras puras (sem I/O) — testáveis
      schemas.ts            # Zod (entrada/saída)
      repository.ts         # Prisma, SEMPRE filtrado por userId   (server-only)
      service.ts            # casos de uso (orquestra repo + regras) (server-only)
      actions.ts            # Server Actions ("use server"): auth → Zod → service
  components/               # UI atual (sem acesso a dados)
  lib/
    db.ts                   # PrismaClient singleton (server-only)
    supabase/{server,client,middleware}.ts
    auth.ts                 # requireUser(): userId da sessão, ou redirect
    errors.ts               # AppError {VALIDATION_ERROR|NOT_FOUND|FORBIDDEN|CONFLICT}
    time.ts / format.ts     # getWeekStart, formatDuration (TZ do usuário)
middleware.ts               # refresh de sessão + proteção de rotas
prisma/schema.prisma
```

**Módulos e fronteiras:** `identity` (perfil, settings), `goals` (objetivos, disciplinas, assuntos), `planning` (blocos, metas semanais), `sessions`, `analytics` (somente leitura: deriva métricas de `sessions`/`planning`), `library` (catálogo e itens salvos), `edital` (upload e extração), `discovery` (busca externa).
Regra: um módulo só usa o `service` de outro, nunca o `repository`. `analytics` não escreve.

**Camadas:** RSC/page → service (leitura). Formulário → Server Action → `requireUser()` → `schema.safeParse` → service → repository → `revalidatePath`. Route Handlers apenas para upload e webhooks.

**Fluxo de auth e autorização (op-seg, revisado):**
- O `@supabase/ssr` guarda a sessão em cookies httpOnly. O `middleware.ts` renova a sessão e redireciona para `/login` quando não há sessão nas rotas do grupo `(app)`.
- `requireUser()` usa `supabase.auth.getUser()` (nunca `getSession()`) em **toda** action e página.
- `userId` vem **somente** da sessão. Qualquer id de recurso recebido do cliente é verificado com `where: { id, userId }`; se não existir, `notFound()`.
- **Correção ao op-seg:** o Prisma conecta direto ao Postgres e **não** carrega `auth.uid()`, então o RLS não protege as queries do Prisma. A barreira efetiva é `userId` obrigatório no repository, garantido por testes de isolamento. O RLS deny-by-default continua habilitado em todas as tabelas para proteger o acesso via anon key/PostgREST e o Storage. A `service_role` fica só em um módulo admin `server-only`.

---

## 3. Modelagem inicial (consolidada)

**Ajuste ao op-logica:** não criar `User` com email próprio. O email vive em `auth.users`. Usar `Profile.id = auth.users.id` (uuid). O trigger que cria o perfil fica no SQL de migração.

```
Profile(id uuid PK = auth uid, name, avatarUrl?, termsAcceptedAt, createdAt, updatedAt)
UserSettings(userId PK→Profile cascade, timezone='America/Sao_Paulo', weeklyTargetMinutes>0 default 600,
             dailyTargetMinutes?, pomodoroFocusSec=1500, shortBreakSec=300, longBreakSec=900,
             cyclesBeforeLongBreak=4, notifySessionReminders, timerSounds, theme ThemeChoice)
Goal(id, userId→cascade, title, description?, color, status GoalStatus, targetDate?, weeklyTargetMinutes?,
     archivedAt?, createdAt)                         idx(userId,status)
Discipline(id, goalId→cascade, userId, name, position, archivedAt?)   unique(goalId,name)
Topic(id, disciplineId→cascade, userId, name, position)               unique(disciplineId,name)
WeeklyGoal(id, userId, goalId?→setNull, weekStart date, targetMinutes) unique(userId,weekStart,goalId)
DisciplineWeeklyGoal(id, userId, disciplineId→cascade, weekStart, targetMinutes) unique(userId,disciplineId,weekStart)
PlannedBlock(id, userId, goalId?/disciplineId?/topicId? →setNull, label?, weekStart, dayOfWeek 0..6,
             startTime 'HH:mm', durationMin 15..240, status PlannedBlockStatus)
             idx(userId,weekStart,dayOfWeek,startTime)
StudySession(id, userId, goalId?/disciplineId?/topicId?/plannedBlockId? →setNull,
             goalTitleSnap, disciplineNameSnap?, topicNameSnap?, mode SessionMode, status SessionStatus,
             startedAt, endedAt?, durationSec int, pausedSec int, pomodoroCycles int, notes?)
             idx(userId,startedAt desc), (userId,disciplineId,startedAt)
             PARTIAL UNIQUE (userId) WHERE status IN ('in_progress','paused')
             CHECK endedAt>=startedAt; status='completed' ⇒ durationSec>0
SessionBreak(id, sessionId→cascade, type BreakType, startedAt, endedAt?, durationSec)
Material(id, ownerId? (null = catálogo global), source, externalId?, url, title, description, type,
         level?, language?, minutes?, rating?, verified, tags text[])  unique(source,externalId)
SavedMaterial(id, userId, materialId→restrict, status LibraryStatus, progress 0..100, favorite, savedAt,
              completedAt?)  unique(userId,materialId), idx(userId,status), idx(userId,favorite)
EditalUpload(id, userId, storagePath, fileName, sizeBytes, status ProcessingStatus, error?, createdAt)
EditalExtraction(id, uploadId→cascade, payload jsonb (validado por Zod), createdAt)
```
**Enums:** `GoalStatus(active, archived)`, `SessionMode(free, pomodoro)`, `SessionStatus(in_progress, paused, completed, cancelled)`, `PlannedBlockStatus(pending, done, missed)`, `LibraryStatus(not_started, in_progress, done)`, `MaterialType(video, article, pdf, course)`, `MaterialLevel`, `BreakType(short, long)`, `ProcessingStatus(pending, processing, done, failed)`, `ThemeChoice`. Os rótulos em português ficam só na UI.

**Regras-chave:**
- Durações sempre em segundos.
- O tempo decorrido é calculado no servidor.
- Uma única sessão ativa por usuário (tentativa de iniciar outra retorna `409`).
- Histórico preservado via SetNull + snapshots.
- Arquivar é a ação padrão; excluir é exceção.
- Todas as métricas são **derivadas por query**, sem tabelas de agregados nesta fase.
- Semana segunda→domingo no fuso do usuário.
- "Foco %" ainda **sem definição de produto**: pendência para manager/adm-design.

**Isolamento:** toda tabela de usuário tem `userId` (desnormalizado em Discipline/Topic para filtro direto e RLS). Mesmo padrão em toda tabela: RLS `user_id = auth.uid()` mais filtro obrigatório no repository.

---

## 4. Plano incremental (9 prioridades)

Responsáveis: **op-logica** (domínio, schema, services), **op-seg** (auth, validação, autorização, upload, revisão de segurança), **op-front** (ligar as views aos dados, formulários, estados), **adm-eng** (revisão de arquitetura e aceite técnico), **adm-design** (revisão de UX em telas novas: login e formulários).

### P1 — Banco de dados e autenticação
- **Resp.:** op-seg (auth/middleware/RLS), op-logica (schema e seed), op-front (telas de login/cadastro/reset e perfil real na Sidebar/Configurações).
- **Arquivos:** `prisma/schema.prisma` (Profile, UserSettings), `prisma/seed.ts`, `src/lib/{db,auth,errors}.ts`, `src/lib/supabase/*`, `middleware.ts`, `src/app/(auth)/*`, `src/modules/identity/*`, `.env.example`, `next.config.js` (headers), SQL de RLS e do trigger de perfil.
- **Dependências:** projeto Supabase criado (decisão do usuário); deps `prisma`, `@prisma/client`, `@supabase/ssr`, `zod`, `server-only`, `vitest`.
- **Aceite:** cadastro, login, logout e reset funcionam; rotas `(app)` redirecionam quando não há sessão; o perfil é criado no 1º login; Configurações salvam nome, meta e Pomodoro no banco; nenhum segredo com `NEXT_PUBLIC_`; lint e build verdes.
- **Testes:** unit (`requireUser`, schemas); integração em banco de teste (perfil e settings); e2e (Playwright) de login/logout/redirect; teste de que acesso anon via PostgREST retorna vazio (RLS).

### P2 — CRUD de objetivos
- **Resp.:** op-logica (service/repo), op-seg (revisão de autorização), op-front (`goals-view` + formulários).
- **Arquivos:** `src/modules/goals/{domain,schemas,repository,service,actions}.ts`, `src/app/(app)/objetivos/page.tsx` (RSC), `goals-view.tsx` passa a receber props.
- **Dependências:** P1.
- **Aceite:** criar, editar, arquivar, reativar e excluir (com confirmação); abas Ativos/Arquivados/Todos refletem o banco; o usuário A não vê nem altera objetivos do usuário B.
- **Testes:** unit (regras de arquivamento); integração (CRUD e **isolamento entre 2 usuários**: id alheio → NOT_FOUND); e2e (fluxo criar → arquivar).

### P3 — CRUD de disciplinas e assuntos
- **Resp.:** op-logica, op-front, op-seg (revisão).
- **Arquivos:** `src/modules/goals/*` (Discipline e Topic no mesmo módulo), UI de detalhe do objetivo; seletores de `/estudo` alimentados pelo banco (substitui `objectivesTree`).
- **Dependências:** P2.
- **Aceite:** CRUD aninhado; unicidade de nome por pai com erro amigável; reordenação (position); arquivar disciplina a remove dos seletores sem apagar o histórico.
- **Testes:** integração (cascade, unique, isolamento); unit (ordenação); e2e (criar disciplina → aparece no seletor do /estudo).

### P4 — Planejamento semanal
- **Resp.:** op-logica (blocos, metas por semana, `getWeekStart` com TZ), op-front (`planning-view`).
- **Arquivos:** `src/modules/planning/*`, `src/lib/time.ts`, `/planejamento/page.tsx`.
- **Dependências:** P3.
- **Aceite:** criar, mover e excluir blocos; navegar entre semanas lendo do banco; metas por disciplina com progresso; validação de horário e duração; virada de semana correta no fuso America/Sao_Paulo.
- **Testes:** unit (`getWeekStart`, DST/fuso, sobreposição de blocos); integração (CRUD/isolamento); e2e (criar bloco e navegar de semana).

### P5 — Sessões de estudo
- **Resp.:** op-logica (máquina de estados, cálculo de tempo efetivo, sessão ativa única), op-front (`study-workbench` com actions start/pause/resume/finish/cancel), op-seg (revisão).
- **Arquivos:** `src/modules/sessions/*`, `src/lib/format.ts` (`formatDuration`), unificação da config do Pomodoro (lida de UserSettings).
- **Dependências:** P3 (seletores) e P1 (settings). P4 é opcional (vínculo ao bloco planejado).
- **Aceite:** sessão persistida com durações em segundos; recarregar a página retoma a sessão ativa com o tempo correto; não é possível ter 2 sessões ativas (409); pausa longa respeitada; histórico real no /estudo; concluir uma sessão vinculada marca o bloco como `done`.
- **Testes:** unit (transições de estado, cálculo efetivo livre/pomodoro); integração (índice parcial único, concorrência de duplo "iniciar"); e2e (iniciar → recarregar → finalizar).

### P6 — Dashboard com métricas reais (e Estatísticas)
- **Resp.:** op-logica (queries de `analytics`: horas, sessões, streak, % meta, distribuição, séries 7/30/90/custom), op-front (Dashboard e `statistics-view` recebem props).
- **Arquivos:** `src/modules/analytics/{queries,domain}.ts`, `/page.tsx`, `/estatisticas/page.tsx`.
- **Dependências:** P5 (sem sessões não há métrica); P4 para "próximas sessões".
- **Aceite:** todos os números batem com as sessões gravadas; estados vazios para usuário novo; respeita o fuso; definição de "Foco %" aprovada antes da entrega (ou o card é ocultado); tempo de resposta aceitável com 1 ano de dados semeados.
- **Testes:** unit (`computeStreak`, `computeWeeklyProgress` com fixtures); integração (queries contra seed conhecido); e2e (registrar uma sessão e ver o dashboard mudar).

### P7 — Biblioteca de materiais
- **Resp.:** op-logica (catálogo e SavedMaterial), op-front (unificar `saved-context` e `library-view`), op-seg (migração one-time do localStorage com Zod).
- **Arquivos:** `src/modules/library/*`, seed do catálogo a partir de `materialsData`, `/explorar/[id]` passa a ser dinâmico (remove `generateStaticParams` do mock).
- **Dependências:** P1.
- **Aceite:** salvar no Explorar aparece na Biblioteca (fonte única); status, progresso e favorito persistem; as regras de progresso (0–100, concluído ⇔ 100) são respeitadas; chaves antigas do localStorage migradas e removidas.
- **Testes:** unit (regras de status/progresso); integração (unique por usuário, isolamento); e2e (salvar → biblioteca → concluir).

### P8 — Análise de editais
- **Resp.:** op-seg (upload: bucket privado, magic bytes, limite, rate limit, URLs assinadas), op-logica (pipeline de extração e conversão em Goal/Disciplinas/Assuntos), op-front (estados pending/processing/done/failed).
- **Arquivos:** `src/modules/edital/*`, `src/app/api/edital/upload/route.ts`, worker/job de processamento.
- **Dependências:** P1, P3 (gerar objetivo). **Decisão pendente:** método de extração (parser de PDF com heurística vs LLM). Impacta custo, nova dependência e LGPD; requer aprovação do usuário.
- **Aceite:** só PDFs válidos até o limite; arquivo inacessível a outros usuários; o processamento não bloqueia a request; o usuário revisa antes de gerar o objetivo; falhas exibem estado de erro.
- **Testes:** unit (validação de arquivo, parser com PDFs de fixture); integração (políticas do Storage); segurança (PDF falso, arquivo enorme, path traversal); e2e (upload → revisão → gerar objetivo).

### P9 — Busca externa de conteúdos
- **Resp.:** op-logica (adaptadores por fonte, normalização em `Material` com `source/externalId`), op-seg (chaves de API só no servidor, allowlist de domínios, sanitização, rate limit/cache), op-front (resultados externos no Explorar).
- **Arquivos:** `src/modules/discovery/{providers/*,service}.ts`.
- **Dependências:** P7. **Decisão pendente:** quais fontes (ex.: YouTube Data API) e custos/termos de uso.
- **Aceite:** busca retorna resultados externos normalizados; salvar um item externo cria um `Material` deduplicado; falha da API externa degrada sem quebrar a tela; nenhuma chave exposta.
- **Testes:** unit (normalização por provider com fixtures); integração com HTTP mockado (timeout, erro, quota); e2e (buscar → salvar → biblioteca).

**Transversal (desde P1):** `vitest` para unit/integração, Playwright para e2e, banco de teste isolado, CI com lint + typecheck + test + build, `npm audit`.

---

## 5. Riscos e primeira tarefa

| # | Risco | Mitigação |
|---|---|---|
| R1 | IDOR: query sem `userId` ou id alheio vindo do cliente | `userId` obrigatório no repository; testes de isolamento em todo módulo |
| R2 | Supor que o RLS protege as queries do Prisma (não protege) | Documentado; RLS só como 2ª camada para PostgREST/Storage |
| R3 | `service_role`/segredos vazados (`NEXT_PUBLIC_`) | Módulo `server-only`; checagem no CI |
| R4 | Refatorar views grandes (até 546 linhas) quebrar o design | op-front só troca a origem de dados (props); revisão do adm-design a cada entrega |
| R5 | Erros de fuso/semana nas métricas | `lib/time.ts` único e testado |
| R6 | Métrica "Foco %" sem definição | Decisão de produto antes de P6 |
| R7 | Edital/busca externa: custo, dependências e LGPD | Decisão do usuário antes de P8/P9 |
| R8 | Upload malicioso | Magic bytes, limite de tamanho, bucket privado, rate limit |
| R9 | Next 14.2 com CVEs de middleware | Manter no patch mais recente e rodar `npm audit` antes do deploy |
| R10 | Ausência de testes hoje | Infra de testes entra em P1 |

**Decisões necessárias do usuário antes de implementar:**
1. Criar o projeto Supabase (local via CLI ou cloud) e autorizar novas dependências.
2. Definição de "Foco %".
3. Método de extração de edital (P8).
4. Fontes externas da busca (P9).

**Primeira tarefa recomendada (P1a, sem tocar nas telas):** fundação técnica.
- Instalar deps.
- Criar `prisma/schema.prisma` com Profile e UserSettings.
- Criar `src/lib/{db,auth,errors}.ts`, os clientes Supabase e o `middleware.ts`.
- Escrever `.env.example`, configurar os headers de segurança e o SQL de RLS e do trigger de perfil.
- Configurar `vitest` com os primeiros testes de `requireUser` e de RLS.
- Extrair os tipos de domínio de `mock-data.ts` para `src/modules/*/domain` sem alterar o comportamento da UI.

Responsáveis: op-seg (auth) e op-logica (schema), com revisão do adm-eng. op-front só entra em P1b (telas de login).
