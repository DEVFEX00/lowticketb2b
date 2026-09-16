import { CargoCritico, CargoCalculado, ClassificacaoRisco, DiagnosticoResultado } from '../types';

export const SALARIO_MIN = 1000;
export const SALARIO_MAX = 150000;
export const SALARIO_STEP = 500;
export const SALARIO_PADRAO = 15000;

export const MESES_RAMPA_PADRAO = 6;
export const PERCENTUAL_PERDA_PADRAO = 0.40;

export function classificarIndice(indice: number): ClassificacaoRisco {
  if (indice <= 27) return 'controlado';
  if (indice <= 63) return 'relevante';
  return 'critico';
}

export function fatorTransicao(classificacao: ClassificacaoRisco): number {
  switch (classificacao) {
    case 'controlado': return 0.5;
    case 'relevante': return 1.0;
    case 'critico': return 2.0;
  }
}

export function calcularDiagnostico(
  cargos: CargoCritico[],
  mesesRampa: number = MESES_RAMPA_PADRAO,
  percentualPerda: number = PERCENTUAL_PERDA_PADRAO
): DiagnosticoResultado {
  const cargosCalculados: CargoCalculado[] = cargos.map(cargo => {
    const indice = cargo.criticidade * cargo.dependencia * cargo.reposicao;
    const classificacao = classificarIndice(indice);
    const fator = fatorTransicao(classificacao);

    const custoTransicao = cargo.salarioMensal * 12 * fator;
    const custoProdutividade = cargo.salarioMensal * mesesRampa * percentualPerda * 3;
    const custoTotalCargo = custoTransicao + custoProdutividade;

    return {
      ...cargo,
      indice,
      classificacao,
      fatorTransicao: fator,
      custoTransicao,
      custoProdutividade,
      custoTotalCargo
    };
  });

  const custoTotal = cargosCalculados.reduce((acc, c) => acc + c.custoTotalCargo, 0);

  const temCritico = cargosCalculados.some(c => c.classificacao === 'critico');
  const temRelevante = cargosCalculados.some(c => c.classificacao === 'relevante');
  const nivelGeral: ClassificacaoRisco = temCritico ? 'critico' : (temRelevante ? 'relevante' : 'controlado');

  return {
    cargosCalculados,
    custoTotal,
    nivelGeral,
    mesesRampa,
    percentualPerda
  };
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  });
}

export const LABEL_CLASSIFICACAO: Record<ClassificacaoRisco, string> = {
  controlado: 'Risco Controlado',
  relevante: 'Risco Relevante',
  critico: 'Risco Crítico'
};

export const DESCRICAO_CLASSIFICACAO: Record<ClassificacaoRisco, string> = {
  controlado: 'Conhecimento com registros parciais e reposição viável em curto prazo. Demanda manutenção preventiva.',
  relevante: 'Gargalo significativo: perda causaria atrito operacional relevante e desaceleração de metas.',
  critico: 'Vulnerabilidade severa: o conhecimento reside quase exclusivamente na pessoa-chave. Perda causaria crise operacional e prejuízo imediato.'
};
