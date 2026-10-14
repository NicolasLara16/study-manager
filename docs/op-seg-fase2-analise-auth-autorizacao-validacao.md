# Fase 2 — Análise de Segurança: Autenticação, Autorização, Validação e Dados Pessoais

**Autor:** op-seg · **Destinatário:** adm-eng · **Escopo:** somente análise (nenhum código alterado)
**Stack-alvo:** Next.js 14 App Router + Supabase Auth (`@supabase/ssr`) + Prisma/PostgreSQL + Zod

---

## 1. Fluxo de autenticação (rec)

### Padrão com `@supabase/ssr` (App Router)

- **Biblioteca única:** `@supabase/ssr` (não usar `@supabase/auth-helpers-*` — deprecado).
- **Dois clientes:**
  - `createBrowserClient()` — apenas para efeitos client-side não autoritativos (nada de decisão de acesso).
  - `createServerClient()` — em Server Components, Server Actions e Route Handlers; **origem de verdade** do `auth.getUser()`.
- **Server Actions para signup/login/logout/reset** (`"use server"`), localizadas em `src/lib/auth/` ou `src/app/(auth)/actions.ts`:
  - `signUp(email, password)` — Supabase Auth confirmado por e-mail; para `password` nunca logar nem incluir em erros.
  - `signIn(email, password)` — retorna erro genérico ("credenciais inválidas"), sem distinguir usuário inexistente vs. senha errada (evita enumeração).
  - `signOut()` — chamar `supabase.auth.signOut()` **no servidor** e redirecionar; além do revoke de tokens do lado Supabase, os cookies `sb-*` devem ser removidos (o `@supabase/ssr` cuida disso via `getAll/setAll`).
  - `resetPassword(email)` — fluxo `resetPasswordForEmail` com `redirectTo` fixado à origem do app (nunca aceitar URL de redirect de input do usuário → evita open redirect).
- **Cookies httpOnly:** o `@supabase/ssr` gerencia cookies `sb-<project-ref>-auth-token` com `httpOnly`, `Secure`, `SameSite=Lax/Strict`. Configurar nas opções: `secure: true` em produção; `maxAge` conforme Supabase Auth session.
- **`middleware.ts`** (`src/middleware.ts`):
  - Uso do padrão oficial de *session refresh*: middleware cria `createServerClient` com `request/response` do Next, chama `supabase.auth.getClaims()` (versões recentes) ou `getUser()` para forçar a troca do token de acesso quando expirado, e regrava os cookies na resposta.
  - Proteção de rotas por prefixo: lista de rotas autenticadas (`/dashboard`, `/planejamento`, `/estudo`, `/estatisticas`, `/objetivos`, `/biblioteca`, `/edital`, `/configuracoes`) e rotas públicas (`/`, `/explorar/public*`, `/login`, `/signup`, `/reset`).
  - Usuário autenticado tentando `/login`/`/signup` → redirecionar para o dashboard.
  - Cuidado: **middleware não substitui checagens no servidor** (Server Actions/Routes revalidam sempre). Compatibilidade: `Node.js` vs `Edge` — manter somente API usada em edge (`@supabase/ssr` é edge-safe).
- **Refresh de sessão:** dependente do middleware acima; adicionalmente evitar chamadas client-side `getUser()` como fonte de autorização. Em error 4xx do refresh (token revoke), limpar estado client e forçar login.

### Pontos de atenção

- Nunca usar `getSession()` (lê cookie sem verificar com o servidor de auth) para decisões de acesso — usar `getUser()`/`getClaims()`.
- Vincular e-mail verificado obrigatório antes de liberar rotas protegidas.
- Mensagens uniformes no reset (não revelar se o e-mail existe).

---

## 2. Vínculo `auth.users` ↔ `Profile`

- Tabela **Pública** `profiles` com `id uuid PK` = `auth.users.id` (FK para `auth.users(id) on delete cascade`).
- Campos-chave iniciais: `full_name`, `email`, `avatar_url`, `weekly_hours`, `pomodoro_focus/short/long`, `theme`, `created_at`, `updated_at`.
- **Criação no primeiro login:**
  1. Opção rec: trigger no PostgreSQL `ON AUTH.USERS INSERT` (`security definer`, schema-private) para criar `profiles` automaticamente — evita falhas de primeira sessão sem perfil.
  2. Alternativa: upsert idempotente na primeira requisição após login (`insert ... on conflict (id) do nothing`) dentro de Server Action autenticada.
- Nunca escrever `profiles` com `id` vindo do client; sempre `session.user.id`.
- Metadados do signup (`full_name` via `options.data`) são preenchidos pelo próprio usuário apenas no momento do cadastro — validar com Zod antes.

---

## 3. Estratégia de autorização

### Regra fundamental

**Todo acesso a dados por `userId` derivado da sessão no servidor** (`const userId = session.user.id` via `getUser()`; nunca de props, query, body, localStorage ou cookie custom).

### Prisma (service role) vs RLS — recomendação

- **Rec: defesa em profundidade com ambos:**
  1. **RLS habilitada em todas as tabelas públicas** (`profiles`, `materials`, `sessions`, `objectives`, `stats` etc.) com políticas `auth.uid() = user_id`. É o backstop: mesmo se um bug do Prisma escapar filtros, o Postgres bloqueia.
  2. **Prisma com camada de acesso sempre filtrando por `userId` da sessão:** “query padrão” obrigatória (helpers/repositórios) — `prisma.material.findMany({ where: { userId } })`; proibir PrismaClient "nu" nas Server Actions (code review + regra ESLint se houver).
- **Atenção central:** `SUPABASE_SERVICE_ROLE_KEY` **bypassa RLS**. Com Prisma (que já é server-only), usar a `DATABASE_URL` normal (connection string com role restrito) e **nunca** a service role. Se RLS estiver correta, a conexão direta do Prisma como role de banco (sem poder além do Postgres) é aceitável; o service_role no servidor só para tarefas admin (ex.: exclusão de Storage) e encapsulado num módulo único.
- Caso se erre no lado (e não houver RLS): risco de IDOR/vazamento cruzado entre usuários — por isso RLS como segunda camada é mandatória antes do primeiro deploy real.
- Teste de auditoria recomendado: com service role **desligado**, tentar cada query de Domain sem filtro — todas devem falhar ou retornar vazio (compra de confiança nas políticas RLS).

---

## 4. Validação (Zod) e tratamento de erros

### Padrão

- **Todo input externo passa por Zod:** Server Actions (body de formulário), Route Handlers (params, query, body), upload (nome/size/type), parâmetros de URL de páginas dinâmicas (`explorar/[id]` → `z.string().uuid()` se necessário).
- Definir schemas por domínio em `src/lib/validation/` (ex.: `materialNameSchema`, `sessionCreateSchema`), alinhados ao Prisma Schema (com revisão cruzada `zod-prisma-types` opcional futura — evitar deps extras por ora).
- Server Actions:
  ```ts
  const parsed = schema.safeParse(Object.fromEntries(await formData));
  if (!parsed.success) return { error: "Dados inválidos." };
  ```
- **Erros: nunca vazar detalhes internos** (stack, SQL, chaves, ids de tabelas, e-mails de terceiros). Responder: mensagem genérica + código estável (`VALIDATION_ERROR`, `NOT_FOUND`, `FORBIDDEN`); detalhes só para logs do servidor.
- `notFound()`/redirecionamento para 404 ao consultar recursos inexistentes/de outro usuário (não revelar existência).
- Rate limit + sanitização adicionais nos campos rich-text (se renderização com HTML for introduzida — no momento o protótipo renderiza texto puro via React, que já escapa por padrão: rec **proibir `dangerouslySetInnerHTML`**).

---

## 5. Upload de edital (PDF)

### Recomendações

- **Supabase Storage, bucket privado** (nunca público). Download por **URL assinada** com TTL curto (ex.: 60 s–5 min) quando o usuário pedir o PDF.
- **Aceitação:**
  - Content-Type permitido: somente `application/pdf`.
  - **Validar magic bytes** (`%PDF-` nas primeiras posições) — não confiar só no MIME/manifest; PDF malicioso disfarçado é vetor clássico.
  - Tamanho: cap razoável (ex.: 20–50 MB; também é exigido para não estourar limites do Supabase e do Next.js route handler).
  - Nome de arquivo: **nunca** usar o nome original no path (path traversal/colisão). Path: `{userId}/{materialId}/edital.pdf` (UUID gerado server-side).
- Permissão de Storage: políticas RLS do bucket limitadas a owner do objeto (`auth.uid() = auth.folder`), sem acesso público.
- **Processamento assíncrono:** inserir registro `material` em estado `PROCESSING` + fila/tarefa (ex.: Route Handler + cron/worker, Vercel QStash, ou tabela de jobs) para extração de texto; responder ao usuário imediatamente com status pendente; polling/revalidate. Isso evita timeouts da request e limita abuso de CPU.
- Anti-abuso:
  - Rate limit por usuário no upload (ex.: 10/h) e por tamanho total.
  - Virus/validação extra é *nice-to-have* (não instalar deps sem necessidade nesta fase; nota para fases futuras).
- Dados extraídos do PDF são guardados no DB do usuário — nunca confiáveis como input estruturado sem validação (ver §4).

---

## 6. Credenciais e variáveis de ambiente

- `.env.local` **nunca** commitado; `.env.example` com chaves vazias e nomes documentados. Adicionar `.env*` ao `.gitignore` (o protótipo não tem git repo ainda — confirmar quando o repo for criado).
- Chaves previstas:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (públicas, no client) — **anônima ainda é chave de API com permissões mínimas**; RLS deve ser “default deny”.
  - `SUPABASE_SERVICE_ROLE_KEY` — **exclusiva no servidor** (Server Actions/Route Handlers/worker), nunca prefixo `NEXT_PUBLIC_`, nunca importada em client components.
  - `DATABASE_URL` (Prisma, pooled) e `DIRECT_URL` (migrations) — só no servidor.
- Regras: `NEXT_PUBLIC_*` é público por definição — não colocar nada sensível. Logs não devem conter env values. PrismaClient/supabaseAdmin importados apenas de módulo marcado `server-only` (o Next quebra o build se o client tentar importar — usar `server-only` pkg, sem deps extras relevantes).
- Rotações: documentar rotação de service role key e revoke imediato em caso de leak.

---

## 7. LGPD

### Dados pessoais atualmente no protótipo

- Hoje tudo é **mock local**: nome fictício “Marina Costa”, e-mail fictício em `settings-view.tsx`; nenhum dado real persistido.
- Após Fase 2, o banco conterá: e-mail, nome, avatar, metadados de sessão de estudo, PDFs de editais (dados de curr Competências/edital podem revelar dado pessoal do usuário), histórico de uso.

### Compliance mínimo viável

- **Registro de dados tratados** (inventário simples em `docs`): finalidade (funcionalidade app), base legal (consentimento/contrato), prazo, titular.
- **Consentimento e aviso:** termo no signup (aceite explícito em checkbox, logado com timestamp), política de privacidade acessível no app.
- **Exclusão de conta:** Server Action de exclusão: anônima ou delete completo — `delete on cascade` de `profiles`, objetos em Storage sob `userId/{...}`, opt-in de soft-delete por X dias antes da purge (Supabase Admin API server-side com service role).
- **Exportação/Dados do titular:** endpoint/ação que gera JSON por usuário com todos os registros retornados (query filtrada por userId da sessão).
- **Minimização:** coletar apenas o necessário (proibir PII em localStorage; ver §8).
- **Acesso a dados de terceiros:** uploads de editais podem conter dados de terceiros (é edital público normalmente) — minimizar por regex/segmentação se extração profunda for implementada.
- **Retenção:** PDFs de usuários que abandonaram conta: purge após inatividade (ex.: 12 meses) com aviso prévio.

---

## 8. Rate limiting, CSRF, headers e migração de localStorage

### Rate limiting

- Rec primeira versão: **rate limit por middleware em memória/edge (in-memory map) ou unit callers:** targets — Server Actions de auth (login/signup/reset, ex.: 5/min por IP), uploads (10/h por usuário), geração de URL assinada.
- Se a app for serverless (Vercel), memória não é confiável por instância — rec para a fase seguinte: `Upstash Redis`/Otor collateral (ou degradação: capa no Supabase Auth: Maximiano já limita tentativas em auth).
- Monitorno: log de rejeição em nível local.

### CSRF

- **Server Actions** no Next.js 14 já possuem verificação embutida de `Origin`/`Host` (proteção CSRF padrão). Manter tudo mutante em Server Actions em vez de Route Handlers mutantes; se houver Route Handlers mutantes (upload etc.), verificar explicitamente `SameSite=Lax` nos cookies de auth e checar header `Origin` vs `Host`.
- Cookies do `@supabase/ssr`: `SameSite=Lax` suficiente para o fluxo normal (Safari/iOS); evitar `SameSite=None` — requer `Secure` e uso legítimo de top-level webhook se houver (não há).
- Não criar API pública sem auth nesta fase.

### Headers de segurança

Rec definir em `next.config.mjs` (ou middleware):

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' (Next precisa inline.js); style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://*.supabase.co; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
```

- CSP com `unsafe-inline` em script por causa do runtime do Next (rec posterior: nonce) — mas evitar `unsafe-eval` (Next_DISABLE eval; rec: build release).
- Aproveitar CSP também contra `dangerouslySetInnerHTML` futuro.

### Migração do localStorage atual

Estado observado (inspeção somente leitura em `src/` — chaves reais no protótipo):

| Chave | Onde | Dado migrado para | Custo |
| --- | --- | --- | --- |
| `study-manager-theme` | `theme-provider.tsx` | `profiles.theme` (persistida) + fallback cookie primeiro render p/ evitar flash | baixo |
| `study-manager-pomodoro` | `settings-view.tsx` (write), `study-workbench.tsx` (read) | `profiles.pomodoro_*` — unificar **duas leituras/duplicações** em um único módulo | baixo |
| `study-manager-saved-materials` | `lib/saved-context.tsx` | tabela `saved_materials (userId, materialId)` | médio |

Riscos/pontos da migração:

- `JSON.parse` sem validação (3 chaves) — ao migrar, validar com Zod no parser do localStorage (também protege tempo da vida do protótipo se rodar com dado corrompido).
- `saved-context` guarda apenas ids — quando viver no DB, manter otimista local + `useOptimistic`/local echo com erro de sincronização visível (não confundir o usuário achando que salvou e não salvou).
- Nada de PII em localStorage a partir da Fase 2 (não há atualmente — bom).
- Distinguir claramente “preferências locais” (aceitável em localStorage: tema, onboarding) de “dados de conta” (sempre no Supabase).
- Ao trocar localStorage por dados de servidor, fazer **merge one-time** (ler localStorage antigo na primeira sessão autenticada e persistir, depois remover a chave) para não perder estado atual do usuário.

---

## 9. Riscos priorizados (maior → menor)

| # | Risco | Motivo / fase em que se materializa | Mitigação rec |
| --- | --- | --- | --- |
| R1 | **Service role vaza / tem bypass de RLS** com queries Prisma sem filtro `userId` | IDOR/cross-tenant no primeiro backend real | RLS em todas as tabelas + queries sempre com `userId` da sessão + `server-only` |
| R2 | **Autorização baseada em dados do client** (id de material/objetivo no body usado para conceder acesso) | Uso imediato em Server Actions | `getUser()` sempre; `where userId =` em todas as queries |
| R3 | **PDF malicioso ou MIME spoofado** (upload validado por só `content-type`) | Disponível já no 1º upload | validar magic bytes, tamanho, path UUID, bucket privado, URL assinada, processamento assíncrono |
| R4 | **Erro interno vaza detalhe/stack para o client** por Server Action sem trim de erros | Fácil nas primeiras Actions | erros genéricos p/ UX; detalhes em log server; `utils` de `toClientError()` |
| R5 | **Login sem rate limit / enumeração de e-mail** (responder diferente para usuário inexistente) | 1º fluxo de auth | 5/min por IP+email; resposta genérica; e-mail único em signup indicando “e-mail já cadastrado” é aceitável com CAPTCHA futuro |
| R6 | **CSP fraca ou ausente** + uso futuro de `dangerouslySetInnerHTML` | XSS com conteúdo externo de edital | CSP em produção; proibir `dangerouslySetInnerHTML`; sanitizar se HTML for necessário |
| R7 | **Chaves no Vercel com prefixo público errado** (`NEXT_PUBLIC_` em service role) | Vazamento instantâneo | lint/grep no CI buscando a string; SEGÍVEL revisar no code review do repositorio |
| R8 | **Flash/brute force de token no reset** (redirectTo sem whitelist) | 1º fluxo reset | `redirectTo` fixe constantes, validação de origem |
| R9 | **Migração localStorage sem validação** (JSON.parse, PII futura) | Fase de integração de perfil | Zod no parser; nunca PII em localStorage |
| R10 | **Dependências sem auditoria** (Snyk/`npm audit`) — hoje `next@14.2.x`, `eslint 8.x` congelados | pré-deploy real | rodar `npm audit` fix/dry-run + renovar next para patch de segurança vigente (14.2.x tem CVE históricas SSRCR/Cache-Key); CSRF/SS-carousel conhecidas já corrigidas em HTN14 patches — manter atual |

---

## 10. Checklist sugerido para o implementador (fase seguinte)

- [ ] `@supabase/ssr` + middleware de session refresh + rotas protegidas.
- [ ] Server Actions de auth com Zod + erros genéricos + rate limit login.
- [ ] Trigger/upsert de `profiles` no primeiro login; FK on delete cascade.
- [ ] RLS “deny by default” em todas as tabelas; teste de bypass com anônima.
- [ ] `server-only` em módulos de PrismaClient/supabaseAdmin; never `NEXT_PUBLIC_` em secrets.
- [ ] Upload com magic bytes, tamanho, path `userId/UUID`, bucket privado, URL assinada TTL curto, worker assíncrono.
- [ ] Headers de segurança (CSP/HSTS/X-Frame/X-Content-Type/Referrer/Permissions) via next.config.
- [ ] Exclusão e exportação de conta (LGPD) consumíveis em Configurações.
- [ ] Migração one-time de localStorage (tema, pomodoro, salvos) com validação Zod e sem PII.
- [ ] `npm audit` limpo (ou justificado) antes do deploy real.

*Fim do documento. Nenhum arquivo de código foi modificado.*
