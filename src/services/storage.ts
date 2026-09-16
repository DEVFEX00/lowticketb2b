import { AppState, AccessStatus } from '../types';
import { CARGOS_EXEMPLO_FEX, MODULOS_MINI_CURSO, gerarPlanoPersonalizado } from '../data/mockDefaults';
import { calcularDiagnostico, SALARIO_PADRAO, MESES_RAMPA_PADRAO, PERCENTUAL_PERDA_PADRAO } from '../utils/calculations';

const STORAGE_KEY = 'fex_educacao_plataforma_prod_v3';
const LEGACY_STORAGE_KEY = 'fex_educacao_plataforma_state_v1';
const PREV_STORAGE_KEY = 'fex_educacao_plataforma_prod_v2';

export const INITIAL_STATE: AppState = {
  accessStatus: 'visitor',
  currentScreen: 'intro', // 'intro' | 'perfil' | 'cargos' | 'calculando' | 'resultado' | 'raiox' | 'upsell' | 'plano' | 'curso' | 'hub'
  devMode: false,
  perfil: {
    segmento: null,
    segmentoOutro: '',
    porte: null
  },
  cargos: [],
  mesesRampa: MESES_RAMPA_PADRAO,
  percentualPerda: PERCENTUAL_PERDA_PADRAO,
  lead: {
    nome: '',
    email: '',
    whatsapp: '',
    empresa: '',
    cargo: '',
    lgpdAceito: false
  },
  conhecimentoTacito: {
    tecnico: [],
    relacionamentos: [],
    julgamento: [],
    cultura: []
  },
  resultado: null,
  planoSucessao: null,
  cursoProgresso: {}
};

export function loadSavedState(): AppState {
  try {
    // Clear legacy test data from earlier simulator/demo versions
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.removeItem(PREV_STORAGE_KEY);
      localStorage.removeItem('fex_dev_mode');
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw);

    // If previously saved with demo or simulator flags, start fresh
    if (parsed.devMode) {
      localStorage.removeItem(STORAGE_KEY);
      return INITIAL_STATE;
    }

    // Filter out any ghost/dummy cargos with empty names or 'c-init'
    if (parsed.cargos && Array.isArray(parsed.cargos)) {
      parsed.cargos = parsed.cargos.filter(
        (c: any) => c && typeof c.nome === 'string' && c.nome.trim().length > 0 && c.id !== 'c-init'
      );
    }

    return { ...INITIAL_STATE, ...parsed };
  } catch (err) {
    console.warn('[FEX Storage] Falha ao carregar estado local, usando padrão:', err);
    return INITIAL_STATE;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('[FEX Storage] Erro ao salvar estado local:', err);
  }
}

export function resetState(): AppState {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // Ignore
  }
  return { ...INITIAL_STATE };
}

export function seedDemoState(status: AccessStatus): AppState {
  const cargos = [...CARGOS_EXEMPLO_FEX];
  const resultado = calcularDiagnostico(cargos, 8, 0.35);
  const tacit = {
    tecnico: ['Método próprio de trabalho', 'Histórico de decisões e porquês'],
    relacionamentos: ['Clientes-chave que confiam exclusivamente nele(a)', 'Fornecedores estratégicos e negociações especiais'],
    julgamento: ['Precifica ou negocia no feeling calibrado por anos', 'Sabe o que fazer quando o processo oficial falha'],
    cultura: ['Guarda a história, memória e valores da área']
  };

  const lead = {
    nome: 'Carlos Eduardo Mendes',
    email: 'carlos.mendes@empresa.com.br',
    whatsapp: '(11) 98765-4321',
    empresa: 'Grupo Vanguarda Industrial',
    cargo: 'Diretor de Operações / Sócio',
    lgpdAceito: true
  };

  const plano = gerarPlanoPersonalizado(lead.empresa, resultado, tacit);

  let currentScreen = 'intro';
  if (status === 'diagnostic_paid') currentScreen = 'cargos';
  if (status === 'diagnostic_completed') currentScreen = 'resultado';
  if (status === 'succession_offer') currentScreen = 'upsell';
  if (status === 'succession_unlocked') currentScreen = 'plano';
  if (status === 'course_access') currentScreen = 'curso';

  const demoState: AppState = {
    accessStatus: status,
    currentScreen,
    devMode: true,
    perfil: {
      segmento: 'Industria',
      segmentoOutro: '',
      porte: '301a1000'
    },
    cargos,
    mesesRampa: 8,
    percentualPerda: 0.35,
    lead,
    conhecimentoTacito: tacit,
    resultado,
    planoSucessao: plano,
    cursoProgresso: {
      'aula-01': true
    }
  };

  saveState(demoState);
  return demoState;
}
