import React, { useEffect } from 'react';
import { AccessStatus, DiagnosticoResultado, LeadInfo, PlanoSucessao } from '../types';
import { FexLogo } from './FexLogo';
import { UserSession } from '../services/purchaseApi';
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
  Sparkles
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
  isRefreshing = false
}) => {
  // Rigorous verification of confirmed products from session or confirmed status
  const hasDiagProduct = Boolean(
    ['diagnostic_paid', 'succession_unlocked', 'succession_paid'].includes(accessStatus) ||
    (userSession && userSession.products?.includes(PRODUCT_IDS.DIAGNOSTICO_COMPLETO))
  );

  const hasCursoProduct = Boolean(
    ['diagnostic_paid', 'succession_unlocked', 'succession_paid'].includes(accessStatus) ||
    (userSession && userSession.products?.includes(PRODUCT_IDS.MINI_CURSO))
  );

  const hasPlanoProduct = Boolean(
    ['succession_unlocked', 'succession_paid'].includes(accessStatus) ||
    (userSession && userSession.products?.includes(PRODUCT_IDS.PLANO_SUCESSAO))
  );

  // Item 17: Se a sessão não existir ao acessar /area-do-cliente, redirecionar para /login imediatamente
  useEffect(() => {
    if (!userSession || !userSession.email || !userSession.products || userSession.products.length === 0) {
      onNavigate('login');
    }
  }, [userSession, onNavigate]);

  // Item 18: Ao acessar a área do cliente, sincronizar silenciosamente em background para identificar compras subsequentes
  useEffect(() => {
    if (onRefreshPurchases && userSession?.email) {
      onRefreshPurchases();
    }
  }, []);

  const hasResult = Boolean(resultado);
  const activeEmail = userSession?.email || lead.email || '';
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
            
            {/* Title & Subtitle per prompt item 21 */}
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
                      disabled={isRefreshing}
                      className="text-[11px] text-neutral-600 hover:text-black flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Sincronizar compras com a API"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
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

        {/* Free Calculator Access Strip (Preserved) */}
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

      {/* PRODUCTS SECTION (CARDS ALIGNED WITH ITEMS 21, 22, 23, 24) */}
      <div className="space-y-6 mb-8">

        {/* 1. CARD DO DIAGNÓSTICO (ITEM 22) */}
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

        {/* 2. CARD DO MINI-CURSO (ITEM 23) */}
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
                  Mini-Curso
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

        {/* 3. CARD DO PLANO DE SUCESSÃO (ITEM 24) */}
        {/* Se comprado: ✓ Disponível [Acessar] | Se não comprado: 🔒 Bloqueado (Sem checkout separado) */}
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
                  Plano de Sucessão
                </h2>

                <p className="text-xs sm:text-sm text-neutral-600 mt-1.5 max-w-2xl leading-relaxed">
                  {hasPlanoProduct
                    ? 'Plano cronológico estruturado em 5 fases para mapear, preparar sucessores, documentar processos críticos e blindar a continuidade da empresa.'
                    : 'Plano cronológico estruturado em 5 fases para substituição e continuidade operacional. Liberado exclusivamente via Order Bump na confirmação de pagamento pela API.'}
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
