import React, { useState, useEffect, useCallback } from 'react';
import { AppState, AccessStatus, PerfilEmpresa, CargoCritico, TacitKnowledgeSelection, LeadInfo, PlanoSucessao } from './types';
import { loadSavedState, saveState, resetState } from './services/storage';
import { calcularDiagnostico } from './utils/calculations';
import { gerarPlanoPersonalizado } from './data/mockDefaults';
import { trackEvent } from './services/analytics';
import { CheckCircle2, X, AlertTriangle } from 'lucide-react';
import { PRODUCT_IDS } from './config/products';
import { 
  getUserSession, 
  clearUserSession, 
  saveUserSession, 
  checkPurchaseStatus, 
  UserSession, 
  NormalizedPurchaseResult 
} from './services/purchaseApi';

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
import { PosCompraView } from './components/PosCompraView';
import { LoginView } from './components/LoginView';

export default function App() {
  const [state, setState] = useState<AppState>(() => loadSavedState());
  const [userSession, setUserSession] = useState<UserSession | null>(() => getUserSession());
  const [paymentAlert, setPaymentAlert] = useState<string | null>(null);
  const [isRefreshingPurchases, setIsRefreshingPurchases] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState<{
    open: boolean;
    type: 'diagnostic_67' | 'succession_97';
  }>({
    open: false,
    type: 'diagnostic_67'
  });

  // URL Path Mapper
  const pathMap: Record<string, string> = {
    'intro': '/',
    'perfil': '/perfil',
    'cargos': '/cargos',
    'calculando': '/calculando',
    'resultado': '/diagnostico',
    'raiox': '/raio-x',
    'upsell': '/upsell',
    'plano': '/plano-de-sucessao',
    'curso': '/mini-curso',
    'hub': '/area-do-cliente',
    'login': '/login',
    'pos-compra': '/pos-compra'
  };

  const syncUrl = useCallback((screen: string, replace = false) => {
    try {
      const targetPath = pathMap[screen] || '/';
      const search = screen === 'pos-compra' ? window.location.search : '';
      const newUrl = `${targetPath}${search}`;

      if (window.location.pathname !== targetPath) {
        if (replace) {
          window.history.replaceState({ screen }, '', newUrl);
        } else {
          window.history.pushState({ screen }, '', newUrl);
        }
      }
    } catch {
      // Safe fallback in sandboxed iframes
    }
  }, []);

  // Screen identification from URL pathname & query parameters
  const getScreenFromUrl = (): { screen: string; email?: string; pedido?: string } => {
    try {
      const pathname = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);

      const email = params.get('email') || params.get('customer_email') || '';
      const pedido = params.get('pedido') || params.get('order_id') || params.get('transaction_id') || '';

      const queryScreen = params.get('screen') || params.get('step') || params.get('route');
      if (queryScreen) {
        if (queryScreen === 'pos-compra' || queryScreen === 'poscompra') return { screen: 'pos-compra', email, pedido };
        if (queryScreen === 'login') return { screen: 'login' };
        if (queryScreen === 'hub' || queryScreen === 'area-do-cliente') return { screen: 'hub' };
        if (queryScreen === 'diagnostico' || queryScreen === 'resultado') return { screen: 'resultado' };
        if (queryScreen === 'mini-curso' || queryScreen === 'curso') return { screen: 'curso' };
        if (queryScreen === 'plano-de-sucessao' || queryScreen === 'plano') return { screen: 'plano' };
        return { screen: queryScreen, email, pedido };
      }

      if (pathname.includes('/pos-compra') || pathname.includes('/poscompra')) return { screen: 'pos-compra', email, pedido };
      if (pathname.includes('/login')) return { screen: 'login' };
      if (pathname.includes('/area-do-cliente') || pathname.includes('/hub')) return { screen: 'hub' };
      if (pathname.includes('/mini-curso')) return { screen: 'curso' };
      if (pathname.includes('/plano-de-sucessao')) return { screen: 'plano' };
      if (pathname.includes('/diagnostico')) return { screen: 'resultado' };
      if (pathname.includes('/cargos')) return { screen: 'cargos' };
      if (pathname.includes('/perfil')) return { screen: 'perfil' };
      if (params.get('pedido') || params.get('email')) {
        // If arrived with purchase parameters on root, route to pos-compra
        return { screen: 'pos-compra', email, pedido };
      }
    } catch (e) {
      console.warn('[Routing] Erro ao extrair rota da URL:', e);
    }
    return { screen: 'intro' };
  };

  // Route protection checker
  const canAccessScreen = (screen: string, currentSession: UserSession | null, currentStatus: AccessStatus): boolean => {
    if (screen === 'curso') {
      const hasCurso = 
        ['diagnostic_paid', 'succession_unlocked', 'succession_paid'].includes(currentStatus) ||
        Boolean(currentSession?.products?.includes(PRODUCT_IDS.MINI_CURSO));
      return hasCurso;
    }

    if (screen === 'plano') {
      const hasPlano = 
        ['succession_unlocked', 'succession_paid'].includes(currentStatus) ||
        Boolean(currentSession?.products?.includes(PRODUCT_IDS.PLANO_SUCESSAO));
      return hasPlano;
    }

    return true;
  };

  // Navigate screen handler with route protection
  const handleNavigate = (screen: string, replace = false) => {
    // Check route protection (Item 37)
    if (!canAccessScreen(screen, userSession, state.accessStatus)) {
      if (screen === 'curso') {
        setPaymentAlert('🔒 O Mini-Curso é exclusivo para compradores do Diagnóstico (R$ 67). Adquira para desbloquear.');
      } else if (screen === 'plano') {
        setPaymentAlert('🔒 O Plano de Sucessão de 90 Dias é disponibilizado via Order Bump no checkout oficial.');
      }
      setState((prev) => ({ ...prev, currentScreen: 'hub' }));
      syncUrl('hub', true);
      return;
    }

    setState((prev) => ({
      ...prev,
      currentScreen: screen
    }));
    syncUrl(screen, replace);
    trackEvent('screen_viewed', { screen });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Initial mount: inspect URL and establish session sync
  useEffect(() => {
    const routeInfo = getScreenFromUrl();
    const storedSession = getUserSession();

    if (storedSession) {
      setUserSession(storedSession);
      // Synchronize access status with verified session products
      if (storedSession.products.includes(PRODUCT_IDS.PLANO_SUCESSAO)) {
        setState((prev) => ({
          ...prev,
          accessStatus: 'succession_unlocked',
          lead: { ...prev.lead, email: storedSession.email || prev.lead.email }
        }));
      } else if (storedSession.products.includes(PRODUCT_IDS.DIAGNOSTICO_COMPLETO)) {
        setState((prev) => ({
          ...prev,
          accessStatus: prev.accessStatus === 'succession_unlocked' ? 'succession_unlocked' : 'diagnostic_paid',
          lead: { ...prev.lead, email: storedSession.email || prev.lead.email }
        }));
      }
    }

    // Set initial screen if specific route requested
    if (routeInfo.screen && routeInfo.screen !== 'intro') {
      handleNavigate(routeInfo.screen, true);
    }

    // Popstate listener for browser back/forward
    const handlePopState = () => {
      const current = getScreenFromUrl();
      if (current.screen) {
        setState((prev) => ({ ...prev, currentScreen: current.screen }));
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Background refresh of user purchases (Items 28 & 29)
  const handleRefreshPurchases = async () => {
    if (!userSession?.email) return;

    setIsRefreshingPurchases(true);
    try {
      const res = await checkPurchaseStatus(userSession.email, userSession.orderId);
      if (res.success && res.products.length > 0) {
        const updatedSession: UserSession = {
          ...userSession,
          products: res.products,
          orderId: res.orderId || userSession.orderId,
          authenticatedAt: new Date().toISOString()
        };
        saveUserSession(updatedSession);
        setUserSession(updatedSession);

        if (res.hasOrderBump && res.products.includes(PRODUCT_IDS.PLANO_SUCESSAO)) {
          setState((prev) => ({
            ...prev,
            accessStatus: 'succession_unlocked'
          }));
          setPaymentAlert('🎉 Seus produtos foram sincronizados com sucesso: Plano de Sucessão de 90 Dias ativo!');
        } else if (res.products.includes(PRODUCT_IDS.DIAGNOSTICO_COMPLETO)) {
          setState((prev) => ({
            ...prev,
            accessStatus: prev.accessStatus === 'succession_unlocked' ? 'succession_unlocked' : 'diagnostic_paid'
          }));
          setPaymentAlert('✓ Seus produtos foram sincronizados com sucesso.');
        }
      }
    } catch (err) {
      console.warn('[Sync] Falha ao sincronizar produtos:', err);
    } finally {
      setIsRefreshingPurchases(false);
    }
  };

  // Handle post-purchase confirmed success from PosCompraView
  const handleConfirmSuccess = (result: NormalizedPurchaseResult) => {
    const updatedLead = {
      ...state.lead,
      email: result.email || state.lead.email,
      nome: result.customerName || state.lead.nome
    };

    const hasPlano = result.hasOrderBump && result.products.includes(PRODUCT_IDS.PLANO_SUCESSAO);
    const newStatus: AccessStatus = hasPlano ? 'succession_unlocked' : 'diagnostic_paid';

    // Instantiate Plano de Sucessão if unlocked
    const plano = state.planoSucessao || gerarPlanoPersonalizado(
      updatedLead.empresa || 'Sua Empresa',
      state.resultado || calcularDiagnostico([], 12, 10),
      state.conhecimentoTacito || { tecnico: [], relacionamentos: [], julgamento: [], cultura: [] }
    );

    const newSession: UserSession = {
      email: result.email,
      orderId: result.orderId,
      customerName: result.customerName,
      products: result.products,
      authenticatedAt: new Date().toISOString()
    };

    saveUserSession(newSession);
    setUserSession(newSession);

    setState((prev) => ({
      ...prev,
      lead: updatedLead,
      accessStatus: newStatus,
      planoSucessao: plano,
      currentScreen: 'hub'
    }));

    if (hasPlano) {
      setPaymentAlert('🎉 Compra confirmada com sucesso! Diagnóstico Completo, Mini-Curso e Plano de Sucessão liberados.');
    } else {
      setPaymentAlert('🎉 Compra confirmada com sucesso! Diagnóstico Completo e Mini-Curso liberados.');
    }

    syncUrl('hub', true);
  };

  // Handle Login success
  const handleLoginSuccess = (result: NormalizedPurchaseResult) => {
    const hasPlano = result.hasOrderBump && result.products.includes(PRODUCT_IDS.PLANO_SUCESSAO);
    const newStatus: AccessStatus = hasPlano ? 'succession_unlocked' : 'diagnostic_paid';

    const newSession: UserSession = {
      email: result.email,
      orderId: result.orderId,
      customerName: result.customerName,
      products: result.products,
      authenticatedAt: new Date().toISOString()
    };

    setUserSession(newSession);

    setState((prev) => ({
      ...prev,
      accessStatus: newStatus,
      lead: {
        ...prev.lead,
        email: result.email,
        nome: result.customerName || prev.lead.nome
      },
      currentScreen: 'hub'
    }));

    setPaymentAlert(`Bem-vindo à sua Área de Membros, ${result.customerName || result.email}!`);
    syncUrl('hub', true);
  };

  // Handle Logout (Item 27)
  const handleLogout = () => {
    clearUserSession();
    setUserSession(null);
    setState((prev) => ({
      ...prev,
      accessStatus: prev.resultado ? 'diagnostic_completed' : 'visitor',
      currentScreen: 'login'
    }));
    trackEvent('user_logout');
    setPaymentAlert('Você saiu da sua conta.');
    syncUrl('login', true);
  };

  // Save to localStorage on state updates
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Reset entire application
  const handleReset = () => {
    clearUserSession();
    setUserSession(null);
    const fresh = resetState();
    setState(fresh);
    trackEvent('app_reset');
    syncUrl('intro', true);
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
      accessStatus: ['diagnostic_paid', 'succession_unlocked', 'succession_paid'].includes(prev.accessStatus)
        ? prev.accessStatus
        : 'diagnostic_pending',
      currentScreen: 'resultado'
    }));
    syncUrl('resultado', true);
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
  const isDarkScreen = ['intro', 'calculando', 'pos-compra', 'login'].includes(state.currentScreen);

  return (
    <div className={`min-h-screen flex flex-col font-['Montserrat'] ${isDarkScreen ? 'bg-black text-white' : 'bg-[#000000] text-[#111111]'}`}>
      {/* Brand Navigation Bar */}
      <BrandHeader
        currentScreen={state.currentScreen}
        accessStatus={state.accessStatus}
        hasResult={Boolean(state.resultado)}
        userSession={userSession}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      {/* Post-Checkout Confirmation Notification Banner */}
      {paymentAlert && (
        <div className="bg-[#00D84F] text-black px-4 py-3 shadow-md animate-fadeIn">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-black" />
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
        
        {/* ROTA PÓS-COMPRA (ITEM 8, 9, 10, 15) */}
        {state.currentScreen === 'pos-compra' && (
          <PosCompraView
            onConfirmSuccess={handleConfirmSuccess}
            onNavigateToHub={() => handleNavigate('hub')}
            onNavigateToLogin={() => handleNavigate('login')}
          />
        )}

        {/* ROTA LOGIN (ITEM 18, 19, 20) */}
        {state.currentScreen === 'login' && (
          <LoginView
            onLoginSuccess={handleLoginSuccess}
            onNavigateToCalculator={() => handleNavigate('intro')}
          />
        )}

        {/* 1. CALCULADORA GRATUITA: INTRO */}
        {state.currentScreen === 'intro' && (
          <LandingIntro
            onStart={() => handleNavigate('perfil')}
          />
        )}

        {/* 1. CALCULADORA GRATUITA: ETAPA 1 (PERFIL) */}
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

        {/* 1. CALCULADORA GRATUITA: ETAPA 2 (CARGOS) */}
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

        {/* CALCULANDO ANIMATION */}
        {state.currentScreen === 'calculando' && (
          <CalculatingSuspense onFinish={handleFinishCalculation} />
        )}

        {/* 2. RESULTADO GRATUITO (ITEM 3 & 4) */}
        {state.currentScreen === 'resultado' && (
          state.resultado ? (
            <DiagnosticResult
              resultado={state.resultado}
              lead={state.lead}
              perfil={state.perfil}
              accessStatus={state.accessStatus}
              onUpdateLead={handleUpdateLead}
              onUpdatePerfil={handleUpdatePerfil}
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

        {/* RAIO-X DE CONHECIMENTO */}
        {state.currentScreen === 'raiox' && (
          <RaioXConhecimento
            conhecimentoTacito={state.conhecimentoTacito}
            onUpdateTacito={handleUpdateTacito}
            resultado={state.resultado}
            onProceedToUpsell={() => handleNavigate('upsell')}
            onBack={() => handleNavigate(state.resultado ? 'resultado' : 'cargos')}
          />
        )}

        {/* UPSELL OFFER */}
        {state.currentScreen === 'upsell' && (
          <UpsellSuccessionOffer
            resultado={state.resultado}
            lead={state.lead}
            hasUnlockedSuccession={['succession_unlocked', 'course_access', 'succession_paid'].includes(state.accessStatus)}
            onUnlockSuccession={openCheckout97}
            onOpenCheckout97={openCheckout97}
            onBack={() => handleNavigate('raiox')}
          />
        )}

        {/* 3. PLANO DE SUCESSÃO (ITEM 24 & 25) */}
        {state.currentScreen === 'plano' && (
          ((['succession_unlocked', 'course_access', 'succession_paid'].includes(state.accessStatus) || userSession?.products?.includes(PRODUCT_IDS.PLANO_SUCESSAO)) && state.planoSucessao) ? (
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
            <div className="max-w-md mx-auto text-center py-12 px-6 bg-white text-neutral-900 rounded-3xl p-8 border border-neutral-200 shadow-xl animate-fadeIn">
              <h2 className="text-xl font-black mb-2 text-neutral-900">Plano de Sucessão</h2>
              <p className="text-xs text-neutral-600 mb-6 leading-relaxed">
                Este conteúdo está bloqueado. O Plano de Sucessão de 90 Dias é liberado automaticamente quando adquirido via Order Bump no checkout oficial.
              </p>
              <button
                onClick={() => handleNavigate('hub')}
                className="px-6 py-3.5 rounded-full bg-neutral-900 hover:bg-black text-white font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                Voltar para Área de Membros
              </button>
            </div>
          )
        )}

        {/* 4. MINI-CURSO: GESTÃO DE PESSOAS-CHAVE (ITEM 23) */}
        {state.currentScreen === 'curso' && (
          <MiniCursoView
            cursoProgresso={state.cursoProgresso}
            onToggleAulaConcluida={handleToggleAulaConcluida}
            onBack={() => handleNavigate('hub')}
            isLocked={!['diagnostic_paid', 'diagnostic_completed', 'succession_unlocked', 'course_access', 'succession_paid'].includes(state.accessStatus) && !userSession?.products?.includes(PRODUCT_IDS.MINI_CURSO)}
            onUnlock={openCheckout67}
          />
        )}

        {/* 5. ÁREA DE MEMBROS (ITEM 21, 22, 23, 24, 27) */}
        {state.currentScreen === 'hub' && (
          <ClientHubView
            accessStatus={state.accessStatus}
            lead={state.lead}
            resultado={state.resultado}
            planoSucessao={state.planoSucessao}
            userSession={userSession}
            onNavigate={handleNavigate}
            onOpenCheckout67={openCheckout67}
            onOpenCheckout97={openCheckout97}
            onLogout={handleLogout}
            onRefreshPurchases={handleRefreshPurchases}
            isRefreshing={isRefreshingPurchases}
          />
        )}
      </main>

      {/* Brand Footer */}
      <BrandFooter isDark={isDarkScreen} />

      {/* Checkout Modal (preserved) */}
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
