import React, { useState, useEffect } from 'react';
import { AccessStatus, DiagnosticoResultado, LeadInfo, PlanoSucessao } from '../types';
import { FexLogo } from './FexLogo';
import { UserSession, saveUserSession, NormalizedPurchaseResult } from '../services/purchaseApi';
import { PRODUCT_IDS } from '../config/products';
import { 
  CheckCircle2, 
  Lock, 
  ArrowRight, 
  PlayCircle, 
  FileSpreadsheet, 
  User, 
  GraduationCap, 
  ExternalLink, 
  ChevronRight, 
  ShieldCheck,
  Calculator,
  LogOut,
  RefreshCw,
  Sparkles,
  Clock
} from 'lucide-react';
import { trackEvent } from '../services/analytics';
import { DIAGNOSTICO_CHECKOUT_URL, buildCheckoutUrl } from '../config/checkout';

interface ClientHubViewProps {
  accessStatus: AccessStatus;
  lead: LeadInfo;
  resultado: DiagnosticoResultado | null;
  planoSucessao: PlanoSucessao | null;
  userSession?: UserSession | null;
  onNavigate: (screen: string) => void;
  onOpenCheckout67: () => void;
  onOpenCheckout97: () => void;
  onLogout?: () => void;
  onRefreshPurchases?: () => void;
  onConfirmSuccess?: (result: NormalizedPurchaseResult) => void;
  isRefreshing?: boolean;
}

export const ClientHubView: React.FC<ClientHubViewProps> = ({
  accessStatus,
  lead,
  resultado,
  planoSucessao,
  userSession,
  onNavigate,
  onOpenCheckout67,
  onOpenCheckout97,
  onLogout,
  onRefreshPurchases,
  onConfirmSuccess,
  isRefreshing = false
}) => {
  const [isVerifyingInFlight, setIsVerifyingInFlight] = useState<boolean>(false);
  const [verificationSuccess, setVerificationSuccess] = useState<boolean>(false);
  const [localConfirmedProducts, setLocalConfirmedProducts] = useState<string[]>(userSession?.products || []);

  // Obter e-mail ativo da melhor fonte disponível
  const activeEmail = (
    userSession?.email ||
    (typeof window !== 'undefined' ? (
      sessionStorage.getItem('fex_current_email') ||
      sessionStorage.getItem('fex_checkout_email') ||
      localStorage.getItem('fex_last_buyer_email')
    ) : '') ||
    lead.email ||
    ''
  ).toLowerCase().trim();

  const activeOrderId = (
    userSession?.orderId ||
    (typeof window !== 'undefined' ? (
      sessionStorage.getItem('fex_current_order_id') ||
      sessionStorage.getItem('fex_checkout_order_id')
    ) : '') ||
    ''
  ).trim();

  // Verificação rigorosa de liberação dos produtos
  const isPostPurchaseActive = typeof window !== 'undefined' && Boolean(
    sessionStorage.getItem('fex_post_purchase_active') === 'true' ||
    localStorage.getItem('fex_post_purchase_active') === 'true'
  );

  const is97Context = typeof window !== 'undefined' && Boolean(
    sessionStorage.getItem('fex_checkout_type') === 'succession_97' ||
    localStorage.getItem('fex_checkout_type') === 'succession_97'
  );

  const hasDiagProduct = Boolean(
    ['diagnostic_paid', 'succession_unlocked', 'succession_paid'].includes(accessStatus) ||
    userSession?.products?.includes(PRODUCT_IDS.DIAGNOSTICO_COMPLETO) ||
    localConfirmedProducts.includes(PRODUCT_IDS.DIAGNOSTICO_COMPLETO) ||
    isPostPurchaseActive
  );

  const hasCursoProduct = Boolean(
    ['diagnostic_paid', 'succession_unlocked', 'succession_paid'].includes(accessStatus) ||
    userSession?.products?.includes(PRODUCT_IDS.MINI_CURSO) ||
    localConfirmedProducts.includes(PRODUCT_IDS.MINI_CURSO) ||
    isPostPurchaseActive
  );

  const hasPlanoProduct = Boolean(
    ['succession_unlocked', 'succession_paid'].includes(accessStatus) ||
    userSession?.products?.includes(PRODUCT_IDS.PLANO_SUCESSAO) ||
    localConfirmedProducts.includes(PRODUCT_IDS.PLANO_SUCESSAO) ||
    (isPostPurchaseActive && is97Context)
  );

  // Redireciona para login SOMENTE se não houver nenhum dado de comprador nem sessão
  useEffect(() => {
    if (!activeEmail && (!userSession || !userSession.email)) {
      onNavigate('login');
    }
  }, [activeEmail, userSession, onNavigate]);

  // Polling em background quando o cliente acabou de voltar do Guru
  // e o webhook ainda não teve tempo de registrar o acesso no servidor
  useEffect(() => {
    if (hasDiagProduct) return; // Acesso já liberado
    if (!activeEmail) return;

    let isSubscribed = true;
    let attempts = 0;
    const maxAttempts = 15; // 30 segundos (15 x 2s)
    let pollTimer: NodeJS.Timeout | null = null;

    setIsVerifyingInFlight(true);

    const checkVerification = async () => {
      attempts++;
      try {
        // 1. Consulta rápida ao /api/access/check (cache do servidor e webhook direto)
        const accessParams = new URLSearchParams();
        accessParams.set('email', activeEmail);
        if (activeOrderId) accessParams.set('transaction_id', activeOrderId);

        const resAccess = await fetch(`/api/access/check?${accessParams.toString()}`);
        if (resAccess.ok) {
          const dataAccess = await resAccess.json();
          if (dataAccess.hasAccess === true) {
            const is97 = dataAccess.productType === 'succession_97';
            const confirmed = is97 
              ? [PRODUCT_IDS.DIAGNOSTICO_COMPLETO, PRODUCT_IDS.MINI_CURSO, PRODUCT_IDS.PLANO_SUCESSAO]
              : [PRODUCT_IDS.DIAGNOSTICO_COMPLETO, PRODUCT_IDS.MINI_CURSO];

            const normalizedRes: NormalizedPurchaseResult = {
              success: true,
              email: activeEmail,
              orderId: activeOrderId || dataAccess.transactionId || '',
              customerName: dataAccess.customerName,
              products: confirmed,
              hasMainProduct: true,
              hasOrderBump: is97
            };

            saveUserSession({
              email: activeEmail,
              orderId: normalizedRes.orderId,
              customerName: normalizedRes.customerName,
              products: confirmed,
              authenticatedAt: new Date().toISOString()
            });

            if (isSubscribed) {
              setLocalConfirmedProducts(confirmed);
              setIsVerifyingInFlight(false);
              setVerificationSuccess(true);
              if (onConfirmSuccess) onConfirmSuccess(normalizedRes);
              if (onRefreshPurchases) onRefreshPurchases();
            }

            if (pollTimer) clearInterval(pollTimer);
            return;
          }
        }

        // 2. Consulta alternativa ao /api/check-purchase (n8n proxy)
        const purchaseParams = new URLSearchParams();
        purchaseParams.set('email', activeEmail);
        if (activeOrderId) purchaseParams.set('pedido', activeOrderId);

        const resPurchase = await fetch(`/api/check-purchase?${purchaseParams.toString()}`);
        if (resPurchase.ok) {
          const dataPurchase = await resPurchase.json();
          if (dataPurchase.success === true && dataPurchase.data) {
            const rawProds = (dataPurchase.data.podutos || dataPurchase.data.produtos || '').toLowerCase();
            const is97 = rawProds.includes('sucessao') || rawProds.includes('order bump') || rawProds.includes('97');
            const confirmed = is97 
              ? [PRODUCT_IDS.DIAGNOSTICO_COMPLETO, PRODUCT_IDS.MINI_CURSO, PRODUCT_IDS.PLANO_SUCESSAO]
              : [PRODUCT_IDS.DIAGNOSTICO_COMPLETO, PRODUCT_IDS.MINI_CURSO];

            const normalizedRes: NormalizedPurchaseResult = {
              success: true,
              email: activeEmail,
              orderId: activeOrderId || dataPurchase.data.pedido || '',
              customerName: dataPurchase.data.nome,
              products: confirmed,
              hasMainProduct: true,
              hasOrderBump: is97
            };

            saveUserSession({
              email: activeEmail,
              orderId: normalizedRes.orderId,
              customerName: normalizedRes.customerName,
              products: confirmed,
              authenticatedAt: new Date().toISOString()
            });

            if (isSubscribed) {
              setLocalConfirmedProducts(confirmed);
              setIsVerifyingInFlight(false);
              setVerificationSuccess(true);
              if (onConfirmSuccess) onConfirmSuccess(normalizedRes);
              if (onRefreshPurchases) onRefreshPurchases();
            }

            if (pollTimer) clearInterval(pollTimer);
            return;
          }
        }
      } catch (err) {
        console.warn('[HubVerification] Polling error:', err);
      }

      if (attempts >= maxAttempts) {
        if (isSubscribed) {
          setIsVerifyingInFlight(false);
        }
        if (pollTimer) clearInterval(pollTimer);
      }
    };

    // Execução inicial imediata
    checkVerification();

    // Polling a cada 2 segundos
    pollTimer = setInterval(checkVerification, 2000);

    return () => {
      isSubscribed = false;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [hasDiagProduct, activeEmail, activeOrderId, onConfirmSuccess, onRefreshPurchases]);

  // Sincronização em background ao montar para contas já logadas
  useEffect(() => {
    if (onRefreshPurchases && userSession?.email) {
      onRefreshPurchases();
    }
  }, []);

  const hasResult = Boolean(resultado);
  const saudacaoNome = userSession?.customerName || (lead.nome ? lead.nome.split(' ')[0] : '');

  const handleIrParaOfertaOuCheckout = () => {
    trackEvent('hub_unlock_cta_click');
    if (hasResult) {
      onNavigate('resultado');
    } else {
      window.location.href = buildCheckoutUrl({
        email: activeEmail,
        name: saudacaoNome,
        phone: lead.whatsapp,
        company: lead.empresa
      });
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-6 sm:py-10 px-4 sm:px-6 animate-fadeIn">
      
      {/* Banner de Verificação em Andamento (Quando o webhook do Guru ainda está a caminho) */}
      {isVerifyingInFlight && (
        <div className="mb-6 p-4 rounded-2xl bg-black text-white border border-[#00D84F]/40 flex items-center justify-between gap-4 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-[#00D84F] animate-spin shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-white">
                Confirmando aprovação do pagamento com o Digital Manager Guru...
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Identificando seus produtos em tempo real. Seus acessos serão liberados automaticamente nesta tela.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#00D84F] bg-[#00D84F]/10 px-3 py-1 rounded-full border border-[#00D84F]/30 shrink-0 hidden sm:inline-block">
            Sincronizando
          </span>
        </div>
      )}

      {/* Banner de Confirmação Imediata */}
      {verificationSuccess && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex items-center gap-3 shadow-md animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-xs sm:text-sm font-black text-emerald-900">
              Pagamento aprovado com sucesso!
            </p>
            <p className="text-[11px] text-emerald-700 font-medium">
              Seus módulos foram identificados e liberados abaixo. Aproveite seus conteúdos!
            </p>
          </div>
        </div>
      )}

      {/* Top Welcome Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#00D84F] bg-black px-3 py-0.5 rounded-full inline-block">
                Faculdade FEX Educação
              </span>
              <span className="text-xs font-semibold text-neutral-500">
                Plataforma de Governança
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-black text-neutral-900 tracking-tight">
              Área de Membros
            </h1>
            <p className="text-sm sm:text-base font-semibold text-neutral-600 mt-1">
              Seus produtos
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {activeEmail && (
              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3.5 min-w-[200px]">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    Conta Ativa
                  </span>
                  {onRefreshPurchases && (
                    <button
                      onClick={onRefreshPurchases}
                      disabled={isRefreshing || isVerifyingInFlight}
                      className="text-[11px] text-neutral-600 hover:text-black flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Sincronizar compras com a API"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRefreshing || isVerifyingInFlight ? 'animate-spin' : ''}`} />
                      <span>Atualizar</span>
                    </button>
                  )}
                </div>
                <p className="text-xs font-bold text-neutral-900 truncate max-w-[220px]">
                  {saudacaoNome || activeEmail}
                </p>
                <p className="text-[11px] text-neutral-500 truncate max-w-[220px]">
                  {activeEmail}
                </p>
              </div>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold transition-all cursor-pointer border border-neutral-200"
                title="Sair da sessão e retornar ao login"
              >
                <LogOut className="w-4 h-4 text-neutral-500" />
                <span>Sair</span>
              </button>
            )}
          </div>
        </div>

        {/* Free Calculator Access Strip */}
        <div className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-neutral-50 border border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black text-[#00D84F] flex items-center justify-center shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mb-1">
                  {hasResult ? '✓ Cálculo Realizado' : '✓ Acesso Gratuito'}
                </span>
                <p className="text-xs font-bold text-neutral-900">
                  Calculadora de Risco de Pessoas-Chave
                </p>
                <p className="text-[11px] text-neutral-600">
                  {hasResult ? 'Seus dados de risco continuam salvos neste navegador.' : 'Simule o custo oculto de reposição dos seus cargos críticos.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate(hasResult ? 'resultado' : 'cargos')}
              className="px-5 py-2.5 rounded-full bg-neutral-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              {hasResult ? 'Ver Resultado do Cálculo' : 'Fazer Calculadora Gratuita'}
            </button>
          </div>
        </div>
      </div>

      {/* QUICK-ACCESS BANNER PARA COMPRADORES */}
      {hasDiagProduct && (
        <div className="mb-8 p-6 sm:p-7 rounded-3xl bg-black text-white border-2 border-[#00D84F] shadow-2xl relative overflow-hidden animate-fadeIn">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#00D84F]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#00D84F] text-black flex items-center justify-center shrink-0 shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-black bg-[#00D84F] px-2.5 py-0.5 rounded-full">
                    Acesso Confirmado
                  </span>
                  <span className="text-xs font-semibold text-emerald-400">
                    ✓ Seus conteúdos estão 100% liberados
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Pronto para começar? Escolha por onde avançar:
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 mt-1 max-w-xl leading-relaxed">
                  Acesse o relatório executivo completo com Raio-X do Conhecimento Tácito ou inicie as aulas práticas do Curso.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto shrink-0">
              <button
                onClick={() => {
                  trackEvent('hub_quick_diagnostic_click');
                  if (hasResult) {
                    onNavigate('resultado');
                  } else {
                    onNavigate('cargos');
                  }
                }}
                className="flex-1 sm:flex-initial px-6 py-3.5 rounded-full bg-[#00D84F] hover:bg-[#25eb69] text-black font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#00D84F]/25 cursor-pointer active:scale-98"
              >
                <FileSpreadsheet className="w-4 h-4 text-black" />
                <span>Abrir Diagnóstico Completo</span>
              </button>

              <button
                onClick={() => {
                  trackEvent('hub_quick_minicurso_click');
                  onNavigate('curso');
                }}
                className="flex-1 sm:flex-initial px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-white/20 cursor-pointer active:scale-98"
              >
                <PlayCircle className="w-4 h-4 text-[#00D84F]" />
                <span>Ver Curso</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS SECTION */}
      <div className="space-y-6 mb-8">

        {/* 1. CARD DO DIAGNÓSTICO */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm transition-all hover:shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                hasDiagProduct ? 'bg-black text-[#00D84F]' : 'bg-neutral-100 text-neutral-400'
              }`}>
                {hasDiagProduct ? <FileSpreadsheet className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  {hasDiagProduct ? (
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>✓ Disponível</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-black uppercase tracking-wider text-neutral-700 bg-neutral-100 px-3 py-0.5 rounded-full flex items-center gap-1 border border-neutral-200">
                      <Lock className="w-3 h-3 text-neutral-500" />
                      <span>🔒 Bloqueado</span>
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Produto Principal
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                  Diagnóstico Completo
                </h2>

                <p className="text-xs sm:text-sm text-neutral-600 mt-1.5 max-w-2xl leading-relaxed">
                  Relatório executivo estruturado para diretoria e conselho, com inventário de conhecimentos tácitos, detalhamento FMEA dos cargos críticos e exportação oficial.
                </p>
              </div>
            </div>

            <div className="lg:shrink-0 w-full lg:w-auto pt-2 lg:pt-0">
              {hasDiagProduct ? (
                <button
                  onClick={() => {
                    trackEvent('hub_access_diagnostic_click');
                    if (hasResult) {
                      onNavigate('resultado');
                    } else {
                      onNavigate('cargos');
                    }
                  }}
                  className="w-full lg:w-auto px-8 py-3.5 rounded-full bg-[#00D84F] hover:bg-[#25eb69] text-black font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#00D84F]/20 active:scale-98"
                >
                  <span>Acessar</span>
                  <ChevronRight className="w-4 h-4 text-black" />
                </button>
              ) : (
                <button
                  onClick={handleIrParaOfertaOuCheckout}
                  className="w-full lg:w-auto px-7 py-3.5 rounded-full bg-neutral-900 hover:bg-black text-white font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                >
                  <span>Adquirir por R$ 67</span>
                  <ArrowRight className="w-4 h-4 text-[#00D84F]" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. CARD DO CURSO */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-sm transition-all hover:shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                hasCursoProduct ? 'bg-black text-[#00D84F]' : 'bg-neutral-100 text-neutral-400'
              }`}>
                {hasCursoProduct ? <PlayCircle className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  {hasCursoProduct ? (
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>✓ Disponível</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-black uppercase tracking-wider text-neutral-700 bg-neutral-100 px-3 py-0.5 rounded-full flex items-center gap-1 border border-neutral-200">
                      <Lock className="w-3 h-3 text-neutral-500" />
                      <span>🔒 Bloqueado</span>
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2.5 py-0.5 rounded-full">
                    4 Vídeo-Aulas FEX
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                  Curso: Gestão de Pessoas-Chave
                </h2>

                <p className="text-xs sm:text-sm text-neutral-600 mt-1.5 max-w-2xl leading-relaxed">
                  Metodologia prática com os fundadores da Faculdade FEX Educação para retenção de conhecimento tácito e governança de pessoas-chave.
                </p>

                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
                  <span className="font-semibold text-neutral-700">Aula 01, 02, 03 e 04</span>
                  <span>•</span>
                  <span>Metodologia Atitude Emocional®</span>
                  <span>•</span>
                  <span>Faculdade FEX</span>
                </div>
              </div>
            </div>

            <div className="lg:shrink-0 w-full lg:w-auto pt-2 lg:pt-0">
              {hasCursoProduct ? (
                <button
                  onClick={() => {
                    trackEvent('hub_access_minicurso_click');
                    onNavigate('curso');
                  }}
                  className="w-full lg:w-auto px-8 py-3.5 rounded-full bg-[#00D84F] hover:bg-[#25eb69] text-black font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#00D84F]/20 active:scale-98"
                >
                  <span>Acessar</span>
                  <ChevronRight className="w-4 h-4 text-black" />
                </button>
              ) : (
                <button
                  onClick={handleIrParaOfertaOuCheckout}
                  className="w-full lg:w-auto px-7 py-3.5 rounded-full bg-neutral-900 hover:bg-black text-white font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
                >
                  <span>Liberar no Diagnóstico</span>
                  <ArrowRight className="w-4 h-4 text-[#00D84F]" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3. CARD DO PLANO DE SUCESSÃO */}
        <div className={`rounded-3xl p-6 sm:p-8 border transition-all ${
          hasPlanoProduct 
            ? 'bg-white border-neutral-200/90 shadow-sm hover:shadow-md' 
            : 'bg-neutral-50 border-neutral-200 opacity-95'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                hasPlanoProduct ? 'bg-black text-[#00D84F]' : 'bg-neutral-200 text-neutral-500'
              }`}>
                {hasPlanoProduct ? <Sparkles className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  {hasPlanoProduct ? (
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>✓ Disponível</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-black uppercase tracking-wider text-neutral-700 bg-neutral-200 px-3 py-0.5 rounded-full flex items-center gap-1 border border-neutral-300">
                      <Lock className="w-3 h-3 text-neutral-600" />
                      <span>🔒 Bloqueado</span>
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    Order Bump
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                  Plano de Sucessão de 90 Dias
                </h2>

                <p className="text-xs sm:text-sm text-neutral-600 mt-1.5 max-w-2xl leading-relaxed">
                  {hasPlanoProduct
                    ? 'Plano cronológico estruturado em 5 fases para mapear, preparar sucessores, documentar processos críticos e blindar a continuidade da empresa.'
                    : 'Plano cronológico estruturado em 5 fases para substituição e continuidade operacional. Liberado automaticamente quando adquirido via Order Bump no checkout.'}
                </p>
              </div>
            </div>

            <div className="lg:shrink-0 w-full lg:w-auto pt-2 lg:pt-0">
              {hasPlanoProduct ? (
                <button
                  onClick={() => {
                    trackEvent('hub_access_plano_click');
                    onNavigate('plano');
                  }}
                  className="w-full lg:w-auto px-8 py-3.5 rounded-full bg-[#00D84F] hover:bg-[#25eb69] text-black font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#00D84F]/20 active:scale-98"
                >
                  <span>Acessar</span>
                  <ChevronRight className="w-4 h-4 text-black" />
                </button>
              ) : (
                <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-neutral-200 text-neutral-600 text-xs font-bold border border-neutral-300">
                  <Lock className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Disponível no Order Bump</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Advisory Support Banner */}
      <div className="rounded-3xl bg-neutral-100 border border-neutral-200/90 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-600 mb-1">
            <GraduationCap className="w-4 h-4 text-[#00D84F]" />
            <span>Faculdade FEX Educação</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-neutral-900">
            Dúvidas ou precisa de extensão corporativa para sua diretoria?
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1 max-w-2xl leading-relaxed">
            Nossa equipe executiva apoia empresas na implementação presencial ou remota da governança de conhecimento e planos de continuidade de liderança.
          </p>
        </div>

        <a
          href="https://fexeducacao.edu.br"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 px-6 py-3 rounded-full bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer text-center"
        >
          <span>Portal Institucional</span>
          <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
        </a>
      </div>
    </div>
  );
};
