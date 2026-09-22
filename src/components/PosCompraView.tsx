import React, { useEffect } from 'react';
import { FexLogo } from './FexLogo';
import { saveUserSession, NormalizedPurchaseResult } from '../services/purchaseApi';
import { PRODUCT_IDS, ProductId } from '../config/products';
import { trackEvent } from '../services/analytics';
import { Loader2 } from 'lucide-react';

interface PosCompraViewProps {
  initialEmail?: string;
  initialPedido?: string;
  onConfirmSuccess?: (result: NormalizedPurchaseResult) => void;
  onNavigateToHub: () => void;
  onNavigateToLogin: () => void;
}

/**
 * Componente /pos-compra
 * Responsabilidade:
 * Liberar o acesso INSTANTANEAMENTE (sem depender de atraso do webhook Pix)
 * e redirecionar imediatamente para a Área de Membros (/area-do-cliente).
 */
export const PosCompraView: React.FC<PosCompraViewProps> = ({
  initialEmail = '',
  initialPedido = '',
  onConfirmSuccess,
  onNavigateToHub
}) => {
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);

      // 1. Extração ampla de parâmetros do Digital Manager Guru
      const queryEmail = (
        urlParams.get('email') ||
        urlParams.get('e-mail') ||
        urlParams.get('customer_email') ||
        urlParams.get('buyer_email') ||
        urlParams.get('customer[email]') ||
        urlParams.get('e') ||
        initialEmail ||
        ''
      ).toLowerCase().trim();

      const queryPedido = (
        urlParams.get('order_id') ||
        urlParams.get('transaction_id') ||
        urlParams.get('pedido') ||
        urlParams.get('pedido_id') ||
        urlParams.get('id') ||
        urlParams.get('trans_id') ||
        urlParams.get('guru_order_id') ||
        urlParams.get('order') ||
        initialPedido ||
        ''
      ).trim();

      const queryName = (
        urlParams.get('name') ||
        urlParams.get('nome') ||
        urlParams.get('customer_name') ||
        urlParams.get('buyer_name') ||
        urlParams.get('customer[name]') ||
        ''
      ).trim();

      // 2. Fallbacks de sessão persistidos antes de ir para o checkout
      const storedCheckoutEmail = (
        sessionStorage.getItem('fex_checkout_email') ||
        localStorage.getItem('fex_checkout_email') ||
        localStorage.getItem('fex_last_buyer_email') ||
        ''
      ).toLowerCase().trim();

      const storedCheckoutName = (
        sessionStorage.getItem('fex_checkout_name') ||
        localStorage.getItem('fex_checkout_name') ||
        ''
      ).trim();

      const storedOrderId = (
        sessionStorage.getItem('fex_checkout_order_id') ||
        sessionStorage.getItem('fex_current_order_id') ||
        ''
      ).trim();

      const finalEmail = queryEmail || storedCheckoutEmail || 'comprador@fexeducacao.com';
      const finalOrderId = queryPedido || storedOrderId || `guru_${Date.now()}`;
      const finalName = queryName || storedCheckoutName || '';

      // 3. Identificação do produto (R$ 67 vs R$ 97 / bump)
      const is97 = Boolean(
        urlParams.get('product')?.includes('97') ||
        urlParams.get('product_id')?.includes('97') ||
        urlParams.get('bump') === '1' ||
        sessionStorage.getItem('fex_checkout_type') === 'succession_97' ||
        localStorage.getItem('fex_checkout_type') === 'succession_97'
      );

      const confirmedProducts: ProductId[] = is97
        ? [PRODUCT_IDS.DIAGNOSTICO_COMPLETO, PRODUCT_IDS.MINI_CURSO, PRODUCT_IDS.PLANO_SUCESSAO]
        : [PRODUCT_IDS.DIAGNOSTICO_COMPLETO, PRODUCT_IDS.MINI_CURSO];

      // 4. Salvar dados de forma persistente
      sessionStorage.setItem('fex_current_email', finalEmail);
      sessionStorage.setItem('fex_checkout_email', finalEmail);
      localStorage.setItem('fex_last_buyer_email', finalEmail);
      sessionStorage.setItem('fex_current_order_id', finalOrderId);
      sessionStorage.setItem('fex_post_purchase_active', 'true');
      localStorage.setItem('fex_post_purchase_active', 'true');

      // 5. LIBERAÇÃO INSTANTÂNEA: Grava a sessão do usuário com os produtos liberados!
      saveUserSession({
        email: finalEmail,
        orderId: finalOrderId,
        customerName: finalName,
        products: confirmedProducts,
        authenticatedAt: new Date().toISOString()
      });

      // 6. Notifica o estado pai imediatamente
      if (onConfirmSuccess) {
        onConfirmSuccess({
          success: true,
          email: finalEmail,
          orderId: finalOrderId,
          customerName: finalName,
          products: confirmedProducts,
          hasMainProduct: true,
          hasOrderBump: is97
        });
      }

      trackEvent('pos_compra_instant_unlock', {
        email: finalEmail,
        orderId: finalOrderId,
        products: confirmedProducts
      });

      // 7. Redirecionamento instantâneo para a Área de Membros
      window.history.replaceState({}, '', '/area-do-cliente');
      onNavigateToHub();
    } catch (e) {
      console.warn('[PosCompra] Redirecionando com resiliência:', e);
      window.history.replaceState({}, '', '/area-do-cliente');
      onNavigateToHub();
    }
  }, [initialEmail, initialPedido, onConfirmSuccess, onNavigateToHub]);

  return (
    <div className="w-full max-w-md mx-auto py-16 px-4 text-center text-white animate-fadeIn">
      <div className="inline-block mb-6">
        <FexLogo variant="dark" size="md" />
      </div>

      <div className="bg-[#111111] border border-white/15 rounded-3xl p-8 shadow-2xl space-y-4">
        <div className="w-14 h-14 rounded-full bg-[#00D84F]/10 border border-[#00D84F]/30 flex items-center justify-center mx-auto text-[#00D84F]">
          <Loader2 className="w-7 h-7 animate-spin text-[#00D84F]" />
        </div>

        <h2 className="text-xl font-black text-white">
          Acesso liberado! Entrando na Área de Membros...
        </h2>

        <p className="text-xs text-neutral-400">
          Faculdade FEX Educação • Redirecionando instantaneamente
        </p>
      </div>
    </div>
  );
};
