import React, { useState } from 'react';
import { ExternalLink, CheckCircle2, Shield, ArrowRight, X, QrCode } from 'lucide-react';
import { trackEvent } from '../services/analytics';
import { sendLeadToN8n } from '../services/webhook';
import { PerfilEmpresa, DiagnosticoResultado } from '../types';

interface CheckoutModalProps {
  productType: 'diagnostic_67' | 'succession_97';
  isOpen: boolean;
  onClose: () => void;
  perfil?: PerfilEmpresa;
  resultado?: DiagnosticoResultado | null;
  leadData?: {
    nome?: string;
    email?: string;
    whatsapp?: string;
    empresa?: string;
    cargo?: string;
  };
}

export const CHECKOUT_URL_67 = 'https://checkout.fexeducacao.com/pay/diagnostico-de-custo-pessoa-chave-mini-curso';
export const CHECKOUT_URL_97 = 'https://checkout.fexeducacao.com/pay/plano-de-sucessao-completo-mini-curso';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  productType,
  isOpen,
  onClose,
  perfil,
  resultado,
  leadData
}) => {
  const [isRedirecting, setIsRedirecting] = useState(false);

  if (!isOpen) return null;

  const is67 = productType === 'diagnostic_67';
  const price = is67 ? 'R$ 67,00' : 'R$ 97,00';
  const title = is67 
    ? 'Diagnóstico de Custo e Risco de Pessoa-Chave'
    : 'Plano de Sucessão Completo + Plano de 90 Dias';
  const targetUrl = is67 ? CHECKOUT_URL_67 : CHECKOUT_URL_97;

  // Build checkout URL with pre-filled query params and automatic return redirect
  const checkoutParams = new URLSearchParams();
  if (leadData?.nome) checkoutParams.set('name', leadData.nome);
  if (leadData?.email) checkoutParams.set('email', leadData.email);
  if (leadData?.whatsapp) {
    const rawPhone = leadData.whatsapp.replace(/\D/g, '');
    checkoutParams.set('phone', rawPhone || leadData.whatsapp);
  }
  if (leadData?.empresa) checkoutParams.set('company', leadData.empresa);

  // Return redirection configuration for Digital Manager Guru
  if (typeof window !== 'undefined') {
    const returnUrl = `${window.location.origin}${window.location.pathname}?status=approved&paid=${is67 ? '67' : '97'}&sck=${is67 ? 'fex_diag67' : 'fex_plan97'}`;
    checkoutParams.set('return_url', returnUrl);
    checkoutParams.set('redirect_url', returnUrl);
    checkoutParams.set('sck', is67 ? 'fex_diag67' : 'fex_plan97');
  }
  
  const fullCheckoutUrl = targetUrl + (checkoutParams.toString() ? `?${checkoutParams.toString()}` : '');

  const handleGoToCheckout = async () => {
    setIsRedirecting(true);

    trackEvent(is67 ? 'checkout_67_click' : 'checkout_97_click', {
      product: title,
      price,
      lead: leadData
    });

    if (leadData && (leadData.nome || leadData.email)) {
      try {
        await sendLeadToN8n({
          lead: {
            nome: leadData.nome || '',
            email: leadData.email || '',
            whatsapp: leadData.whatsapp || '',
            empresa: leadData.empresa || '',
            cargo: leadData.cargo || '',
            lgpdAceito: true
          },
          perfil,
          resultado,
          etapaOrigem: is67 ? 'modal_checkout_click_67' : 'modal_checkout_click_97',
          extraData: {
            produtoClicado: is67 ? 'diagnostico_67' : 'plano_sucessao_97',
            valorClicado: is67 ? 67.0 : 97.0
          }
        });
      } catch (err) {
        console.warn('[FEX] Webhook lead sync handled:', err);
      }
    }

    // Direct navigation in the same window to ensure consistent return from Guru
    window.location.href = fullCheckoutUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#111111] text-white border border-white/15 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00D84F]/20 text-[#00D84F] text-xs font-bold uppercase tracking-wider mb-4">
          <Shield className="w-3.5 h-3.5" />
          Checkout Oficial FEX Educação
        </div>

        <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
          {title}
        </h3>

        <div className="my-5 p-4 rounded-xl bg-black border border-white/10 flex items-baseline justify-between">
          <span className="text-sm text-white/70 font-medium">Investimento único:</span>
          <div className="text-right">
            <span className="text-2xl sm:text-3xl font-black text-[#00D84F]">{price}</span>
            <span className="block text-[11px] text-white/50">PIX ou Cartão • Acesso imediato</span>
          </div>
        </div>

        <div className="space-y-2.5 mb-6 text-sm text-white/80">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00D84F] shrink-0 mt-0.5" />
            <span>{is67 ? 'Diagnóstico interativo de até 5 cargos críticos' : 'Plano de 90 dias personalizado com 5 fases de implementação'}</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00D84F] shrink-0 mt-0.5" />
            <span>{is67 ? 'Cálculo de custo de transição e produtividade em reais' : 'Superação da barreira emocional do especialista (Método Atitude Emocional®)'}</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00D84F] shrink-0 mt-0.5" />
            <span>{is67 ? 'Raio-X do conhecimento tácito vulnerável' : 'Matriz de competências, cronograma de validação e governança'}</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00D84F] shrink-0 mt-0.5" />
            <span className="text-[#00D84F] font-semibold">Inclui acesso integral ao Mini-Curso FEX (vídeo aulas)</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleGoToCheckout}
            disabled={isRedirecting}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-full bg-[#00D84F] hover:bg-[#25eb69] disabled:opacity-75 text-black font-extrabold text-sm sm:text-base uppercase tracking-wider transition-all transform active:scale-98 shadow-lg shadow-[#00D84F]/20 cursor-pointer"
          >
            {isRedirecting ? (
              <span>Redirecionando para o Checkout Seguro...</span>
            ) : (
              <>
                <span>Ir para o Checkout Seguro ({price})</span>
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </button>
          <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 pt-1">
            <QrCode className="w-3.5 h-3.5 text-[#00D84F]" />
            <span>Pagamento 100% seguro via PIX ou Cartão no Guru</span>
          </div>
        </div>
      </div>
    </div>
  );
};
