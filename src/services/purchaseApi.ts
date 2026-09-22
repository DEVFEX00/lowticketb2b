/**
 * ==============================================================================
 * SERVIÇO DE CONFIRMAÇÃO DE COMPRAS E SESSÃO - FACULDADE FEX EDUCAÇÃO
 * ==============================================================================
 */

import { PRODUCT_IDS, ProductId } from '../config/products';

export interface NormalizedPurchaseResult {
  success: boolean;
  pending?: boolean;
  email: string;
  orderId?: string;
  products: ProductId[];
  customerName?: string;
  hasMainProduct: boolean;
  hasOrderBump: boolean;
  raw?: any;
  message?: string;
}

export interface UserSession {
  email: string;
  orderId?: string;
  customerName?: string;
  products: ProductId[];
  authenticatedAt: string;
}

const SESSION_STORAGE_KEY = 'fex_user_session_v2';

/**
 * Normaliza e padroniza a resposta da API externa / n8n webhook.
 * Identifica rigorosamente se o produto principal e/ou order bump foram confirmados.
 */
export function normalizePurchaseResponse(
  raw: any,
  fallbackEmail: string = '',
  fallbackOrderId: string = ''
): NormalizedPurchaseResult {
  if (!raw) {
    return {
      success: false,
      email: fallbackEmail,
      orderId: fallbackOrderId,
      products: [],
      hasMainProduct: false,
      hasOrderBump: false
    };
  }

  // Handle nested { success: true, data: { ... } } if coming from /api/check-purchase
  const payload = raw.data ? raw.data : raw;

  // Normalized helper: lowercase and strip accents
  const norm = (s: string) => 
    (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  // Verification of success flag or approved statuses
  const isApproved = 
    payload.sucesso === true ||
    payload.success === true ||
    payload.aprovado === true ||
    raw.success === true ||
    ['approved', 'aprovada', 'aprovado', 'paid', 'paga', 'pago', 'active', 'concluido', 'completed'].includes(
      norm(payload.status || payload.situacao || '')
    );

  if (!isApproved) {
    return {
      success: false,
      pending: raw.pending || true,
      email: fallbackEmail || payload.email || '',
      orderId: fallbackOrderId || payload.orderId || payload.pedido || '',
      products: [],
      hasMainProduct: false,
      hasOrderBump: false,
      message: raw.message || 'Pagamento ainda não confirmado.',
      raw: payload
    };
  }

  // Extract products field (n8n returns "podutos" with typo, or "produtos", "products", etc.)
  const rawProductsField = 
    payload.podutos ?? 
    payload.produtos ?? 
    payload.products ?? 
    payload.itens ?? 
    payload.items ?? 
    '';

  const stringifiedData = typeof rawProductsField === 'string' 
    ? rawProductsField 
    : JSON.stringify(rawProductsField) + ' ' + JSON.stringify(payload);

  const normalizedProductsText = norm(stringifiedData);

  // Check presence of Order Bump (Plano de Sucessão)
  const hasOrderBump = 
    normalizedProductsText.includes('order bump') ||
    normalizedProductsText.includes('order_bump') ||
    normalizedProductsText.includes('orderbump') ||
    normalizedProductsText.includes('sucessao') ||
    normalizedProductsText.includes('plano de sucessao') ||
    normalizedProductsText.includes('97');

  // Check presence of Main Product (Diagnóstico + Mini-Curso)
  const hasMainProduct = 
    normalizedProductsText.includes('diagnostico') ||
    normalizedProductsText.includes('mini curso') ||
    normalizedProductsText.includes('mini-curso') ||
    normalizedProductsText.includes('pessoa corporativo') ||
    normalizedProductsText.includes('pessoa-chave') ||
    normalizedProductsText.includes('67') ||
    normalizedProductsText.includes('premium') ||
    // Fallback: If approved and no explicit negative flag
    isApproved;

  const products: ProductId[] = [];
  if (hasMainProduct) {
    products.push(PRODUCT_IDS.DIAGNOSTICO_COMPLETO);
    products.push(PRODUCT_IDS.MINI_CURSO);
  }
  if (hasOrderBump) {
    products.push(PRODUCT_IDS.PLANO_SUCESSAO);
  }

  const resolvedEmail = (payload.email || raw.email || fallbackEmail || '').toLowerCase().trim();
  const resolvedOrderId = (payload.orderId || payload.pedido || raw.orderId || fallbackOrderId || '').trim();
  const customerName = payload.nome || payload.customerName || payload.name || '';

  return {
    success: true,
    email: resolvedEmail,
    orderId: resolvedOrderId,
    customerName,
    products,
    hasMainProduct,
    hasOrderBump,
    raw: payload
  };
}

/**
 * Consulta a API para verificar status de compra por e-mail e/ou pedido.
 * Utiliza prioritariamente a rota interna `/api/check-purchase` para contornar CORS.
 */
export async function checkPurchaseStatus(
  email?: string,
  pedido?: string
): Promise<NormalizedPurchaseResult> {
  const cleanEmail = (email || '').toLowerCase().trim();
  const cleanPedido = (pedido || '').trim();

  if (!cleanEmail && !cleanPedido) {
    return {
      success: false,
      email: '',
      products: [],
      hasMainProduct: false,
      hasOrderBump: false,
      message: 'E-mail ou código do pedido não informados.'
    };
  }

  const params = new URLSearchParams();
  if (cleanEmail) params.set('email', cleanEmail);
  if (cleanPedido) params.set('pedido', cleanPedido);

  // 1. Tentar via rota interna da aplicação (/api/check-purchase)
  try {
    const internalUrl = `/api/check-purchase?${params.toString()}`;
    const response = await fetch(internalUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      const normalized = normalizePurchaseResponse(data, cleanEmail, cleanPedido);
      if (normalized.success) {
        return normalized;
      }
      if (data.pending) {
        return {
          ...normalized,
          pending: true,
          message: data.message || 'Pagamento aguardando aprovação.'
        };
      }
    }
  } catch (internalErr) {
    console.warn('[Purchase API] Falha na rota interna, testando chamada direta:', internalErr);
  }

  // 2. Fallback direto ao webhook do n8n se a rota interna estiver inacessível
  try {
    const directWebhookUrl = `https://n8n.fexeducacao.com/webhook/j2gYOp1tOyw0ZhOn-low-ticket-b2b-aprovado-redirecionamento?${params.toString()}`;
    const directResponse = await fetch(directWebhookUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (directResponse.ok) {
      const text = await directResponse.text();
      if (text && text.trim()) {
        try {
          const directJson = JSON.parse(text);
          return normalizePurchaseResponse(directJson, cleanEmail, cleanPedido);
        } catch {
          // If non-JSON text returned
          return normalizePurchaseResponse({ raw: text }, cleanEmail, cleanPedido);
        }
      }
    }
  } catch (directErr) {
    console.error('[Purchase API] Erro na requisição direta ao n8n:', directErr);
  }

  return {
    success: false,
    pending: true,
    email: cleanEmail,
    orderId: cleanPedido,
    products: [],
    hasMainProduct: false,
    hasOrderBump: false,
    message: 'Ainda não identificamos a confirmação do pagamento. Nova consulta em instantes.'
  };
}

/**
 * Gerenciamento de sessão local do usuário
 */
export function saveUserSession(session: UserSession): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn('[Session] Falha ao persistir sessão:', e);
  }
}

export function getUserSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: UserSession = JSON.parse(raw);
    if (session && session.email && Array.isArray(session.products)) {
      return session;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearUserSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    console.warn('[Session] Falha ao limpar sessão:', e);
  }
}

export function hasProductAccess(session: UserSession | null, productId: ProductId): boolean {
  if (!session || !Array.isArray(session.products)) return false;
  return session.products.includes(productId);
}
