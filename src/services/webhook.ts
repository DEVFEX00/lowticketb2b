import { LeadInfo, DiagnosticoResultado, PerfilEmpresa } from '../types';
import { formatarMoeda } from '../utils/calculations';
import { CHECKOUT_URL_67 } from '../components/CheckoutModal';

export const N8N_WEBHOOK_URL = 'https://n8n.fexeducacao.com/webhook/funil-low-ticket-b2b-nhDmfQs0ldjOuxwe';

export const PORTE_LABELS: Record<string, string> = {
  Ate100: 'Até 100 colaboradores',
  '101a300': '101 a 300 colaboradores',
  '301a1000': '301 a 1000 colaboradores',
  '1001a3000': '1001 a 3000 colaboradores',
  '3001ouMais': '3001 ou mais colaboradores'
};

export function getPorteLabel(porte?: string | null): string {
  if (!porte) return '';
  return PORTE_LABELS[porte] || porte;
}

export interface SendLeadWebhookOptions {
  lead: LeadInfo;
  resultado?: DiagnosticoResultado | null;
  perfil?: PerfilEmpresa | null;
  etapaOrigem?: string;
  extraData?: Record<string, any>;
}

/**
 * Dispatches initial company profile (segment and number of employees) from the first screen to n8n
 */
export async function sendPerfilInitialToN8n(perfil: PerfilEmpresa): Promise<void> {
  const segmentoEfetivo = perfil?.segmento === 'Outro'
    ? (perfil?.segmentoOutro?.trim() || 'Outro')
    : (perfil?.segmento || '');
  const faixaColaboradores = getPorteLabel(perfil?.porte);

  const payload = {
    event: 'diagnostico_etapa_1_perfil_concluido',
    funil: 'funil-low-ticket-b2b',
    etapa: 'perfil_empresa_etapa_1',

    // Initial business segmentation
    segmento: segmentoEfetivo,
    segmentoEmpresa: segmentoEfetivo,
    segmentoOutro: perfil?.segmentoOutro?.trim() || '',
    porte: perfil?.porte || '',
    porteEmpresa: perfil?.porte || '',
    numeroColaboradores: faixaColaboradores,
    faixaColaboradores: faixaColaboradores,
    colaboradores: faixaColaboradores,

    // Timestamps and browser metadata
    dataHoraFormatada: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    timestamp: new Date().toISOString(),
    origemUrl: typeof window !== 'undefined' ? window.location.href : '',

    perfil
  };

  try {
    fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(() => {});
  } catch {}
}

/**
 * Dispatches lead data, initial company profile, and diagnostic calculation to the n8n webhook before checkout.
 * Resilient implementation with timeout fail-safe to guarantee user flow is never blocked.
 */
export async function sendLeadToN8n(options: SendLeadWebhookOptions): Promise<{ success: boolean; error?: string }> {
  const { lead, resultado, perfil, etapaOrigem = 'diagnostico_pre_checkout', extraData = {} } = options;

  // Build target checkout URL with pre-filled query params
  const checkoutParams = new URLSearchParams();
  if (lead.nome) checkoutParams.set('name', lead.nome);
  if (lead.email) checkoutParams.set('email', lead.email);
  if (lead.whatsapp) checkoutParams.set('phone', lead.whatsapp);
  if (lead.empresa) checkoutParams.set('company', lead.empresa);
  const checkoutUrlCompleto = `${CHECKOUT_URL_67}?${checkoutParams.toString()}`;

  const segmentoEfetivo = perfil?.segmento === 'Outro'
    ? (perfil?.segmentoOutro?.trim() || 'Outro')
    : (perfil?.segmento || '');
  const faixaColaboradores = getPorteLabel(perfil?.porte);

  const payload = {
    event: 'lead_captured_pre_checkout',
    funil: 'funil-low-ticket-b2b',
    etapa: etapaOrigem,
    
    // Flattened fields for easy access in n8n nodes (CRM, WhatsApp, Sheets)
    nome: lead.nome?.trim() || '',
    email: lead.email?.trim() || '',
    whatsapp: lead.whatsapp?.trim() || '',
    telefone: lead.whatsapp?.trim() || '',
    empresa: lead.empresa?.trim() || '',
    cargo: lead.cargo?.trim() || '',
    lgpdAceito: Boolean(lead.lgpdAceito),

    // Initial business profile from step 1 (Segment & Employee Count)
    segmento: segmentoEfetivo,
    segmentoEmpresa: segmentoEfetivo,
    segmentoOutro: perfil?.segmentoOutro?.trim() || '',
    porte: perfil?.porte || '',
    porteEmpresa: perfil?.porte || '',
    numeroColaboradores: faixaColaboradores,
    faixaColaboradores: faixaColaboradores,
    colaboradores: faixaColaboradores,

    // Commercial & Diagnostic Data
    produto: 'diagnostico_67',
    nomeProduto: 'Diagnóstico de Custo e Risco de Pessoa-Chave + Curso',
    valor: 67.0,
    moeda: 'BRL',
    checkoutUrl: checkoutUrlCompleto,

    // Financial calculations
    custoTotal: resultado?.custoTotal || 0,
    custoTotalFormatado: formatarMoeda(resultado?.custoTotal || 0),
    nivelGeral: resultado?.nivelGeral || 'Moderado',
    mesesRampa: resultado?.mesesRampa || 6,
    percentualPerda: resultado?.percentualPerda || 40,
    cargosAvaliados: (resultado?.cargosCalculados || []).map((c: any) => c.nome || c.cargo || 'Cargo'),

    // Timestamps and browser metadata
    dataHoraFormatada: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    timestamp: new Date().toISOString(),
    origemUrl: typeof window !== 'undefined' ? window.location.href : '',

    // Full nested structures for advanced processing
    lead,
    perfil: perfil || null,
    diagnostico: resultado || null,
    ...extraData
  };

  console.log('[FEX n8n Webhook] Enviando lead para o webhook:', N8N_WEBHOOK_URL, payload);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500); // 4.5s safe timeout

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[FEX n8n Webhook] Servidor retornou status ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }

    console.log('[FEX n8n Webhook] Lead enviado com sucesso ao n8n!');
    return { success: true };
  } catch (err: any) {
    // Fail-safe: don't break the user experience if n8n has network issues or CORS restrictions
    console.warn('[FEX n8n Webhook] Erro ao enviar webhook (prosseguindo com checkout):', err?.message || err);
    return { success: false, error: err?.message || 'Network error' };
  }
}
