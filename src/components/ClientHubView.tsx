import React from 'react';
import { AccessStatus, DiagnosticoResultado, LeadInfo, PlanoSucessao } from '../types';
import { formatarMoeda } from '../utils/calculations';
import { FexLogo } from './FexLogo';
import { 
  CheckCircle2, 
  Lock, 
  ArrowRight, 
  PlayCircle, 
  FileSpreadsheet, 
  ShieldAlert, 
  Sparkles,
  User,
  GraduationCap,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { trackEvent } from '../services/analytics';
import { CHECKOUT_URL_97 } from './CheckoutModal';

interface ClientHubViewProps {
  accessStatus: AccessStatus;
  lead: LeadInfo;
  resultado: DiagnosticoResultado | null;
  planoSucessao: PlanoSucessao | null;
  onNavigate: (screen: string) => void;
  onOpenCheckout67: () => void;
  onOpenCheckout97: () => void;
}

export const ClientHubView: React.FC<ClientHubViewProps> = ({
  accessStatus,
  lead,
  resultado,
  planoSucessao,
  onNavigate,
  onOpenCheckout67,
  onOpenCheckout97
}) => {
  // Access rules:
  // R$67 or R$97 both have full access to Diagnostic and Mini-Course
  // Succession Plan is unlocked ONLY for confirmed R$97 payment
  const isPaid67 = ['diagnostic_paid', 'succession_unlocked', 'succession_paid'].includes(accessStatus);
  const isPaid97 = ['succession_unlocked', 'succession_paid'].includes(accessStatus);
  const isDiagCompleted = Boolean(resultado) && isPaid67;

  const saudacaoNome = lead.nome ? lead.nome.split(' ')[0] : '';

  const handleOpenCheckout97 = () => {
    trackEvent('hub_upsell_97_click');
    onOpenCheckout97();
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-6 sm:py-10 px-4 sm:px-6 animate-fadeIn">
      {/* Top Welcome Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-neutral-100">
          <div>
            <div className="mb-3">
              <FexLogo variant="light" size="md" />
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 mt-1">
              {saudacaoNome ? `Olá, ${saudacaoNome}! Seja bem-vindo à sua Área do Cliente.` : 'Olá! Seja bem-vindo à sua Área do Cliente.'}
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 mt-2 max-w-2xl leading-relaxed">
              Acesse seus conteúdos, acompanhe seu diagnóstico e continue sua jornada de desenvolvimento.
            </p>
          </div>

          {/* User badge if lead has data */}
          {lead.nome && (
            <div className="self-start md:self-auto bg-neutral-50 border border-neutral-200/90 rounded-2xl p-4 min-w-[240px]">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-500 mb-1">
                <User className="w-3.5 h-3.5 text-[#00D84F]" />
                <span>Perfil Corporativo</span>
              </div>
              <p className="text-sm font-bold text-neutral-900 truncate">{lead.nome}</p>
              <p className="text-xs text-neutral-600 truncate">{lead.cargo} {lead.empresa ? `• ${lead.empresa}` : ''}</p>
            </div>
          )}
        </div>

        {/* Summary Journey Strip */}
        <div className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-400">
              Sua jornada na FEX Educação
            </span>
            <span className="text-xs font-semibold text-neutral-500">
              {isPaid97 ? '3 de 3 soluções ativas' : isPaid67 ? '2 de 3 soluções ativas' : '0 de 3 soluções ativas'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Step 1: Diagnóstico */}
            <div className={`flex items-center justify-between p-3 rounded-xl border ${
              isPaid67 ? 'bg-neutral-50 border-neutral-200/70' : 'bg-neutral-100/80 border-neutral-200'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-2 h-2 rounded-full ${isPaid67 ? 'bg-[#00D84F]' : 'bg-neutral-400'}`}></div>
                <span className="text-xs font-bold text-neutral-900 truncate">Diagnóstico</span>
              </div>
              {isPaid67 ? (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {isDiagCompleted ? '✓ Concluído' : '✓ Liberado'}
                </span>
              ) : (
                <span className="text-[11px] font-bold text-neutral-700 bg-neutral-200/80 px-2 py-0.5 rounded-full whitespace-nowrap">
                  🔒 R$ 67
                </span>
              )}
            </div>

            {/* Step 2: Mini-Curso */}
            <div className={`flex items-center justify-between p-3 rounded-xl border ${
              isPaid67 ? 'bg-neutral-50 border-neutral-200/70' : 'bg-neutral-100/80 border-neutral-200'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-2 h-2 rounded-full ${isPaid67 ? 'bg-[#00D84F]' : 'bg-neutral-400'}`}></div>
                <span className="text-xs font-bold text-neutral-900 truncate">Mini-Curso</span>
              </div>
              {isPaid67 ? (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full whitespace-nowrap">
                  ✓ Liberado
                </span>
              ) : (
                <span className="text-[11px] font-bold text-neutral-700 bg-neutral-200/80 px-2 py-0.5 rounded-full whitespace-nowrap">
                  🔒 Bloqueado
                </span>
              )}
            </div>

            {/* Step 3: Plano de Sucessão */}
            <div className={`flex items-center justify-between p-3 rounded-xl border ${
              isPaid97 
                ? 'bg-neutral-50 border-neutral-200/70' 
                : 'bg-amber-50/50 border-amber-200/60'
            }`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-2 h-2 rounded-full ${isPaid97 ? 'bg-[#00D84F]' : 'bg-amber-400'}`}></div>
                <span className="text-xs font-bold text-neutral-900 truncate">Plano de Sucessão</span>
              </div>
              {isPaid97 ? (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full whitespace-nowrap">
                  ✓ Liberado
                </span>
              ) : (
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full whitespace-nowrap">
                  🔒 R$ 97
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* THREE MAIN PRODUCT CARDS */}
      <div className="space-y-6 mb-10">
        {/* CARD 01 — DIAGNÓSTICO */}
        <div className={`rounded-3xl p-6 sm:p-8 border transition-all shadow-sm ${
          isPaid67 ? 'bg-white border-neutral-200 hover:border-neutral-300' : 'bg-white border-neutral-300/80'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                isPaid67 ? 'bg-black text-[#00D84F]' : 'bg-neutral-900 text-neutral-300'
              }`}>
                {isPaid67 ? <FileSpreadsheet className="w-7 h-7" /> : <Lock className="w-7 h-7 text-neutral-400" />}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                  {isPaid67 ? (
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full">
                      ✓ Acesso liberado
                    </span>
                  ) : (
                    <span className="text-[11px] font-black uppercase tracking-wider text-neutral-800 bg-neutral-200 px-3 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Bloqueado • R$ 67,00</span>
                    </span>
                  )}
                  {isDiagCompleted && (
                    <span className="text-[11px] font-bold text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded-full">
                      Cálculo pronto
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                  Diagnóstico de Custo da Pessoa-Chave
                </h2>

                <p className="text-sm text-neutral-600 mt-2 max-w-2xl leading-relaxed">
                  {isPaid67
                    ? 'Identifique os riscos, custos e impactos da dependência de pessoas-chave na sua organização.'
                    : 'Mapeie o impacto financeiro, custos de substituição e vulnerabilidade tácita dos seus cargos mais críticos. Libere a memória de cálculo e exportação por R$ 67,00.'}
                </p>

                {resultado && isPaid67 && (
                  <div className="mt-3 p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 inline-flex flex-wrap items-center gap-3 text-xs">
                    <span className="text-neutral-500">Risco identificado:</span>
                    <span className="font-extrabold text-neutral-900 text-sm">
                      {formatarMoeda(resultado.custoTotal)}
                    </span>
                    <span className="text-neutral-300">•</span>
                    <span className="text-neutral-600">
                      {resultado.cargosCalculados.length} cargo(s) mapeado(s)
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:shrink-0 w-full lg:w-auto pt-2 lg:pt-0">
              {isPaid67 ? (
                <button
                  onClick={() => {
                    trackEvent('hub_access_diagnostic_click');
                    if (resultado) {
                      onNavigate('resultado');
                    } else {
                      onNavigate('cargos');
                    }
                  }}
                  className="w-full lg:w-auto px-7 py-3.5 rounded-full bg-black hover:bg-neutral-800 text-white font-extrabold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow active:scale-98"
                >
                  <span>Acessar diagnóstico</span>
                  <ChevronRight className="w-4 h-4 text-[#00D84F]" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    trackEvent('hub_unlock_diagnostic_click');
                    if (resultado) {
                      onNavigate('resultado');
                    } else {
                      onNavigate('cargos');
                    }
                  }}
                  className="w-full lg:w-auto px-7 py-3.5 rounded-full bg-[#00D84F] hover:bg-[#25eb69] text-black font-extrabold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#00D84F]/20 active:scale-98"
                >
                  <span>{resultado ? 'Desbloquear por R$ 67' : 'Iniciar Diagnóstico'}</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CARD 02 — MINI-CURSO */}
        <div className={`rounded-3xl p-6 sm:p-8 border transition-all shadow-sm ${
          isPaid67 ? 'bg-white border-neutral-200 hover:border-neutral-300' : 'bg-neutral-900 text-white border-neutral-800'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                isPaid67 ? 'bg-black text-[#00D84F]' : 'bg-black/60 text-neutral-400 border border-white/10'
              }`}>
                {isPaid67 ? <PlayCircle className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                  {isPaid67 ? (
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full">
                      ✓ Acesso liberado
                    </span>
                  ) : (
                    <span className="text-[11px] font-black uppercase tracking-wider text-neutral-300 bg-white/10 border border-white/10 px-3 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3 text-[#00D84F]" />
                      <span>Bloqueado • Incluso no Diagnóstico (R$ 67)</span>
                    </span>
                  )}
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                    isPaid67 ? 'text-neutral-600 bg-neutral-100' : 'text-neutral-400 bg-white/5'
                  }`}>
                    4 Aulas Exclusivas
                  </span>
                </div>

                <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isPaid67 ? 'text-neutral-900' : 'text-white'}`}>
                  Mini-Curso: Gestão de Pessoas-Chave
                </h2>

                <p className={`text-sm mt-2 max-w-2xl leading-relaxed ${isPaid67 ? 'text-neutral-600' : 'text-neutral-300'}`}>
                  {isPaid67
                    ? 'Aprenda conceitos e ferramentas para fortalecer a gestão de pessoas-chave e preparar sua organização para o futuro.'
                    : 'Mini-curso prático em 4 vídeo-aulas ministrado pelos fundadores da FEX Educação. Incluso automaticamente na aquisição do Diagnóstico de R$ 67,00.'}
                </p>

                <div className={`mt-3 flex flex-wrap items-center gap-2 text-xs ${isPaid67 ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  <span className={isPaid67 ? 'font-semibold text-neutral-800' : 'font-semibold text-white'}>Faculdade FEX Educação</span>
                  <span>•</span>
                  <span>Metodologia Atitude Emocional®</span>
                  <span>•</span>
                  <span>Acesso vitalício</span>
                </div>
              </div>
            </div>

            <div className="lg:shrink-0 w-full lg:w-auto pt-2 lg:pt-0">
              {isPaid67 ? (
                <button
                  onClick={() => {
                    trackEvent('hub_access_minicurso_click');
                    onNavigate('curso');
                  }}
                  className="w-full lg:w-auto px-7 py-3.5 rounded-full bg-[#00D84F] hover:bg-[#25eb69] text-black font-extrabold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#00D84F]/20 active:scale-98"
                >
                  <span>Acessar minicurso</span>
                  <ChevronRight className="w-4 h-4 text-black" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    trackEvent('hub_unlock_minicurso_click');
                    if (resultado) {
                      onNavigate('resultado');
                    } else {
                      onOpenCheckout67();
                    }
                  }}
                  className="w-full lg:w-auto px-7 py-3.5 rounded-full bg-[#00D84F] hover:bg-[#25eb69] text-black font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#00D84F]/20 active:scale-98"
                >
                  <span>Liberar no Diagnóstico (R$ 67)</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* CARD 03 — PLANO DE SUCESSÃO */}
        <div className={`rounded-3xl p-6 sm:p-8 border transition-all shadow-sm ${
          isPaid97 
            ? 'bg-white border-neutral-200 hover:border-neutral-300' 
            : 'bg-neutral-900 text-white border-neutral-800'
        }`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                isPaid97 ? 'bg-black text-[#00D84F]' : 'bg-black/60 text-amber-400 border border-white/10'
              }`}>
                {isPaid97 ? <ShieldCheck className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                  {isPaid97 ? (
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-0.5 rounded-full">
                      ✓ Acesso liberado
                    </span>
                  ) : (
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-500/30 px-3 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Acesso exclusivo</span>
                    </span>
                  )}
                </div>

                <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isPaid97 ? 'text-neutral-900' : 'text-white'}`}>
                  Plano de Sucessão
                </h2>

                <p className={`text-sm mt-2 max-w-2xl leading-relaxed ${isPaid97 ? 'text-neutral-600' : 'text-neutral-300'}`}>
                  Transforme o diagnóstico em um plano prático para preparar sucessores e reduzir riscos na sua organização.
                </p>

                {!isPaid97 && (
                  <p className="text-xs text-amber-400 font-bold mt-3 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Desbloqueie seu Plano de Sucessão completo.</span>
                  </p>
                )}
              </div>
            </div>

            <div className="lg:shrink-0 w-full lg:w-auto pt-2 lg:pt-0">
              {isPaid97 ? (
                <button
                  onClick={() => {
                    trackEvent('hub_access_plano_click');
                    onNavigate('plano');
                  }}
                  className="w-full lg:w-auto px-7 py-3.5 rounded-full bg-black hover:bg-neutral-800 text-white font-extrabold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow active:scale-98"
                >
                  <span>Acessar Plano de Sucessão</span>
                  <ChevronRight className="w-4 h-4 text-[#00D84F]" />
                </button>
              ) : (
                <button
                  onClick={handleOpenCheckout97}
                  className="w-full lg:w-auto px-7 py-3.5 rounded-full bg-[#00D84F] hover:bg-[#25eb69] text-black font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#00D84F]/20 active:scale-98"
                >
                  <span>Desbloquear por R$97</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </button>
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
