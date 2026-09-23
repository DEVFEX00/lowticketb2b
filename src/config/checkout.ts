/**
 * ==============================================================================
 * CONFIGURAÇÃO DE CHECKOUT EXTERNO - DIGITAL MANAGER GURU / FEX EDUCAÇÃO
 * ==============================================================================
 * 
 * Link do produto principal (R$ 67): Diagnóstico Completo + Curso
 * Link do produto upsell/order bump (R$ 97): Plano de Sucessão Completo + Curso
 * 
 * Fluxo de retorno obrigatório:
 * Checkout Guru -> Página de Obrigado -> Redirecionamento Automático -> /pos-compra -> /area-do-cliente
 */

export const DIAGNOSTICO_CHECKOUT_URL = 'https://checkout.fexeducacao.com/pay/diagnostico-de-custo-pessoa-chave-curso-gestao-de-pessoas-chave';
export const CHECKOUT_URL_67 = DIAGNOSTICO_CHECKOUT_URL;
export const CHECKOUT_URL_97 = 'https://checkout.fexeducacao.com/pay/plano-de-sucessao-completo-mini-curso';

export const OFFICIAL_VERCEL_DOMAIN = 'https://lowticketb2b.vercel.app';
export const RETURN_URL_FEX = 'https://lowticketb2b.vercel.app/pos-compra';
export const AREA_CLIENTE_URL = 'https://lowticketb2b.vercel.app/area-do-cliente';

/**
 * Obtém a URL de retorno absoluta para o pós-compra
 */
export function getReturnUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/pos-compra`;
  }
  return RETURN_URL_FEX;
}

export interface CheckoutBuyerContext {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  productType?: 'diagnostic_67' | 'succession_97';
}

/**
 * Salva os dados do comprador no sessionStorage antes de redirecionar para o checkout
 * Isso garante recuperação imediata no retorno, mesmo se o gateway omitir query params.
 */
export function prepareCheckoutSession(buyer?: CheckoutBuyerContext): void {
  if (typeof window === 'undefined') return;
  try {
    const cleanEmail = (buyer?.email || '').toLowerCase().trim();
    const prodType = buyer?.productType || 'diagnostic_67';
    if (cleanEmail) {
      sessionStorage.setItem('fex_checkout_email', cleanEmail);
      sessionStorage.setItem('fex_current_email', cleanEmail);
      localStorage.setItem('fex_last_buyer_email', cleanEmail);
      localStorage.setItem('fex_checkout_email', cleanEmail);
    }
    if (buyer?.name) {
      sessionStorage.setItem('fex_checkout_name', buyer.name);
      localStorage.setItem('fex_checkout_name', buyer.name);
    }
    if (buyer) {
      sessionStorage.setItem('fex_checkout_buyer', JSON.stringify(buyer));
      localStorage.setItem('fex_checkout_buyer', JSON.stringify(buyer));
    }
    sessionStorage.setItem('fex_checkout_product', prodType);
    sessionStorage.setItem('fex_checkout_type', prodType);
    localStorage.setItem('fex_checkout_type', prodType);
    sessionStorage.setItem('fex_post_purchase_active', 'true');
    localStorage.setItem('fex_post_purchase_active', 'true');
    sessionStorage.setItem('fex_checkout_timestamp', Date.now().toString());
  } catch (err) {
    console.warn('[Checkout] Erro ao gravar contexto de sessão:', err);
  }
}

/**
 * Constrói a URL completa de checkout do Guru com parâmetros de pré-preenchimento
 * e parâmetros de retorno automático para o projeto.
 */
export function buildCheckoutUrl(
  buyer?: CheckoutBuyerContext,
  productType: 'diagnostic_67' | 'succession_97' = 'diagnostic_67'
): string {
  // 1. Salvar contexto no sessionStorage antes de deixar o domínio
  prepareCheckoutSession({ ...buyer, productType });

  const targetBaseUrl = productType === 'succession_97' ? CHECKOUT_URL_97 : CHECKOUT_URL_67;
  const returnTarget = getReturnUrl();

  const params = new URLSearchParams();

  // Dados do comprador para pré-preenchimento
  if (buyer?.name) {
    params.set('name', buyer.name);
    params.set('nome', buyer.name);
  }
  if (buyer?.email) {
    const cleanEmail = buyer.email.toLowerCase().trim();
    params.set('email', cleanEmail);
  }
  if (buyer?.phone) {
    const rawPhone = buyer.phone.replace(/\D/g, '');
    params.set('phone', rawPhone || buyer.phone);
    params.set('cellphone', rawPhone || buyer.phone);
  }
  if (buyer?.company) {
    params.set('company', buyer.company);
    params.set('empresa', buyer.company);
  }

  // Mecanismos de retorno reconhecidos pelo Guru e gateways
  params.set('return_url', returnTarget);
  params.set('redirect_url', returnTarget);
  params.set('url_retorno', returnTarget);
  params.set('callback_url', returnTarget);
  params.set('back_url', returnTarget);
  params.set('sck', 'fex_direct');

  const queryString = params.toString();
  return queryString ? `${targetBaseUrl}?${queryString}` : targetBaseUrl;
}

