/**
 * ==============================================================================
 * CONFIGURAÇÃO DE CHECKOUT EXTERNO - FACULDADE FEX EDUCAÇÃO
 * ==============================================================================
 * 
 * Link do produto principal (R$ 67): Diagnóstico Completo + Mini-Curso
 * O checkout externo conta com order bump para o Plano de Sucessão.
 * 
 * Retorno: Após o pagamento, o usuário deve retornar para o site FEX:
 * https://lowticketb2b.vercel.app/pos-compra/
 * que consulta a API e redireciona para https://lowticketb2b.vercel.app/area-do-cliente
 */
export const DIAGNOSTICO_CHECKOUT_URL = 'https://checkout.fexeducacao.com/pay/diagnostico-de-custo-pessoa-chave-curso-gestao-de-pessoas-chave';

export const RETURN_URL_FEX = 'https://lowticketb2b.vercel.app/pos-compra/';
export const AREA_CLIENTE_URL = 'https://lowticketb2b.vercel.app/area-do-cliente';

// Mantido para compatibilidade
export const CHECKOUT_URL_67 = DIAGNOSTICO_CHECKOUT_URL;
export const CHECKOUT_URL_97 = 'https://checkout.fexeducacao.com/pay/plano-de-sucessao-completo-mini-curso';

/**
 * Constrói a URL completa de checkout com os dados do comprador
 * e os parâmetros reais de retorno para o site FEX.
 */
export function buildCheckoutUrl(buyer?: {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
}): string {
  const params = new URLSearchParams();

  if (buyer?.name) params.set('name', buyer.name);
  if (buyer?.email) params.set('email', buyer.email);
  if (buyer?.phone) {
    const rawPhone = buyer.phone.replace(/\D/g, '');
    params.set('phone', rawPhone || buyer.phone);
  }
  if (buyer?.company) params.set('company', buyer.company);

  // Determinar URL de retorno dinâmica (preferindo Vercel ou origem atual)
  let returnTarget = RETURN_URL_FEX;
  if (typeof window !== 'undefined' && window.location?.origin) {
    if (window.location.origin.includes('vercel.app')) {
      returnTarget = `${window.location.origin}/pos-compra/`;
    }
  }

  // Parâmetros reconhecidos por checkouts (Guru e outros gateways)
  params.set('return_url', returnTarget);
  params.set('redirect_url', returnTarget);
  params.set('url_retorno', returnTarget);

  return `${DIAGNOSTICO_CHECKOUT_URL}?${params.toString()}`;
}
