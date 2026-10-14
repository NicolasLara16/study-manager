# Study Manager — Design System & Especificação Frontend

Documento de referência oficial extraído diretamente de `UX/study-manager.pen` e `UX/UX.png` para a implementação frontend.

---

## 1. Tokens de Design (Variáveis Oficiais)

| Token | Modo Claro (Light) | Modo Escuro (Dark) | Uso / Descrição |
|---|---|---|---|
| `bg-app` | `#F7F7F8` | `#0C0C0E` | Fundo principal da aplicação |
| `bg-surface` | `#FFFFFF` | `#17171A` | Cards, modais, painéis e containers |
| `bg-subtle` | `#F3F4F6` | `#252529` | Fundos secundários, hover, badges sutis |
| `text-primary` | `#18181B` | `#F4F4F5` | Títulos, textos principais, ênfases |
| `text-secondary` | `#71717A` | `#A1A1AA` | Descrições, metadados, apoios |
| `text-muted` | `#A1A1AA` | `#71717A` | Placeholders, desabilitados, bordas tênues |
| `border` | `#E4E4E7` | `#2D2D32` | Linhas divisórias, bordas de cards e inputs |
| `indigo` | `#4F46E5` | `#4F46E5` | Cor primária de destaque (Brand / Ação) |
| `indigo-soft` | `#EEF2FF` | `#24213D` | Fundo de destaque ativo, badge primário |
| `success` | `#16A34A` | `#16A34A` | Indicadores de sucesso, metas concluídas |

### Tipografia e Raios
- **Fonte**: `Geist`, `Inter`, ou system sans-serif moderna
- **radius-sm**: `8px` (`rounded-lg`) — botões, badges, inputs
- **radius-md**: `12px` (`rounded-xl`) — cards, painéis, modais

---

## 2. Layouts e Breakpoints

1. **Desktop (1440px x 1024px)**:
   - **Sidebar**: Fixa à esquerda, largura `248px`
   - **Topbar**: Fixa no topo da área principal, altura `72px`
   - **Conteúdo**: Área fluida com padding estruturado (`p-6` ou `p-8`, max-w-7xl)
2. **Tablet (1024px x 768px)**:
   - **Sidebar Compacta / Ícones**: Largura reduzida com navegação por ícones Lucide
   - Conteúdo em grid adaptativo (2 colunas)
3. **Mobile (390px x 844px)**:
   - **Header Mobile**: Logo, marca, botão de tema e drawer/menu
   - **Bottom Navigation**: Barra fixa inferior com 4 abas (`Início`, `Plano`, `Estudar`, `Explorar`)
   - Conteúdo empilhado em coluna única (`px-4 py-5`)

---

## 3. Componentes Reutilizáveis

1. **Sidebar Desktop** (`Componente • Sidebar desktop`):
   - Logo: Ícone `graduation-cap` + Texto "Study Manager"
   - Navegação:
     - `Visão geral` (Dashboard) — `layout-dashboard`
     - `Meu planejamento` — `calendar-range`
     - `Sessões de estudo` — `timer`
     - `Explorar conteúdos` — `compass`
     - `Meus materiais` — `library`
     - `Editais` — `file-text`
     - `Estatísticas` — `chart-no-axes-combined`
   - Card Meta Semanal: "Meta semanal 82% — Faltam 1h 48min para concluir" com barra de progresso
   - Rodapé: Configurações (`settings`) + Perfil de Marina Costa ("MC", Plano pessoal)

2. **Topbar Desktop** (`Componente • Topbar desktop`):
   - Breadcrumb: "Workspace > [Página Atual]"
   - Campo de busca global com atalho visual "⌘ K"
   - Notificações (`bell`)
   - Toggle de Tema Claro/Escuro (`sun` / `moon`)

3. **Botão Primário** (`Componente • Botão primário`):
   - Background Indigo (`#4F46E5`), texto branco, altura 44px, raio 8px, suporte a ícone à esquerda

4. **Botão Secundário** (`Componente • Botão secundário`):
   - Borda `border`, fundo `bg-surface` ou `bg-subtle`, altura 40px, raio 8px

5. **Cartão de Métrica** (`Componente • Cartão de métrica`):
   - Título/Rótulo superior + Ícone com fundo sutil
   - Valor numérico destacado grande
   - Indicador de variação / contexto (+12%, etc.)

6. **Linha de Sessão** (`Componente • Linha de sessão`):
   - Marcador colorido lateral da matéria
   - Título, metadados ("Hoje, 09:30 • Foco profundo")
   - Duração à direita ("1h 20min") + menu de opções (`ellipsis`)

7. **Campo / Input / Select** (`Componente • Campo`):
   - Estados: Padrão, Focus (anel indigo), Erro (borda vermelha e ícone `circle-alert`)

8. **Abas / Tabs** (`Componente • Aba`):
   - Seleção com pill ou underline indigo ativo

9. **Badge** (`Componente • Badge`):
   - Ponto de status colorido + label ("Em andamento", "Concluído", "Não iniciado")

10. **Card de Material** (`Componente • Resultado de material`):
    - Miniatura com ícone do tipo (`circle-play`, `file-text`, `newspaper`)
    - Título, descrição, metadados (Fonte • Formato • Duração)
    - Ações rápidas: Salvar (`bookmark`) e "Estudar agora"

11. **Toast & Dialog**:
    - Toast de confirmação ("Material salvo na biblioteca", "Sessão concluída")
    - Dialog modal de confirmação ("Finalizar sessão? O tempo registrado será adicionado às suas estatísticas.")

---

## 4. Mapa das 9 Telas Principais

1. **Dashboard** (`/`): Boas-vindas ("Bom dia, Marina"), 4 métricas (Horas estudadas 18h40, Sessões 14, Sequência 5 dias, Foco 94%), Gráfico de Atividade Semanal (Seg a Dom), Card de Meta Semanal (8h12 de 10h), Sessões Recentes, Próximas Sessões, Objetivo Ativo (ENEM 2027).
2. **Meu Planejamento** (`/planejamento`): Seletor de Objetivo (ENEM 2027), alternância Calendário/Lista, Navegação semanal, Grade de blocos por dia da semana com horários e matérias, Metas por disciplina (Matemática, Física, Redação, Biologia).
3. **Sessões de Estudo** (`/estudo`): Modos Livre e Pomodoro, Seleção de Objetivo > Disciplina > Assunto, Cronômetro funcional com Iniciar/Pausar/Finalizar, Mostrador (ex: 42:18), Campo de Anotações, Histórico recente com status.
4. **Explorar Conteúdos** (`/explorar`): Barra de busca principal, filtros (Disciplina, Assunto, Tipo, Nível, Idioma, Duração), Lista de categorias por disciplina com contadores (Matemática 248, Física 182...), Grade de resultados recomendados.
5. **Detalhes do Material** (`/explorar/[id]`): Botão voltar, Título, Descrição, Badge de fonte verificada ("Khan Academy Brasil"), Prévia de vídeo/áudio com player demonstrativo, Grid de metadados (Formato, Duração, Nível, Idioma, Avaliação), Tags de assuntos, Botões "Estudar agora", "Acessar original" e "Salvar".
6. **Meus Materiais** (`/biblioteca`): Busca interna, Abas de filtro (Todos 18, Não iniciados, Em andamento, Concluídos, Favoritos), Grade de cards com barra de progresso individual, percentual e ação de favoritar.
7. **Analisador de Edital** (`/edital`): Upload drag & drop para PDF com barra de progresso e status simulado ("edital-banco-do-brasil-2026.pdf"), Aviso de segurança/revisão, Cards de resumo extraído (Processo, Organizadora, Cargo, Data), Lista expansível de disciplinas identificadas com peso/questões e tópicos, Botões de gerar objetivo e encontrar materiais.
8. **Estatísticas** (`/estatisticas`): Filtros de período (7 dias, 30 dias, 90 dias, Personalizado), 4 cards de indicadores, Gráfico de barras de evolução semanal, Barras de tempo por disciplina, Tabela de histórico de sessões com status e filtros.
9. **Objetivos e Disciplinas** (`/objetivos`): Abas (Ativos, Arquivados, Todos), Grade de objetivos (ENEM 2027, Concurso Banco do Brasil, Faculdade, Aprender programação), Lista detalhada de disciplinas do objetivo selecionado com percentuais de avanço.
10. **Configurações** (`/configuracoes`): Dados do perfil do estudante (Marina Costa), Tema (Claro/Escuro/Sistema), Metas de estudo semanais e Notificações demonstrativas.
