export type AccessStatus = 
  | 'visitor'
  | 'diagnostic_pending'
  | 'diagnostic_paid'
  | 'diagnostic_completed'
  | 'succession_offer'
  | 'succession_paid'
  | 'succession_unlocked'
  | 'course_access';

export type SegmentoEmpresa = 
  | 'Industria'
  | 'Varejo/Comercio'
  | 'Servicos'
  | 'Tecnologia'
  | 'Saude'
  | 'Financeiro'
  | 'Agronegocio'
  | 'Educacao'
  | 'Construcao Civil'
  | 'Outro';

export type PorteEmpresa = 
  | 'Ate100'
  | '101a300'
  | '301a1000'
  | '1001a3000'
  | '3001ouMais';

export interface PerfilEmpresa {
  segmento: SegmentoEmpresa | null;
  segmentoOutro?: string;
  porte: PorteEmpresa | null;
}

export interface CargoCritico {
  id: string;
  nome: string;
  salarioMensal: number;
  criticidade: number; // 1 to 5
  dependencia: number; // 1 to 5
  reposicao: number;   // 1 to 5
}

export type ClassificacaoRisco = 'controlado' | 'relevante' | 'critico';

export interface CargoCalculado extends CargoCritico {
  indice: number; // criticidade * dependencia * reposicao (1 to 125)
  classificacao: ClassificacaoRisco;
  fatorTransicao: number; // 0.5 | 1.0 | 2.0
  custoTransicao: number;
  custoProdutividade: number;
  custoTotalCargo: number;
}

export interface DiagnosticoResultado {
  cargosCalculados: CargoCalculado[];
  custoTotal: number;
  nivelGeral: ClassificacaoRisco;
  mesesRampa: number;
  percentualPerda: number;
}

export interface LeadInfo {
  nome: string;
  email: string;
  whatsapp: string;
  empresa: string;
  cargo: string;
  lgpdAceito: boolean;
}

export interface TacitKnowledgeSelection {
  tecnico: string[];
  relacionamentos: string[];
  julgamento: string[];
  cultura: string[];
}

export interface PlanoFase {
  id: string;
  fase: number;
  titulo: string;
  periodo: string;
  objetivo: string;
  acoes: string[];
  responsavelSugerido: string;
  status: 'pendente' | 'em_andamento' | 'concluido';
}

export interface PlanoSucessao {
  empresa: string;
  cargoPrincipal: string;
  nivelPrioridade: 'URGENTE' | 'ALTA' | 'PREVENTIVA';
  fases: PlanoFase[];
  alertaEmocional: string;
  recomendacoesEstrategicas: string[];
  dataCriacao: string;
}

export interface VideoAula {
  id: string;
  numero?: string;
  titulo: string;
  duracao: string;
  youtubeId: string;
  vimeoId?: string;
  descricao: string;
  concluida?: boolean;
}

export interface ModuloCurso {
  id: string;
  titulo: string;
  aulas: VideoAula[];
}

export interface AppState {
  accessStatus: AccessStatus;
  currentScreen: string;
  devMode: boolean;
  perfil: PerfilEmpresa;
  cargos: CargoCritico[];
  mesesRampa: number;
  percentualPerda: number;
  lead: LeadInfo;
  conhecimentoTacito: TacitKnowledgeSelection;
  resultado: DiagnosticoResultado | null;
  planoSucessao: PlanoSucessao | null;
  cursoProgresso: Record<string, boolean>;
}
