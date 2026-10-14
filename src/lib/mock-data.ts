/** Dados fictícios (mock) do Dashboard — Study Manager
 *  Fonte: especificações do Frame 0 (Desktop) e Frame 13 (Mobile) de UX/study-manager.pen
 */

export interface DailyActivity {
  day: string;
  minutes: number;
}

/** Seg 2h10, Ter 1h20, Qua 3h05, Qui 1h50, Sex 3h30, Sáb 2h35, Dom 1h35 */
export const weeklyActivity: DailyActivity[] = [
  { day: "Seg", minutes: 130 },
  { day: "Ter", minutes: 80 },
  { day: "Qua", minutes: 185 },
  { day: "Qui", minutes: 110 },
  { day: "Sex", minutes: 210 },
  { day: "Sáb", minutes: 155 },
  { day: "Dom", minutes: 95 },
];

export const todayIndex = 2; // Qua

export type SessionStatus = "concluida" | "em-andamento" | "pausada" | "nao-iniciada";

export interface StudySession {
  subject: string;
  topic: string;
  when: string;
  mode: string;
  duration: string;
  status: SessionStatus;
  /** Cor do marcador lateral da matéria */
  marker: string;
}

export const recentSessions: StudySession[] = [
  {
    subject: "Cálculo II",
    topic: "Integrais por partes",
    when: "Hoje, 09:30",
    mode: "Foco profundo",
    duration: "1h 20min",
    status: "concluida",
    marker: "#4F46E5",
  },
  {
    subject: "Física Moderna",
    topic: "Efeito fotoelétrico",
    when: "Ontem, 19:10",
    mode: "Revisão ativa",
    duration: "52 min",
    status: "concluida",
    marker: "#0D9488",
  },
  {
    subject: "Estruturas de Dados",
    topic: "Árvores AVL",
    when: "Ontem, 16:00",
    mode: "Foco profundo",
    duration: "1h 05min",
    status: "concluida",
    marker: "#8B5CF6",
  },
];

export const upcomingSessions: StudySession[] = [
  {
    subject: "Física Moderna",
    topic: "Relatividade restrita",
    when: "Hoje, 19:00",
    mode: "Foco profundo",
    duration: "50 min",
    status: "nao-iniciada",
    marker: "#0D9488",
  },
  {
    subject: "Redação",
    topic: "Estrutura dissertativa-argumentativa",
    when: "Amanhã, 19:00",
    mode: "Foco profundo",
    duration: "50 min",
    status: "nao-iniciada",
    marker: "#F43F5E",
  },
];

export const dashboardMetrics = [
  { label: "Horas estudadas", value: "18h 40min", hint: "+12%", hintPositive: true },
  { label: "Sessões concluídas", value: "14", hint: "+3 esta semana", hintPositive: true },
  { label: "Sequência atual", value: "5 dias", hint: "Recorde pessoal", hintPositive: false },
  { label: "Foco médio", value: "94%", hint: "Alta concentração", hintPositive: false },
];

export const activeGoal = {
  title: "ENEM 2027",
  weeklyTarget: "Meta: 10h por semana",
  /** Rótulo da barra de progresso */
  progressLabel: "82% da meta semanal",
  progress: 82,
};

export const weeklyGoal = {
  done: "8h 12min",
  total: "de 10h",
  percent: 82,
  message: "Ótimo ritmo. Mantendo a média, você conclui a meta na quinta-feira.",
};

/** Distribuição do tempo por disciplina dentro da meta semanal */
export const goalDistribution = [
  { subject: "Mat", percent: 38, color: "#4F46E5" },
  { subject: "Fís", percent: 27, color: "#0D9488" },
  { subject: "Red", percent: 19, color: "#F43F5E" },
];

/* ================= Sessões de estudo (/estudo) ================= */

export interface ObjectiveNode {
  name: string;
  color: string;
  disciplines: Array<{
    name: string;
    topics: string[];
  }>;
}

/** Seletores dependentes do cronômetro: Objetivo > Disciplina > Assunto */
export const objectivesTree: ObjectiveNode[] = [
  {
    name: "ENEM 2027",
    color: "#4F46E5",
    disciplines: [
      { name: "Matemática", topics: ["Funções", "Trigonometria no triângulo retângulo"] },
      { name: "Física", topics: ["Cinemática média", "Leis de Newton"] },
      { name: "Redação", topics: ["Estrutura dissertativa-argumentativa"] },
      { name: "Biologia", topics: ["Genética mendeliana"] },
    ],
  },
  {
    name: "Concurso Banco do Brasil",
    color: "#0D9488",
    disciplines: [
      { name: "Raciocínio Lógico", topics: ["Proposições lógicas", "Variações de linguagem formal"] },
      { name: "Língua Portuguesa", topics: ["Crase", "Concordância verbal"] },
      { name: "Informática", topics: ["Segurança da informação"] },
    ],
  },
  {
    name: "Faculdade",
    color: "#8B5CF6",
    disciplines: [
      { name: "Cálculo II", topics: ["Integrais por partes"] },
      { name: "Estruturas de Dados", topics: ["Árvores AVL"] },
      { name: "Algoritmos", topics: ["Recursividade"] },
    ],
  },
];

export const studyHistory: StudySession[] = [

  {
    subject: "Cálculo II",
    topic: "Integrais por partes",
    when: "Hoje, 09:30",
    mode: "Foco profundo",
    duration: "1h 20min",
    status: "pausada",
    marker: "#8B5CF6",
  },
  {
    subject: "Física Moderna",
    topic: "Efeito fotoelétrico",
    when: "Ontem, 19:10",
    mode: "Revisão ativa",
    duration: "52 min",
    status: "concluida",
    marker: "#0D9488",
  },
  {
    subject: "Algoritmos",
    topic: "Recursividade",
    when: "Ontem, 14:00",
    mode: "Foco profundo",
    duration: "35 min",
    status: "concluida",
    marker: "#8B5CF6",
  },
  {
    subject: "Redação",
    topic: "Estrutura dissertativa-argumentativa",
    when: "Seg, 19:00",
    mode: "Foco profundo",
    duration: "50 min",
    status: "nao-iniciada",
    marker: "#F43F5E",
  },
];

/* ================= Meu planejamento (/planejamento) ================= */

export interface PlannedBlock {
  /** 0 = segunda-feira ... 6 = domingo */
  day: number;
  time: string;
  subject: string;
  topic: string;
  duration: string;
  color: string;
}

/** Seg 14 (mock do Frame 4) ... Dom 20 */
export const plannedBlocks: PlannedBlock[] = [
  { day: 0, time: "08:00", subject: "Matemática", topic: "Funções", duration: "50 min", color: "#4F46E5" },
  { day: 0, time: "19:00", subject: "Redação", topic: "Estrutura dissertativa-argumentativa", duration: "50 min", color: "#F43F5E" },
  { day: 1, time: "18:30", subject: "Física", topic: "Cinemática média", duration: "50 min", color: "#0D9488" },
  { day: 2, time: "08:00", subject: "Química", topic: "Estequiometria", duration: "50 min", color: "#F59E0B" },
  { day: 2, time: "20:00", subject: "Matemática", topic: "Trigonometria", duration: "50 min", color: "#4F46E5" },
  { day: 3, time: "17:30", subject: "Biologia", topic: "Genética mendeliana", duration: "50 min", color: "#16A34A" },
  { day: 4, time: "09:00", subject: "Revisão geral", topic: "Flashcards e resumos da semana", duration: "50 min", color: "#8B5CF6" },
  { day: 5, time: "09:00", subject: "Simulado", topic: "Prova completa ENEM", duration: "50 min", color: "#4F46E5" },
];

export const dayNames = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

/** Datas da semana de referência (mock do Frame 4: Seg 14 → Dom 20 de outubro) */
export const weekDates = [14, 15, 16, 17, 18, 19, 20];
export const todayDate = 14;

/** Metas de estudo por disciplina na semana */
export interface DisciplineGoal {
  subject: string;
  color: string;
  percent: number;
  detail: string;
}

export const disciplineGoals: DisciplineGoal[] = [
  { subject: "Matemática", color: "#4F46E5", percent: 80, detail: "3.2h / 4h" },
  { subject: "Física", color: "#0D9488", percent: 60, detail: "1.8h / 3h" },
  { subject: "Redação", color: "#F43F5E", percent: 75, detail: "1.5h / 2h" },
  { subject: "Biologia", color: "#16A34A", percent: 60, detail: "1.2h / 2h" },
];

/* ================= Objetivos e disciplinas (/objetivos) ================= */

export interface Goal {
  id: string;
  title: string;
  description: string;
  status: "ativo" | "arquivado";
  progress: number;
  target: string;
  disciplinesCount: number;
  materials: number;
  color: string;
  disciplines: Array<{
    name: string;
    percent: number;
    topics: number;
    materials: number;
  }>;
}

export const goalsData: Goal[] = [
  {
    id: "enem-2027",
    title: "ENEM 2027",
    description: "Instituto Federal — Medicina",
    status: "ativo",
    progress: 42,
    target: "Nov 2027",
    disciplinesCount: 8,
    materials: 24,
    color: "#4F46E5",
    disciplines: [
      { name: "Matemática", percent: 58, topics: 18, materials: 6 },
      { name: "Linguagens", percent: 44, topics: 14, materials: 5 },
      { name: "Ciências da Natureza", percent: 36, topics: 12, materials: 5 },
      { name: "Ciências Humanas", percent: 28, topics: 10, materials: 4 },
      { name: "Redação", percent: 80, topics: 6, materials: 4 },
    ],
  },
  {
    id: "concurso-bb",
    title: "Concurso Banco do Brasil",
    description: "Agente Comercial — Banca Cesgranrio",
    status: "ativo",
    progress: 28,
    target: "Mar 2026",
    disciplinesCount: 6,
    materials: 9,
    color: "#0D9488",
    disciplines: [
      { name: "Raciocínio Lógico", percent: 22, topics: 12, materials: 3 },
      { name: "Língua Portuguesa", percent: 35, topics: 16, materials: 4 },
      { name: "Informática", percent: 10, topics: 8, materials: 2 },
    ],
  },
  {
    id: "faculdade",
    title: "Faculdade",
    description: "Ciência da Computação — 5º período",
    status: "ativo",
    progress: 64,
    target: "Dez 2026",
    disciplinesCount: 5,
    materials: 8,
    color: "#8B5CF6",
    disciplines: [
      { name: "Cálculo II", percent: 42, topics: 10, materials: 3 },
      { name: "Estruturas de Dados", percent: 28, topics: 9, materials: 3 },
      { name: "Algoritmos", percent: 20, topics: 12, materials: 2 },
    ],
  },
  {
    id: "programacao",
    title: "Aprender programação",
    description: "Jornada full-stack com projetos",
    status: "arquivado",
    progress: 35,
    target: "Sem prazo",
    disciplinesCount: 4,
    materials: 5,
    color: "#F43F5E",
    disciplines: [
      { name: "JavaScript", percent: 55, topics: 15, materials: 2 },
      { name: "TypeScript", percent: 30, topics: 9, materials: 2 },
      { name: "React", percent: 10, topics: 8, materials: 1 },
    ],
  },
];

/* ================= Explorar / Biblioteca (Frames 5, 6, 7, 15) ================= */

export type MaterialType = "video" | "article" | "pdf" | "course";

export interface Material {
  id: string;
  title: string;
  description: string;
  type: MaterialType;
  source: string;
  verified?: boolean;
  /** minutos para filtros de duração */
  minutes: number;
  duration: string;
  level: "Iniciante" | "Intermediário" | "Avançado";
  language: "Português" | "Inglês";
  rating: string;
  subjects: string[];
  discipline: string;
  format: string;
  url: string;
}

export const typeLabel: Record<MaterialType, string> = {
  video: "Vídeo",
  article: "Artigo",
  pdf: "PDF",
  course: "Curso",
};

export const disciplinesCatalog = [
  { name: "Matemática", count: 248, color: "#4F46E5" },
  { name: "Física", count: 182, color: "#0D9488" },
  { name: "Química", count: 156, color: "#F59E0B" },
  { name: "Biologia", count: 139, color: "#16A34A" },
  { name: "Português", count: 204, color: "#F43F5E" },
  { name: "História", count: 118, color: "#8B5CF6" },
  { name: "Programação", count: 321, color: "#3B82F6" },
];

export const materialsData: Material[] = [
  {
    id: "funcoes-quadraticas-khan",
    title: "Funções quadráticas do zero ao avançado",
    description:
      "Curso completo com resoluções comentadas: vértice, parabólica, raízes e aplicações em prova do ENEM. Inclui listas de exercícios com gabarito e desafios por nível de dificuldade.",
    type: "course",
    source: "Khan Academy Brasil",
    verified: true,
    minutes: 135,
    duration: "2h 15min",
    level: "Intermediário",
    language: "Português",
    rating: "4,8 de 5",
    subjects: ["Funções", "Álgebra", "ENEM"],
    discipline: "Matemática",
    format: "Curso em vídeo",
    url: "https://pt.khanacademy.org",
  },
  {
    id: "leis-de-newton-video",
    title: "Leis de Newton na prática",
    description:
      "Aula traz exemplos reais dos três princípios da mecânica clássica: inércia, F=ma e ação/reação, com experimentos demonstrados em laboratório.",
    type: "video",
    source: "Física Completão",
    minutes: 50,
    duration: "50 min",
    level: "Iniciante",
    language: "Português",
    rating: "4,7 de 5",
    subjects: ["Mecânica", "Dinâmica"],
    discipline: "Física",
    format: "Videoaula",
    url: "https://exemplo.org/fisica-newton",
  },
  {
    id: "guia-crase",
    title: "Guia definitivo da Crase",
    description:
      "Artigo com as 12 regras essenciais da crase, casos especiais listados em tabelas e 30 exercícios de concursos anteriores com resolução passo a passo.",
    type: "article",
    source: "Técnicas de Língua",
    minutes: 15,
    duration: "15 min",
    level: "Intermediário",
    language: "Português",
    rating: "4,5 de 5",
    subjects: ["Gramática", "Concursos"],
    discipline: "Português",
    format: "Artigo em texto",
    url: "https://exemplo.org/crase",
  },
  {
    id: "curso-logica-programacao",
    title: "Lógica de programação do zero",
    description:
      "Do pseudocódigo aos primeiros projetos: variáveis, condicionais, laços e estruturas de dados básicas aplicadas em JavaScript puro.",
    type: "course",
    source: "Open Academy Projects",
    minutes: 720,
    duration: "12h",
    level: "Iniciante",
    language: "Português",
    rating: "4,9 de 5",
    subjects: ["JavaScript", "Algoritmos", "Lógica"],
    discipline: "Programação",
    format: "Curso em vídeo",
    url: "https://exemplo.org/logica-js",
  },
  {
    id: "resumo-genetica-pdf",
    title: "Resumo essencial de Genética",
    description:
      "Caderno em PDF com os mapeamentos de Mendel, cruzamentos-guia, heredogramas e mutações, incluindo quadros de fixação por tópico.",
    type: "pdf",
    source: "Biologia Enemática",
    verified: true,
    minutes: 45,
    duration: "45 min",
    level: "Intermediário",
    language: "Português",
    rating: "4,6 de 5",
    subjects: ["Genética", "Hereditariedade"],
    discipline: "Biologia",
    format: "Material em PDF",
    url: "https://exemplo.org/genetica.pdf",
  },
  {
    id: "revolucao-industrial-video",
    title: "Revolução Industrial em 35 minutos",
    description:
      "Síntese narrada das duas fases da Revolução Industrial, com foco nos múltiplos vetores exigidos nas provas: transições técnicas e impactos sociais.",
    type: "video",
    source: "História em Evidência",
    minutes: 35,
    duration: "35 min",
    level: "Iniciante",
    language: "Português",
    rating: "4,4 de 5",
    subjects: ["Idade Contemporânea", "Economia"],
    discipline: "História",
    format: "Videoaula",
    url: "https://exemplo.org/rev-industrial",
  },
  {
    id: "variacoes-linguisticas",
    title: "Variações linguísticas e socioidentidades",
    description:
      "Artigo sobre as múltiplas variantes faladas no Brasil e como interpretá-las nas provas de Linguagens, com exemplos reais de contexto cultural.",
    type: "article",
    source: "Linguagem Viva",
    minutes: 20,
    duration: "20 min",
    level: "Iniciante",
    language: "Português",
    rating: "4,3 de 5",
    subjects: ["Sociolinguística", "Variação"],
    discipline: "Português",
    format: "Artigo em texto",
    url: "https://exemplo.org/var-ling",
  },
  {
    id: "estequiometria-video",
    title: "Estequiometria passo a passo",
    description:
      "Cinco problemas resolvidos ao vivo, de mol até rendimento e excesso, com macetes para não errar nas contas em prova.",
    type: "video",
    source: "Química Essencial",
    minutes: 60,
    duration: "1h",
    level: "Avançado",
    language: "Inglês",
    rating: "4,5 de 5",
    subjects: ["Balanceamento", "Mol"],
    discipline: "Química",
    format: "Videoaula",
    url: "https://exemplo.org/est",
  },
  {
    id: "redacao-modelo-pdf",
    title: "Repertório e modelo de redação nota 1000",
    description:
      "PDF com estrutura dissertativa-argumentativa detalhada, banco de repertórios atualizado (filosofia, sociedade e tecnologia) e 5 modelos comentados.",
    type: "pdf",
    source: "Plataforma Margem",
    minutes: 20,
    duration: "20 min",
    level: "Intermediário",
    language: "Português",
    rating: "4,7 de 5",
    subjects: ["Dissertativo", "Repertório", "ENEM"],
    discipline: "Português",
    format: "Material em PDF",
    url: "https://exemplo.org/red.pdf",
  },
  {
    id: "cinematica-en-video",
    title: "Kinematics crash course",
    description:
      "Fast-paced overview of 1D and 2D motion: position, velocity, acceleration and projectile motion with 5 worked exam problems.",
    type: "course",
    source: "MIT Opencourse",
    verified: true,
    minutes: 100,
    duration: "1h 40min",
    level: "Avançado",
    language: "Inglês",
    rating: "4,9 de 5",
    subjects: ["Motion", "Exam prep"],
    discipline: "Física",
    format: "Curso em vídeo",
    url: "https://ocw.mit.edu",
  },
  {
    id: "pandemias-historia",
    title: "Pandemics that changed history",
    description:
      "Long-read article connecting plague, spanish flu and COVID-19 to social and economic transformations often tested on exams.",
    type: "article",
    source: "World History Weekly",
    minutes: 25,
    duration: "25 min",
    level: "Intermediário",
    language: "Inglês",
    rating: "4,2 de 5",
    subjects: ["History", "Health policy"],
    discipline: "História",
    format: "Artigo de notícias",
    url: "https://exemplo.org/pandemics",
  },
  {
    id: "trigonometria-curso",
    title: "Trigonometria no triângulo retângulo",
    description:
      "Série de aulas com seno, cosseno e tangente aplicados em problemas de prova, trajetos de alturas e ângulos de depressão, com listas para fixação.",
    type: "course",
    source: "Khan Academy Brasil",
    verified: true,
    minutes: 90,
    duration: "1h 30min",
    level: "Iniciante",
    language: "Português",
    rating: "4,8 de 5",
    subjects: ["Trigonometria", "Geometria", "ENEM"],
    discipline: "Matemática",
    format: "Curso em vídeo",
    url: "https://pt.khanacademy.org/trigonometria",
  },
  {
    id: "mol-solucoes-video",
    title: "Mol e soluções: do básico ao avançado",
    description:
      "Aula que conecta conceito de mol, concentração e diluição, com 8 exercícios resolvidos de bancas variadas e dicas de aproximação rápida.",
    type: "video",
    source: "Química Essencial",
    minutes: 40,
    duration: "40 min",
    level: "Intermediário",
    language: "Português",
    rating: "4,5 de 5",
    subjects: ["Soluções", "Mol"],
    discipline: "Química",
    format: "Videoaula",
    url: "https://exemplo.org/mol",
  },
  {
    id: "modernismo-literatura",
    title: "Literatura: Semana de Modernismo",
    description:
      "Artigo-guia com o contexto da Semana de Arte Moderna, principais autores, obras recorrentes nas provas e como citá-las na redação.",
    type: "article",
    source: "Linguagem Viva",
    minutes: 18,
    duration: "18 min",
    level: "Iniciante",
    language: "Português",
    rating: "4,4 de 5",
    subjects: ["Literatura", "Modernismo"],
    discipline: "Português",
    format: "Artigo em texto",
    url: "https://exemplo.org/modernismo",
  },
  {
    id: "era-vargas-video",
    title: "Era Vargas: do Estado Novo ao fim",
    description:
      "Panorama em vídeo dos governos Vargas: clássico leis trabalhistas, propaganda, centralização e o legado para os vestibulares.",
    type: "video",
    source: "História em Evidência",
    minutes: 55,
    duration: "55 min",
    level: "Intermediário",
    language: "Português",
    rating: "4,6 de 5",
    subjects: ["Era Vargas", "Política"],
    discipline: "História",
    format: "Videoaula",
    url: "https://exemplo.org/vargas",
  },
  {
    id: "eletrodinamica-pdf",
    title: "Fórmulas de Eletrodinâmica em uma página",
    description:
      "PDF de revisão relâmpago com circuitos, Leis de Ohm,associações de resistores e potência, incluindo mnemônicos e exercícios-modelo.",
    type: "pdf",
    source: "Física Completão",
    minutes: 30,
    duration: "30 min",
    level: "Iniciante",
    language: "Português",
    rating: "4,3 de 5",
    subjects: ["Eletricidade", "Circuitos"],
    discipline: "Física",
    format: "Material em PDF",
    url: "https://exemplo.org/eletro.pdf",
  },
  {
    id: "python-intro-curso",
    title: "Introdução prática a Python",
    description:
      "Curso com setup de ambiente, tipos, funções e mini-projetos (rastreador de estudos) para quem está começando do zero absoluto.",
    type: "course",
    source: "Open Academy Projects",
    minutes: 300,
    duration: "5h",
    level: "Iniciante",
    language: "Português",
    rating: "4,8 de 5",
    subjects: ["Python", "Projetos", "Lógica"],
    discipline: "Programação",
    format: "Curso em vídeo",
    url: "https://exemplo.org/python-intro",
  },
  {
    id: "ecologia-video",
    title: "Ecologia e sustentabilidade em prova",
    description:
      "Aula sobre cadeias e teias, ciclos biogeoquímicos e impactos ambientais, com foco nas questões interdisciplinares recentes do ENEM.",
    type: "video",
    source: "Biologia Enemática",
    verified: true,
    minutes: 48,
    duration: "48 min",
    level: "Intermediário",
    language: "Português",
    rating: "4,7 de 5",
    subjects: ["Ecologia", "Meio ambiente", "ENEM"],
    discipline: "Biologia",
    format: "Videoaula",
    url: "https://exemplo.org/ecologia",
  },
];

/* Biblioteca: 18 materiais salvos — Frame 7 ("Todos (18)") */
export type LibraryStatus = "nao-iniciado" | "em-andamento" | "concluido";

export interface LibraryItem {
  material: Material;
  status: LibraryStatus;
  progress: number;
  favorite: boolean;
}

export const libraryData: LibraryItem[] = [
  { material: materialsData[0], status: "em-andamento", progress: 65, favorite: true },
  { material: materialsData[1], status: "concluido", progress: 100, favorite: false },
  { material: materialsData[2], status: "em-andamento", progress: 40, favorite: false },
  { material: materialsData[3], status: "em-andamento", progress: 22, favorite: true },
  { material: materialsData[4], status: "nao-iniciado", progress: 0, favorite: false },
  { material: materialsData[5], status: "concluido", progress: 100, favorite: false },
  { material: materialsData[6], status: "nao-iniciado", progress: 0, favorite: false },
  { material: materialsData[7], status: "em-andamento", progress: 75, favorite: false },
  { material: materialsData[8], status: "em-andamento", progress: 55, favorite: true },
  { material: materialsData[9], status: "nao-iniciado", progress: 0, favorite: false },
  { material: materialsData[10], status: "concluido", progress: 100, favorite: false },
  { material: materialsData[11], status: "nao-iniciado", progress: 0, favorite: true },
  { material: materialsData[12], status: "concluido", progress: 100, favorite: false },
  { material: materialsData[13], status: "nao-iniciado", progress: 0, favorite: false },
  { material: materialsData[14], status: "em-andamento", progress: 30, favorite: false },
  { material: materialsData[15], status: "nao-iniciado", progress: 0, favorite: false },
  { material: materialsData[16], status: "em-andamento", progress: 12, favorite: false },
  { material: materialsData[17], status: "em-andamento", progress: 80, favorite: true },
];
