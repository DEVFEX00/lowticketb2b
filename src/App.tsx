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

  // Handle post-checkout redirection and URL parameter detection
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const params = url.searchParams;

      const queryName = params.get('nome') || params.get('name') || params.get('first_name') || '';
      const queryEmail = params.get('email') || '';
      const queryPhone = params.get('whatsapp') || params.get('phone') || params.get('tel') || '';
      const queryCompany = params.get('empresa') || params.get('company') || '';

      const paidParam = params.get('paid') || params.get('p') || params.get('plano') || '';
      const statusParam = (
        params.get('status') || 
        params.get('checkout') || 
        params.get('payment') || 
        params.get('compra') || 
        params.get('pix_status') || 
        params.get('transaction_status') || 
        params.get('payment_status') || 
        params.get('transacao') || 
        params.get('result') || 
        ''
      ).toLowerCase();
      const productParam = (params.get('product') || params.get('produto') || params.get('offer') || params.get('sck') || '').toLowerCase();
      const accessParam = (params.get('access') || '').toLowerCase();
      const targetScreen = params.get('screen') || params.get('step');

      const isSuccess = [
        'paid', 'approved', 'success', 'sucesso', 'aprovado', 'concluido', 'completed', 'active', 'ok', 'pago', 'true', '1'
      ].includes(statusParam) || params.get('approved') === 'true' || params.get('approved') === '1' || params.get('sucesso') === 'true';

      const isPaid97Param = paidParam === '97' || productParam.includes('97') || productParam.includes('sucessao') || accessParam === 'succession_unlocked';
      const isPaid67Param = paidParam === '67' || productParam.includes('67') || productParam.includes('diag') || accessParam === 'diagnostic_paid';

      // Check if user returned from a successful purchase
      if (isPaid97Param || (isSuccess && isPaid97Param)) {
        setState((prev) => {
          const updatedLead = {
            ...prev.lead,
            nome: queryName || prev.lead.nome,
            email: queryEmail || prev.lead.email,
            whatsapp: queryPhone || prev.lead.whatsapp,
            empresa: queryCompany || prev.lead.empresa
          };
          const plano = prev.resultado
            ? (prev.planoSucessao || gerarPlanoPersonalizado(updatedLead.empresa, prev.resultado, prev.conhecimentoTacito))
            : prev.planoSucessao;

          return {
            ...prev,
            lead: updatedLead,
            accessStatus: 'succession_unlocked',
            planoSucessao: plano,
            currentScreen: targetScreen || 'plano'
          };
        });
        trackEvent('checkout_return_success_97');
        setPaymentAlert('🎉 Pagamento confirmado com sucesso! Seu Plano de Sucessão de 90 Dias foi liberado.');
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (isPaid67Param || isSuccess) {
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
            accessStatus: prev.accessStatus === 'succession_unlocked' ? 'succession_unlocked' : 'diagnostic_paid',
            currentScreen: targetScreen || (prev.resultado ? 'resultado' : 'hub')
          };
        });
        trackEvent('checkout_return_success_67');
        setPaymentAlert('🎉 Pagamento confirmado com sucesso! Seu acesso ao Diagnóstico Completo e ao Mini-Curso foi liberado.');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.warn('Erro ao processar parâmetros da URL de checkout:', e);
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

        {state.currentScreen === 'resultado' && state.resultado && (
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
        onConfirmPaid={(type) => {
          setCheckoutModal({ open: false, type });
          if (type === 'diagnostic_67') {
            setState((prev) => ({
              ...prev,
              accessStatus: prev.accessStatus === 'succession_unlocked' ? 'succession_unlocked' : 'diagnostic_paid',
              currentScreen: prev.resultado ? 'resultado' : 'hub'
            }));
            trackEvent('checkout_manual_confirm_67');
            setPaymentAlert('🎉 Pagamento confirmado com sucesso! Seu acesso ao Diagnóstico Completo e ao Mini-Curso foi liberado.');
          } else {
            setState((prev) => {
              const plano = prev.resultado
                ? (prev.planoSucessao || gerarPlanoPersonalizado(prev.lead.empresa, prev.resultado, prev.conhecimentoTacito))
                : prev.planoSucessao;
              return {
                ...prev,
                accessStatus: 'succession_unlocked',
                planoSucessao: plano,
                currentScreen: 'plano'
              };
            });
            trackEvent('checkout_manual_confirm_97');
            setPaymentAlert('🎉 Pagamento confirmado com sucesso! Seu Plano de Sucessão de 90 Dias foi liberado.');
          }
        }}
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
