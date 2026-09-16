import { CargoCritico, ModuloCurso, VideoAula, PlanoSucessao, DiagnosticoResultado, TacitKnowledgeSelection } from '../types';

export const CHIPS_CONHECIMENTO = {
  tecnico: [
    'Método próprio de trabalho',
    'Domínio de sistema ou máquina específica',
    'Histórico de decisões e porquês',
    'Normas e conformidade na prática',
    'Arquitetura de soluções e banco de dados',
    'Segredos operacionais não documentados'
  ],
  relacionamentos: [
    'Clientes-chave que confiam exclusivamente nele(a)',
    'Fornecedores estratégicos e negociações especiais',
    'Rede interna de influência e pontes entre setores',
    'Órgãos reguladores, auditores e parceiros institucionais'
  ],
  julgamento: [
    'Sabe o que fazer quando o processo oficial falha',
    'Precifica ou negocia no feeling calibrado por anos',
    'Prevê problemas e gargalos antes de acontecerem',
    'Critérios intuitivos de aprovação e qualidade'
  ],
  cultura: [
    'É referência absoluta de postura para o time',
    'Guarda a história, memória e valores da área',
    'Facilitador de conflitos e guardião de rituais',
    'Inspiração de liderança informal'
  ]
};

export const CARGOS_EXEMPLO_FEX: CargoCritico[] = [
  {
    id: 'c1',
    nome: 'Diretor Comercial',
    salarioMensal: 28000,
    criticidade: 5,
    dependencia: 5,
    reposicao: 4
  },
  {
    id: 'c2',
    nome: 'Gerente Industrial & Operações',
    salarioMensal: 18500,
    criticidade: 4,
    dependencia: 4,
    reposicao: 3
  },
  {
    id: 'c3',
    nome: 'Arquiteto Chefe de Sistemas / TI',
    salarioMensal: 22000,
    criticidade: 5,
    dependencia: 5,
    reposicao: 5
  }
];

export const AULAS_FEX_MINICURSO: VideoAula[] = [
  {
    id: 'aula-01',
    numero: 'Aula 01',
    titulo: 'Aula 01: O Risco Invisível e a Anatomia da Dependência',
    duracao: '18 min',
    youtubeId: '7FKECFx0XsQ',
    descricao: 'Descubra como o conhecimento tácito fica concentrado em especialistas e os impactos ocultos no DRE e na operação da empresa.',
    concluida: false
  },
  {
    id: 'aula-02',
    numero: 'Aula 02',
    titulo: 'Aula 02: O Método Atitude Emocional® e a Barreira do Medo',
    duracao: '22 min',
    youtubeId: 'VJUMHHRCoYA',
    descricao: 'Como destravar a resistência do especialista à substituição, transformando-o em formador corporativo com status e reconhecimento.',
    concluida: false
  },
  {
    id: 'aula-03',
    numero: 'Aula 03',
    titulo: 'Aula 03: Entrevistas Guiadas e Construção do Manual Vivo',
    duracao: '20 min',
    youtubeId: 'BtEAolgWot8',
    descricao: 'Metodologia prática para externalizar decisões críticas, exceções e regras não documentadas sem burocracia.',
    concluida: false
  },
  {
    id: 'aula-04',
    numero: 'Aula 04',
    titulo: 'Aula 04: Executando a Sucessão em 90 Dias e Governança',
    duracao: '25 min',
    youtubeId: 'Utd8tKEUEBY',
    descricao: 'Etapas de mentoria, sombreamento supervisionado, testes de autonomia em campo e consolidação definitiva da governança.',
    concluida: false
  }
];

export const MODULOS_MINI_CURSO: ModuloCurso[] = [
  {
    id: 'mod-1',
    titulo: 'Mini-Curso: Gestão de Conhecimento e Sucessão de Pessoas-Chave',
    aulas: AULAS_FEX_MINICURSO
  }
];

export function gerarPlanoPersonalizado(
  empresa: string,
  resultado: DiagnosticoResultado,
  tacit: TacitKnowledgeSelection
): PlanoSucessao {
  const cargoMaisCritico = resultado.cargosCalculados.length > 0 
    ? [...resultado.cargosCalculados].sort((a, b) => b.indice - a.indice)[0]
    : null;

  const nomeCargo = cargoMaisCritico ? cargoMaisCritico.nome : 'Cargos Estratégicos';
  const prioridade = resultado.nivelGeral === 'critico' 
    ? 'URGENTE' 
    : (resultado.nivelGeral === 'relevante' ? 'ALTA' : 'PREVENTIVA');

  const chipsCount = 
    (tacit.tecnico.length) + 
    (tacit.relacionamentos.length) + 
    (tacit.julgamento.length) + 
    (tacit.cultura.length);

  const acoesFase1 = [
    `Concluir inventário detalhado dos saberes tácitos do cargo de ${nomeCargo}.`,
    'Validar com a diretoria executiva a matriz FMEA de risco e a priorização dos sucessores imediatos.',
    'Definir o padrinho executivo e o comitê de governança do plano de continuidade.'
  ];

  if (tacit.relacionamentos.length > 0) {
    acoesFase1.push(`Mapear carteira de relacionamentos estratégicos (${tacit.relacionamentos.slice(0, 2).join(', ')}) para transição gradual.`);
  }

  const acoesFase2 = [
    `Iniciar rodadas quinzenais de 'Entrevistas de Externalização' com o titular de ${nomeCargo}.`,
    'Registrar casos críticos de falha, árvores de decisão em crises e heurísticas práticas de trabalho.',
    'Criar o primeiro Manual Vivo de Operação Estratégica, focado em julgamento e não apenas tarefas burocráticas.'
  ];

  if (tacit.tecnico.length > 0) {
    acoesFase2.push(`Documentar especificamente: ${tacit.tecnico.slice(0, 2).join(', ')}.`);
  }

  const acoesFase3 = [
    `Conduzir sessões estruturadas de 'Job Shadowing' (sombreamento) do sucessor com ${nomeCargo}.`,
    'Iniciar transferência de autoridade delegada para decisões táticas e reuniões de alinhamento.',
    'Aplicação do Método Atitude Emocional® para reconhecer o especialista como Professor Corporativo, garantindo status institucional.'
  ];

  if (tacit.julgamento.length > 0) {
    acoesFase3.push(`Treinar o sucessor na resolução de situações reais de julgamento: ${tacit.julgamento.slice(0, 2).join(', ')}.`);
  }

  const acoesFase4 = [
    'Simulações controladas: o sucessor assume a liderança por 15 dias corridos com o titular apenas em monitoramento passivo.',
    'Medição dos KPIs de produtividade e tempo de resposta sem intervenção do titular.',
    'Calibração de desvios e refinamento dos checklists estratégicos.'
  ];

  const acoesFase5 = [
    'Apresentação dos resultados de blindagem de conhecimento ao Conselho / Diretoria da ' + empresa + '.',
    'Homologação do sucessor no nível de autonomia operacional Nível 2 (Supervisionado) ou Nível 3 (Pleno).',
    'Expansão da metodologia de multiplicação corporativa da FEX para os demais cargos da organização.'
  ];

  return {
    empresa: empresa || 'Sua Empresa',
    cargoPrincipal: nomeCargo,
    nivelPrioridade: prioridade,
    fases: [
      {
        id: 'f1',
        fase: 1,
        titulo: 'Fase 1: Mapear e Priorizar',
        periodo: 'Dias 1 a 20',
        objetivo: 'Identificar a fundo o que só reside na cabeça da pessoa-chave e blindar a prioridade da diretoria.',
        acoes: acoesFase1,
        responsavelSugerido: 'DHO + Gestor Imediato',
        status: 'pendente'
      },
      {
        id: 'f2',
        fase: 2,
        titulo: 'Fase 2: Externalizar Conhecimento Tácito',
        periodo: 'Dias 21 a 45',
        objetivo: 'Transformar saberes intuitivos em metodologias acessíveis, registros de exceção e heurísticas de decisão.',
        acoes: acoesFase2,
        responsavelSugerido: 'DHO / Consultor FEX + Especialista',
        status: 'pendente'
      },
      {
        id: 'f3',
        fase: 3,
        titulo: 'Fase 3: Desenvolver Sucessores (Método Atitude Emocional®)',
        periodo: 'Dias 46 a 70',
        objetivo: 'Capacitar potenciais substitutos com status e acolhimento emocional, sem que o titular se sinta ameaçado.',
        acoes: acoesFase3,
        responsavelSugerido: 'Pessoa-Chave + Sucessor(es)',
        status: 'pendente'
      },
      {
        id: 'f4',
        fase: 4,
        titulo: 'Fase 4: Validar e Testar em Campo',
        periodo: 'Dias 71 a 85',
        objetivo: 'Testar a autonomia real do sucessor em cenário prático de tomada de decisão independente.',
        acoes: acoesFase4,
        responsavelSugerido: 'Sucessor + Comitê de Avaliação',
        status: 'pendente'
      },
      {
        id: 'f5',
        fase: 5,
        titulo: 'Fase 5: Consolidar Governança de Continuidade',
        periodo: 'Dias 86 a 90+',
        objetivo: 'Institucionalizar o processo e garantir que a empresa nunca mais fique refém de uma única memória individual.',
        acoes: acoesFase5,
        responsavelSugerido: 'Diretoria / DHO',
        status: 'pendente'
      }
    ],
    alertaEmocional: 'Existe uma barreira que nenhum software resolve: o medo. O profissional que documenta tudo sente que assina sua própria substituição. Por isso o Método Atitude Emocional® da Faculdade FEX Educação posiciona o especialista como Educador Corporativo com titulação e prestígio, revertendo ameaça em orgulho institucional.',
    recomendacoesEstrategicas: [
      `Foco imediato no cargo de ${nomeCargo}, cujo índice de risco é de ${cargoMaisCritico ? cargoMaisCritico.indice : 75} pontos.`,
      `Potencial de economia de até ${resultado.custoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em custos de ruptura.`,
      chipsCount > 0 ? `Atenção prioritária aos ${chipsCount} conhecimentos críticos mapeados no Raio-X.` : 'Estruturar o inventário de conhecimentos tácitos na primeira semana.'
    ],
    dataCriacao: new Date().toLocaleDateString('pt-BR')
  };
}
