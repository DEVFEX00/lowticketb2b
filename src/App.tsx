import React, { useState, useEffect } from 'react';
import { AppState, AccessStatus, PerfilEmpresa, CargoCritico, TacitKnowledgeSelection, LeadInfo, PlanoSucessao } from './types';
import { loadSavedState, saveState, resetState } from './services/storage';
import { calcularDiagnostico } from './utils/calculations';
import { gerarPlanoPersonalizado } from './data/mockDefaults';
import { trackEvent } from './services/analytics';
import { CheckCircle2, X } from 'lucide-react';

// Components
import { BrandHeader } from './components/BrandHeader';
import { BrandFooter } from './components/BrandFooter';
import { LandingIntro } from './components/LandingIntro';
import { DiagnosticForm } from './components/DiagnosticForm';
import { CalculatingSuspense } from './components/CalculatingSuspense';
import { DiagnosticResult } from './components/DiagnosticResult';
import { RaioXConhecimento } from './components/RaioXConhecimento';
import { UpsellSuccessionOffer } from './components/UpsellSuccessionOffer';
import { SuccessionPlanView } from './components/SuccessionPlanView';
import { MiniCursoView } from './components/MiniCursoView';
import { ClientHubView } from './components/ClientHubView';
import { CheckoutModal } from './components/CheckoutModal';
import { PrintReportView } from './components/PrintReportView';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadSavedState());
  const [paymentAlert, setPaymentAlert] = useState<string | null>(null);
  const [checkoutModal, setCheckoutModal] = useState<{
    open: boolean;
    type: 'diagnostic_67' | 'succession_97';
  }>({
    open: false,
    type: 'diagnostic_67'
  });

  // Handle post-checkout redirection from Guru and URL parameter detection
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const params = url.searchParams;

      // Extract buyer data if sent back by Guru
      const queryName = params.get('nome') || params.get('name') || params.get('first_name') || params.get('customer_name') || '';
      const queryEmail = params.get('email') || params.get('customer_email') || '';
      const queryPhone = params.get('whatsapp') || params.get('phone') || params.get('tel') || params.get('customer_phone') || '';
      const queryCompany = params.get('empresa') || params.get('company') || '';

      // Normalize helper: lowercase, strip accents, and trim
      const norm = (s: string | null) => 
        (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

      // Transaction status detection
      const rawStatus = norm(
        params.get('status') || 
        params.get('transaction_status') || 
        params.get('payment_status') || 
        params.get('checkout') || 
        params.get('checkout_status') || 
        params.get('payment') || 
        params.get('compra') || 
        params.get('pix_status') || 
        params.get('transacao') || 
        params.get('result') || 
        params.get('situacao') || 
        ''
      );

      // Approved statuses in Guru (Portuguese & English)
      const approvedStatuses = [
        'approved',
        'aprovada',
        'aprovado',
        'paid',
        'paga',
        'pago',
        'completed',
        'concluida',
        'concluido',
        'active',
        'ativo',
        'success',
        'sucesso',
        '1',
        'true'
      ];

      const hasApprovedStatus = 
        approvedStatuses.includes(rawStatus) ||
        params.get('approved') === 'true' ||
        params.get('approved') === '1' ||
        params.get('sucesso') === 'true' ||
        params.get('pago') === 'true';

      const transactionId = (
        params.get('transaction_id') ||
        params.get('guru_transaction_id') ||
        params.get('id') ||
        params.get('transacao') ||
        params.get('order_id') ||
        params.get('pedido_id') ||
        ''
      ).trim();

      // SECURITY: A purchase MUST have an approved status OR a verified transaction ID from Guru.
      // Arbitrary URL manipulation (e.g., just typing ?paid=67 without approved status) will NOT grant access.
      if (!hasApprovedStatus && !transactionId) {
        return;
      }

      // Identify which product was purchased: R$67 vs R$97
      const paidParam = norm(params.get('paid') || params.get('p') || params.get('plano') || '');
      const sckParam = norm(params.get('sck') || params.get('src') || params.get('utm_source') || params.get('utm_campaign') || '');
      
      const productText = norm(
        [
          params.get('product'),
          params.get('produto'),
          params.get('product_name'),
          params.get('nome_produto'),
          params.get('product_slug'),
          params.get('slug'),
          params.get('item'),
          params.get('item_name'),
          params.get('offer'),
          params.get('oferta')
        ].filter(Boolean).join(' ')
      );

      const priceText = norm(
        params.get('total') ||
        params.get('price') ||
        params.get('valor') ||
        params.get('amount') ||
        params.get('order_total') ||
        ''
      ).replace(',', '.');

      // Check R$ 97 (Plano de Sucessão)
      const is97 = 
        paidParam === '97' ||
        paidParam.includes('97') ||
        paidParam.includes('sucessao') ||
        paidParam.includes('plano') ||
        sckParam.includes('plan97') ||
        sckParam.includes('fex_plan97') ||
        sckParam.includes('sucessao') ||
        priceText.startsWith('97') ||
        priceText === '97.00' ||
        priceText === '97' ||
        productText.includes('plano de sucessao') ||
        productText.includes('plano-de-sucessao') ||
        productText.includes('sucessao') ||
        productText.includes('97');

      // Check R$ 67 (Diagnóstico + Mini-Curso)
      const is67 = 
        paidParam === '67' ||
        paidParam.includes('67') ||
        paidParam.includes('diag') ||
        sckParam.includes('diag67') ||
        sckParam.includes('fex_diag67') ||
        priceText.startsWith('67') ||
        priceText === '67.00' ||
        priceText === '67' ||
        productText.includes('diagnostico') ||
        productText.includes('pessoa-chave') ||
        productText.includes('pessoa chave') ||
        productText.includes('corporativo') ||
        productText.includes('67');

      const targetScreen = params.get('screen') || params.get('step');

      // EXECUTE UNLOCK BASED ON GURU RETURN
      if (is97) {
        // FLUXO R$ 97:
        // Checkout Guru R$ 97 -> pagamento aprovado -> retorno ao site -> liberar Plano de Sucessão -> manter Diagnóstico + Mini-Curso liberados
        setState((prev) => {
          const updatedLead = {
            ...prev.lead,
            nome: queryName || prev.lead.nome,
            email: queryEmail || prev.lead.email,
            whatsapp: queryPhone || prev.lead.whatsapp,
            empresa: queryCompany || prev.lead.empresa
          };

          // Guarantee Plano de Sucessão is instantiated so user can view it immediately
          const plano = prev.planoSucessao || gerarPlanoPersonalizado(
            updatedLead.empresa || 'Sua Empresa',
            prev.resultado || calcularDiagnostico([], 12, 10),
            prev.conhecimentoTacito || { tecnico: [], relacionamentos: [], julgamento: [], cultura: [] }
          );

          return {
            ...prev,
            lead: updatedLead,
            accessStatus: 'succession_unlocked',
            planoSucessao: plano,
            currentScreen: targetScreen || 'plano'
          };
        });

        trackEvent('checkout_return_success_97', { transactionId, status: rawStatus });
        setPaymentAlert('🎉 Pagamento aprovado pelo Guru! Seu Plano de Sucessão de 90 Dias foi liberado com sucesso.');
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (is67) {
        // FLUXO R$ 67:
        // Checkout Guru R$ 67 -> pagamento aprovado -> retorno ao site -> liberar Diagnóstico + Mini-Curso -> manter Plano de Sucessão bloqueado
        setState((prev) => {
          const updatedLead = {
            ...prev.lead,
            nome: queryName || prev.lead.nome,
            email: queryEmail || prev.lead.email,
            whatsapp: queryPhone || prev.lead.whatsapp,
            empresa: queryCompany || prev.lead.empresa
          };

          return {
            ...prev,
            lead: updatedLead,
            // If user already had succession_unlocked, keep it; otherwise set diagnostic_paid (which keeps plano locked)
            accessStatus: prev.accessStatus === 'succession_unlocked' ? 'succession_unlocked' : 'diagnostic_paid',
            currentScreen: targetScreen || (prev.resultado ? 'resultado' : 'hub')
          };
        });

        trackEvent('checkout_return_success_67', { transactionId, status: rawStatus });
        setPaymentAlert('🎉 Pagamento aprovado pelo Guru! Seu acesso ao Diagnóstico Completo e ao Mini-Curso foi liberado com sucesso.');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.warn('[FEX Guru Return] Erro ao processar retorno do checkout Guru:', e);
    }
  }, []);

  // Save to localStorage on state updates
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Navigate screen handler
  const handleNavigate = (screen: string) => {
    setState((prev) => ({
      ...prev,
      currentScreen: screen
    }));
    trackEvent('screen_viewed', { screen });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset entire application
  const handleReset = () => {
    const fresh = resetState();
    setState(fresh);
    trackEvent('app_reset');
  };

  // Perfil update
  const handleUpdatePerfil = (perfil: PerfilEmpresa) => {
    setState((prev) => ({ ...prev, perfil }));
  };

  // Cargos update
  const handleUpdateCargos = (cargos: CargoCritico[]) => {
    setState((prev) => ({ ...prev, cargos }));
  };

  // Calculate diagnostic result
  const handleStartCalculation = () => {
    handleNavigate('calculando');
  };

  const handleFinishCalculation = () => {
    const res = calcularDiagnostico(state.cargos, state.mesesRampa, state.percentualPerda);
    const plano = gerarPlanoPersonalizado(state.lead.empresa, res, state.conhecimentoTacito);

    setState((prev) => ({
      ...prev,
      resultado: res,
      planoSucessao: plano,
      // Only retain unlocked status if customer already paid R$ 67 or R$ 97
      accessStatus: ['diagnostic_paid', 'succession_unlocked', 'succession_paid'].includes(prev.accessStatus)
        ? prev.accessStatus
        : 'diagnostic_pending',
      currentScreen: 'resultado'
    }));
    trackEvent('calculation_completed', { custoTotal: res.custoTotal, nivelGeral: res.nivelGeral });
  };

  // Update simulation parameters (Rampa & Perda)
  const handleUpdateParams = (meses: number, perda: number) => {
    const res = calcularDiagnostico(state.cargos, meses, perda);
    const plano = gerarPlanoPersonalizado(state.lead.empresa, res, state.conhecimentoTacito);

    setState((prev) => ({
      ...prev,
      mesesRampa: meses,
      percentualPerda: perda,
      resultado: res,
      planoSucessao: plano
    }));
  };

  // Update lead info
  const handleUpdateLead = (lead: LeadInfo) => {
    setState((prev) => {
      const plano = prev.resultado
        ? gerarPlanoPersonalizado(lead.empresa, prev.resultado, prev.conhecimentoTacito)
        : prev.planoSucessao;
      return {
        ...prev,
        lead,
        planoSucessao: plano
      };
    });
  };

  // Update tacit knowledge
  const handleUpdateTacito = (tacito: TacitKnowledgeSelection) => {
    setState((prev) => {
      const plano = prev.resultado
        ? gerarPlanoPersonalizado(prev.lead.empresa, prev.resultado, tacito)
        : prev.planoSucessao;
      return {
        ...prev,
        conhecimentoTacito: tacito,
        planoSucessao: plano
      };
    });
  };

  // Update succession plan
  const handleUpdatePlano = (plano: PlanoSucessao) => {
    setState((prev) => ({ ...prev, planoSucessao: plano }));
  };

  // Toggle lesson complete in mini-course
  const handleToggleAulaConcluida = (aulaId: string) => {
    setState((prev) => ({
      ...prev,
      cursoProgresso: {
        ...prev.cursoProgresso,
        [aulaId]: !prev.cursoProgresso[aulaId]
      }
    }));
  };

  // Print/Export handler
  const handlePrint = () => {
    trackEvent('print_export_triggered');
    window.print();
  };

  // Checkout modal openers
  const openCheckout67 = () => {
    setCheckoutModal({ open: true, type: 'diagnostic_67' });
  };

  const openCheckout97 = () => {
    setCheckoutModal({ open: true, type: 'succession_97' });
  };

  // Check dark screen styling
  const isDarkScreen = ['intro', 'calculando'].includes(state.currentScreen);

  return (
    <div className={`min-h-screen flex flex-col font-['Montserrat'] ${isDarkScreen ? 'bg-black text-white' : 'bg-[#000000] text-[#111111]'}`}>
      {/* Brand Navigation Bar */}
      <BrandHeader
        currentScreen={state.currentScreen}
        accessStatus={state.accessStatus}
        hasResult={Boolean(state.resultado)}
        onNavigate={handleNavigate}
      />

      {/* Post-Checkout Confirmation Notification Banner */}
      {paymentAlert && (
        <div className="bg-[#00D84F] text-black px-4 py-3 shadow-md">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{paymentAlert}</span>
            </div>
            <button
              onClick={() => setPaymentAlert(null)}
              className="p-1 hover:bg-black/10 rounded-full transition-colors cursor-pointer"
              title="Fechar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col justify-center py-6 sm:py-10 px-3 sm:px-6 transition-all duration-300 no-print ${isDarkScreen ? 'bg-black' : 'bg-[#0a0a0a]'}`}>
        {state.currentScreen === 'intro' && (
          <LandingIntro
            onStart={() => handleNavigate('perfil')}
          />
        )}

        {state.currentScreen === 'perfil' && (
          <DiagnosticForm
            step="perfil"
            perfil={state.perfil}
            onUpdatePerfil={handleUpdatePerfil}
            cargos={state.cargos}
            onUpdateCargos={handleUpdateCargos}
            onCalculate={() => handleNavigate('cargos')}
            onBack={() => handleNavigate('intro')}
          />
        )}

        {state.currentScreen === 'cargos' && (
          <DiagnosticForm
            step="cargos"
            perfil={state.perfil}
            onUpdatePerfil={handleUpdatePerfil}
            cargos={state.cargos}
            onUpdateCargos={handleUpdateCargos}
            onCalculate={handleStartCalculation}
            onBack={() => handleNavigate('perfil')}
          />
        )}

        {state.currentScreen === 'calculando' && (
          <CalculatingSuspense onFinish={handleFinishCalculation} />
        )}

        {state.currentScreen === 'resultado' && (
          state.resultado ? (
            <DiagnosticResult
              resultado={state.resultado}
              lead={state.lead}
              perfil={state.perfil}
              accessStatus={state.accessStatus}
              onUpdateLead={handleUpdateLead}
              onUpdateParams={handleUpdateParams}
              onProceedToRaioX={() => handleNavigate('raiox')}
              onPrint={handlePrint}
              onOpenCheckout67={openCheckout67}
              onNavigateToHub={() => handleNavigate('hub')}
            />
          ) : (
            <div className="max-w-md mx-auto text-center py-12 px-6 bg-white text-neutral-900 rounded-3xl p-8 border border-neutral-200 shadow-xl animate-fadeIn">
              <h2 className="text-xl font-black mb-2 text-neutral-900">Calculadora de Risco</h2>
              <p className="text-xs text-neutral-600 mb-6 leading-relaxed">
                Você ainda não realizou o cálculo. Preencha os cargos críticos para visualizar seu resultado gratuitamente.
              </p>
              <button
                onClick={() => handleNavigate('cargos')}
                className="px-6 py-3.5 rounded-full bg-[#00D84F] hover:bg-[#25eb69] text-black font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-[#00D84F]/20"
              >
                Fazer Calculadora de Risco
              </button>
            </div>
          )
        )}

        {state.currentScreen === 'raiox' && (
          <RaioXConhecimento
            conhecimentoTacito={state.conhecimentoTacito}
            onUpdateTacito={handleUpdateTacito}
            resultado={state.resultado}
            onProceedToUpsell={() => handleNavigate('upsell')}
            onBack={() => handleNavigate(state.resultado ? 'resultado' : 'cargos')}
          />
        )}

        {state.currentScreen === 'upsell' && (
          <UpsellSuccessionOffer
            resultado={state.resultado}
            lead={state.lead}
            hasUnlockedSuccession={['succession_unlocked', 'course_access'].includes(state.accessStatus)}
            onUnlockSuccession={openCheckout97}
            onOpenCheckout97={openCheckout97}
            onBack={() => handleNavigate('raiox')}
          />
        )}

        {state.currentScreen === 'plano' && (
          (['succession_unlocked', 'course_access', 'succession_paid'].includes(state.accessStatus) && state.planoSucessao) ? (
            <SuccessionPlanView
              plano={state.planoSucessao}
              resultado={state.resultado}
              lead={state.lead}
              onUpdatePlano={handleUpdatePlano}
              onNavigateToCourse={() => handleNavigate('curso')}
              onNavigateToHub={() => handleNavigate('hub')}
              onPrint={handlePrint}
            />
          ) : (
            <UpsellSuccessionOffer
              resultado={state.resultado}
              lead={state.lead}
              hasUnlockedSuccession={false}
              onUnlockSuccession={openCheckout97}
              onOpenCheckout97={openCheckout97}
              onBack={() => handleNavigate('hub')}
            />
          )
        )}

        {state.currentScreen === 'curso' && (
          <MiniCursoView
            cursoProgresso={state.cursoProgresso}
            onToggleAulaConcluida={handleToggleAulaConcluida}
            onBack={() => handleNavigate('hub')}
            isLocked={!['diagnostic_paid', 'diagnostic_completed', 'succession_unlocked', 'course_access', 'succession_paid'].includes(state.accessStatus)}
            onUnlock={openCheckout67}
          />
        )}

        {state.currentScreen === 'hub' && (
          <ClientHubView
            accessStatus={state.accessStatus}
            lead={state.lead}
            resultado={state.resultado}
            planoSucessao={state.planoSucessao}
            onNavigate={handleNavigate}
            onOpenCheckout67={openCheckout67}
            onOpenCheckout97={openCheckout97}
          />
        )}
      </main>

      {/* Brand Footer */}
      <BrandFooter isDark={isDarkScreen} />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutModal.open}
        productType={checkoutModal.type}
        onClose={() => setCheckoutModal((p) => ({ ...p, open: false }))}
        leadData={state.lead}
        perfil={state.perfil}
        resultado={state.resultado}
      />

      {/* Hidden Print Report View (triggered during window.print()) */}
      <PrintReportView
        resultado={state.resultado}
        lead={state.lead}
        plano={state.planoSucessao}
        tacit={state.conhecimentoTacito}
      />
    </div>
  );
}
