/** Dados fictícios (mock) do Analisador de Edital e das Estatísticas — Study Manager
 *  Fonte: especificações dos Frames 8 e 9 de UX/study-manager.pen
 */

/* ================= Analisador de Edital (/edital) ================= */

export const editalExampleFile = "edital-banco-do-brasil-2026.pdf";
export const editalExampleMeta = "3,4 MB • 82 páginas";

export interface EtlSummaryCard {
  label: string;
  value: string;
}

export const editalSummary: EtlSummaryCard[] = [
  { label: "Processo seletivo", value: "Banco do Brasil 2026" },
  { label: "Organizadora", value: "Fundação Cesgranrio" },
  { label: "Cargo", value: "Escriturário – Agente Comercial" },
  { label: "Data da prova", value: "15 de março de 2026" },
];

export interface EtlDiscipline {
  name: string;
  description: string;
  questions: number;
  topics: string[];
}

export const editalDisciplines: EtlDiscipline[] = [
  {
    name: "Língua Portuguesa",
    description: "Interpretação de texto, gramática e redação oficial",
    questions: 15,
    topics: ["Interpretação de texto", "Gramática normativa", "Redação oficial", "Pontuação e regência"],
  },
  {
    name: "Matemática Financeira",
    description: "Juros simples e compostos, porcentagem e séries",
    questions: 10,
    topics: ["Juros simples e compostos", "Porcentagem", "Progressões", "Descontos e inflação"],
  },
  {
    name: "Conhecimentos Bancários",
    description: "SFN, produtos bancários e compliance",
    questions: 20,
    topics: ["Sistema Financeiro Nacional", "Produtos bancários", "Compliance e PLD", "Inclusive inovação"],
  },
  {
    name: "Informática",
    description: "Segurança, pacote Office e internet",
    questions: 10,
    topics: ["Segurança da informação", "Pacote Office", "Internet e redes básicas"],
  },
  {
    name: "Atualidades do Mercado Financeiro",
    description: "Fintechs, open banking e ESG",
    questions: 5,
    topics: ["Fintechs", "Open banking e Open Finance", "ESG e responsabilidade social"],
  },
  {
    name: "Atendimento Bancário",
    description: "Técnicas de vendas e relacionamento",
    questions: 10,
    topics: ["Técnicas de vendas", "Qualidade no atendimento", "Gestão de conflitos"],
  },
];

/* ================= Estatísticas (/estatisticas) ================= */

export type StatsPeriod = "7d" | "30d" | "90d" | "custom";

export interface StatsMetric {
  label: string;
  value: string;
  hint: string;
  hintPositive?: boolean;
}

export const statsMetrics: Record<StatsPeriod, StatsMetric[]> = {
  "7d": [
    { label: "Total estudado", value: "16h 05min", hint: "+8% vs. semana anterior", hintPositive: true },
    { label: "Média diária", value: "2h 17min", hint: "meta diária: 2h 30min" },
    { label: "Metas cumpridas", value: "71%", hint: "5 de 7 dias planejados" },
    { label: "Frequência", value: "6 dias", hint: "consistência em alta" },
  ],
  "30d": [
    { label: "Total estudado", value: "32h 40min", hint: "+12% vs. período anterior", hintPositive: true },
    { label: "Média diária", value: "2h 45min", hint: "meta: 2h 30min", hintPositive: true },
    { label: "Metas cumpridas", value: "88%", hint: "7 de 8 semanas" },
    { label: "Frequência", value: "19 dias", hint: "consistência alta" },
  ],
  "90d": [
    { label: "Total estudado", value: "96h 40min", hint: "+18% vs. trimestre anterior", hintPositive: true },
    { label: "Média diária", value: "3h 05min", hint: "meta diária: 2h 30min", hintPositive: true },
    { label: "Metas cumpridas", value: "82%", hint: "31 de 38 semanas planejadas" },
    { label: "Frequência", value: "62 dias", hint: "consistência recorde" },
  ],
  custom: [
    { label: "Total estudado", value: "32h 40min", hint: "período personalizado selecionado" },
    { label: "Média diária", value: "2h 45min", hint: "média do período" },
    { label: "Metas cumpridas", value: "88%", hint: "semanas completas no intervalo" },
    { label: "Frequência", value: "19 dias", hint: "dias com sessões registradas" },
  ],
};

export interface StatsBar {
  label: string;
  minutes: number;
}

/** Evolução semanal: S1, S2, S3, S4, Atual (Frame 9) */
export const statsBars: Record<StatsPeriod, StatsBar[]> = {
  "7d": [
    { label: "Seg", minutes: 130 },
    { label: "Ter", minutes: 80 },
    { label: "Qua", minutes: 185 },
    { label: "Qui", minutes: 110 },
    { label: "Sex", minutes: 210 },
    { label: "Sáb", minutes: 155 },
    { label: "Dom", minutes: 95 },
  ],
  "30d": [
    { label: "S1", minutes: 385 },
    { label: "S2", minutes: 452 },
    { label: "S3", minutes: 516 },
    { label: "S4", minutes: 487 },
    { label: "Atual", minutes: 615 },
  ],
  "90d": [
    { label: "M1", minutes: 540 },
    { label: "M2", minutes: 610 },
    { label: "M3", minutes: 700 },
    { label: "Atual", minutes: 940 },
  ],
  custom: [
    { label: "S1", minutes: 385 },
    { label: "S2", minutes: 452 },
    { label: "S3", minutes: 516 },
    { label: "S4", minutes: 487 },
    { label: "Atual", minutes: 615 },
  ],
};

export interface DisciplineShare {
  name: string;
  hours: string;
  minutes: number;
  color: string;
}

export const disciplineShares: Record<StatsPeriod, DisciplineShare[]> = {
  "7d": [
    { name: "Matemática", hours: "3h 05min", minutes: 185, color: "#4F46E5" },
    { name: "Física", hours: "2h 00min", minutes: 120, color: "#0D9488" },
    { name: "Redação", hours: "1h 45min", minutes: 105, color: "#F43F5E" },
    { name: "Biologia", hours: "1h 05min", minutes: 65, color: "#16A34A" },
  ],
  "30d": [
    { name: "Matemática", hours: "6h 20min", minutes: 380, color: "#4F46E5" },
    { name: "Física", hours: "4h 10min", minutes: 250, color: "#0D9488" },
    { name: "Redação", hours: "3h 35min", minutes: 215, color: "#F43F5E" },
    { name: "Biologia", hours: "2h 15min", minutes: 135, color: "#16A34A" },
  ],
  "90d": [
    { name: "Matemática", hours: "19h 00min", minutes: 1140, color: "#4F46E5" },
    { name: "Física", hours: "12h 30min", minutes: 750, color: "#0D9488" },
    { name: "Redação", hours: "10h 45min", minutes: 645, color: "#F43F5E" },
    { name: "Biologia", hours: "6h 45min", minutes: 405, color: "#16A34A" },
  ],
  custom: [
    { name: "Matemática", hours: "6h 20min", minutes: 380, color: "#4F46E5" },
    { name: "Física", hours: "4h 10min", minutes: 250, color: "#0D9488" },
    { name: "Redação", hours: "3h 35min", minutes: 215, color: "#F43F5E" },
    { name: "Biologia", hours: "2h 15min", minutes: 135, color: "#16A34A" },
  ],
};

export interface HistoryRow {
  date: string;
  subject: string;
  objetivo: string;
  duration: string;
  status: "concluida" | "pausada" | "nao-iniciada";
}

export const statisticsHistory: HistoryRow[] = [
  { date: "14 out, 09:30", subject: "Cálculo II", objetivo: "ENEM 2027", duration: "1h 20min", status: "concluida" },
  { date: "13 out, 19:10", subject: "Física Moderna", objetivo: "ENEM 2027", duration: "52 min", status: "concluida" },
  { date: "12 out, 16:00", subject: "Estruturas de Dados", objetivo: "Faculdade", duration: "1h 05min", status: "concluida" },
  { date: "11 out, 08:30", subject: "Química Orgânica", objetivo: "ENEM 2027", duration: "1h 45min", status: "concluida" },
  { date: "10 out, 14:20", subject: "Português / Redação", objetivo: "ENEM 2027", duration: "50 min", status: "concluida" },
];
