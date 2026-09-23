/**
 * ==============================================================================
 * CONFIGURAÇÃO CENTRALIZADA DE PRODUTOS - FACULDADE FEX EDUCAÇÃO
 * ==============================================================================
 */

export const PRODUCT_IDS = {
  DIAGNOSTICO_COMPLETO: 'DIAGNOSTICO_COMPLETO',
  MINI_CURSO: 'MINI_CURSO',
  PLANO_SUCESSAO: 'PLANO_SUCESSAO'
} as const;

export type ProductId = typeof PRODUCT_IDS[keyof typeof PRODUCT_IDS];

export interface ProductDefinition {
  id: ProductId;
  name: string;
  shortName: string;
  description: string;
  route: string;
  isOrderBump?: boolean;
}

export const PRODUCTS: Record<ProductId, ProductDefinition> = {
  DIAGNOSTICO_COMPLETO: {
    id: PRODUCT_IDS.DIAGNOSTICO_COMPLETO,
    name: 'Diagnóstico Completo de Custo da Pessoa-Chave',
    shortName: 'Diagnóstico Completo',
    description: 'Relatório executivo estruturado para diretoria, inventário de conhecimentos tácitos e exportação oficial.',
    route: '/diagnostico'
  },
  MINI_CURSO: {
    id: PRODUCT_IDS.MINI_CURSO,
    name: 'Curso: Gestão de Pessoas-Chave',
    shortName: 'Curso',
    description: '4 vídeo-aulas práticas ministradas pelos fundadores da Faculdade FEX Educação.',
    route: '/curso'
  },
  PLANO_SUCESSAO: {
    id: PRODUCT_IDS.PLANO_SUCESSAO,
    name: 'Plano de Sucessão de 90 Dias',
    shortName: 'Plano de Sucessão',
    description: 'Plano de ação cronológico estruturado em 5 fases para blindar a continuidade corporativa.',
    route: '/plano-de-sucessao',
    isOrderBump: true
  }
};
