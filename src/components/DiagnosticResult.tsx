import React, { useState } from 'react';
import { DiagnosticoResultado, LeadInfo, AccessStatus, PerfilEmpresa } from '../types';
import { formatarMoeda, LABEL_CLASSIFICACAO, DESCRICAO_CLASSIFICACAO } from '../utils/calculations';
import { FexLogo } from './FexLogo';
import { 
  AlertTriangle, 
  ShieldCheck, 
  HelpCircle, 
  ArrowRight, 
  Share2, 
  Printer, 
  CheckCircle2, 
  Sliders,
  Lock,
  Sparkles,
  ExternalLink,
  LayoutDashboard,
  ShieldAlert,
  GraduationCap,
  PlayCircle,
  FileSpreadsheet
} from 'lucide-react';
import { trackEvent } from '../services/analytics';
import { DIAGNOSTICO_CHECKOUT_URL } from '../config/checkout';
import { sendLeadToN8n } from '../services/webhook';

interface DiagnosticResultProps {
  resultado: DiagnosticoResultado;
  lead: LeadInfo;
  perfil?: PerfilEmpresa;
  accessStatus: AccessStatus;
  onUpdateLead: (lead: LeadInfo) => void;
  onUpdateParams: (meses: number, perda: number) => void;
  onProceedToRaioX: () => void;
  onPrint: () => void;
  onOpenCheckout67: () => void;
  onNavigateToHub: () => void;
}

export const DiagnosticResult: React.FC<DiagnosticResultProps> = ({
  resultado,
  lead,
  perfil,
  accessStatus,
  onUpdateLead,
  onUpdateParams,
  onProceedToRaioX,
  onPrint,
  onOpenCheckout67,
  onNavigateToHub
}) => {
  const [showMemoria, setShowMemoria] = useState(false);
  const [showLeadFields, setShowLeadFields] = useState(false);
  const [leadErrors, setLeadErrors] = useState<Record<string, string>>({});
  const [shareCopied, setShareCopied] = useState(false);
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);

  // Check if diagnostic complete deliverable & mini-course is unlocked by confirmed payment
  const isUnlocked = ['diagnostic_paid', 'succession_unlocked', 'succession_paid'].includes(accessStatus);

  const { cargosCalculados, custoTotal, nivelGeral, mesesRampa, percentualPerda } = resultado;

  const validateLead = (): boolean => {
    const errors: Record<string, string> = {};
    if (showLeadFields) {
      if (!lead.nome.trim()) errors.nome = 'Digite seu nome completo.';
      if (!lead.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
        errors.email = 'Digite um e-mail corporativo válido.';
      }
      if (!lead.whatsapp.trim() || lead.whatsapp.replace(/\D/g, '').length < 10) {
        errors.whatsapp = 'Digite um telefone/WhatsApp válido com DDD.';
      }
      if (!lead.empresa.trim()) errors.empresa = 'Informe o nome da sua empresa.';
    }
    setLeadErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGoToCheckout67 = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateLead()) return;

    setIsSendingWebhook(true);

    trackEvent('lead_captured_pre_checkout', {
      ...lead,
      nivelGeral,
      custoTotal
    });

    // Build clean checkout URL with standard buyer pre-fill parameters only
    const checkoutParams = new URLSearchParams();
    if (lead.nome) checkoutParams.set('name', lead.nome);
    if (lead.email) checkoutParams.set('email', lead.email);
    if (lead.whatsapp) {
      const rawPhone = lead.whatsapp.replace(/\D/g, '');
      checkoutParams.set('phone', rawPhone || lead.whatsapp);
    }
    if (lead.empresa) checkoutParams.set('company', lead.empresa);
    
    const fullCheckoutUrl = DIAGNOSTICO_CHECKOUT_URL + (checkoutParams.toString() ? `?${checkoutParams.toString()}` : '');

    // Send lead to n8n webhook (low-ticket B2B funnel)
    try {
      await sendLeadToN8n({
        lead,
        resultado,
        perfil,
        etapaOrigem: 'diagnostico_pre_checkout'
      });
    } catch (err) {
      console.warn('[FEX] Webhook error handled:', err);
    } finally {
      setIsSendingWebhook(false);
      // Direct navigation to official external checkout URL
      window.location.href = fullCheckoutUrl;
    }
  };

  const handleShare = () => {
    const text = `Diagnóstico FEX Educação: Identifiquei um risco estimado de ${formatarMoeda(
      custoTotal
    )} por dependência de pessoas-chave. Descubra o risco na sua empresa:`;
    const url = window.location.href;

    if (navigator.share) {
      navigator.share({ title: 'Diagnóstico de Risco FEX Educação', text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
    trackEvent('result_shared', { nivelGeral, custoTotal });
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 sm:py-10 px-4 sm:px-6 bg-white text-neutral-900 rounded-3xl shadow-xl animate-fadeIn border border-neutral-200/80">
      {/* Header Badge & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-[#00D84F] bg-black px-3 py-1 rounded-full">
            Calculadora de Risco • Resultado Gratuito
          </span>
          {isUnlocked && (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Diagnóstico Completo Liberado</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToHub}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-700 hover:text-black px-3 py-1.5 rounded-full border border-neutral-300 hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Ir para a Área do Cliente"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-[#00D84F]" />
            <span>Área do Cliente</span>
          </button>

          {isUnlocked && (
            <>
              <button
                onClick={onPrint}
                className="flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-black px-2.5 py-1.5 rounded-full border border-neutral-300 hover:bg-neutral-100 transition-colors cursor-pointer"
                title="Exportar ou Imprimir Relatório"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exportar</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-black px-2.5 py-1.5 rounded-full border border-neutral-300 hover:bg-neutral-100 transition-colors cursor-pointer"
                title="Compartilhar resultado"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{shareCopied ? 'Copiado!' : 'Compartilhar'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900">
          Aqui está o retrato financeiro do seu risco
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 mt-1 leading-relaxed">
          Baseado no cruzamento FMEA com os salários e taxas de reposição da sua organização.
        </p>
      </div>

      {/* RESULTADO DA CALCULADORA (SEMPRE DISPONÍVEL GRATUITAMENTE) */}
      <div className="space-y-8">
        {/* 1. Hero Metric Box */}
        <div className="bg-black text-white p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D84F]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#00D84F]">
              Custo Total de Ruptura Estimado
            </span>
            <span
              className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                nivelGeral === 'critico'
                  ? 'bg-[#00D84F] text-black'
                  : nivelGeral === 'relevante'
                  ? 'bg-amber-400 text-black'
                  : 'bg-emerald-300 text-black'
              }`}
            >
              {LABEL_CLASSIFICACAO[nivelGeral]}
            </span>
          </div>

          <div className="text-4xl sm:text-6xl font-black text-white tracking-tight my-2">
            {formatarMoeda(custoTotal)}
          </div>

          <p className="text-sm text-neutral-300 max-w-2xl leading-relaxed mt-2">
            {DESCRICAO_CLASSIFICACAO[nivelGeral]}
          </p>

          <p className="text-xs text-neutral-500 italic mt-3">
            * Este custo não aparece no DRE mês a mês, até o momento em que a ruptura ocorre de uma vez só.
          </p>
        </div>

        {/* 2. Simulation Sliders */}
        <div className="p-6 rounded-3xl border border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-4 h-4 text-[#00D84F]" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-neutral-900">
              Calibrar Parâmetros de Impacto na Operação
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span>Tempo de Rampa do Substituto:</span>
                <span className="text-[#00D84F] font-black">{mesesRampa} meses</span>
              </div>
              <input
                type="range"
                min={3}
                max={24}
                step={1}
                value={mesesRampa}
                onChange={(e) => onUpdateParams(Number(e.target.value), percentualPerda)}
                className="w-full accent-[#00D84F] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                <span>3 meses</span>
                <span>24 meses</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span>Queda na Entrega da Área:</span>
                <span className="text-[#00D84F] font-black">{Math.round(percentualPerda * 100)}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={60}
                step={5}
                value={Math.round(percentualPerda * 100)}
                onChange={(e) => onUpdateParams(mesesRampa, Number(e.target.value) / 100)}
                className="w-full accent-[#00D84F] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                <span>10%</span>
                <span>60%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Detalhamento por Cargo */}
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900 mb-4">
            Detalhamento por Cargo Crítico Avaliado ({cargosCalculados.length})
          </h3>

          <div className="space-y-4">
            {cargosCalculados.map((cargo, idx) => (
              <div
                key={cargo.id}
                className="p-5 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300 transition-all shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <h4 className="font-black text-base text-neutral-900">
                      {idx + 1}. {cargo.nome}
                    </h4>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Salário base: <strong>{formatarMoeda(cargo.salarioMensal)}</strong>/mês
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-lg sm:text-xl font-black text-neutral-900 block">
                      {formatarMoeda(cargo.custoTotalCargo)}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full inline-block ${
                        cargo.classificacao === 'critico'
                          ? 'bg-[#00D84F] text-black'
                          : cargo.classificacao === 'relevante'
                          ? 'bg-amber-200 text-black'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {LABEL_CLASSIFICACAO[cargo.classificacao]} (FMEA: {cargo.indice})
                    </span>
                  </div>
                </div>

                {/* Sub-costs breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-3 border-t border-neutral-100 text-neutral-600">
                  <div className="p-2.5 rounded-xl bg-neutral-50">
                    <span className="block text-[10px] font-bold uppercase text-neutral-400">
                      Custo de Transição (SHRM):
                    </span>
                    <span className="font-extrabold text-neutral-900 text-sm">
                      {formatarMoeda(cargo.custoTransicao)}
                    </span>
                    <span className="text-[10px] text-neutral-500 block">
                      Fator {cargo.fatorTransicao}x salário anual
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-50">
                    <span className="block text-[10px] font-bold uppercase text-neutral-400">
                      Produtividade Perdida da Área:
                    </span>
                    <span className="font-extrabold text-neutral-900 text-sm">
                      {formatarMoeda(cargo.custoProdutividade)}
                    </span>
                    <span className="text-[10px] text-neutral-500 block">
                      Impacto direto no setor
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Memória de Cálculo FMEA (Collapsible) */}
        <div className="border border-neutral-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowMemoria(!showMemoria)}
            className="w-full p-4 text-left bg-neutral-50 hover:bg-neutral-100 font-bold text-xs uppercase tracking-wider text-neutral-700 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#00D84F]" />
              <span>Entenda a Memória de Cálculo Científica (FMEA + SHRM)</span>
            </div>
            <span className="text-xs text-neutral-400 font-normal">
              {showMemoria ? 'Recolher ▲' : 'Ver Detalhes ▼'}
            </span>
          </button>

          {showMemoria && (
            <div className="p-5 text-xs text-neutral-600 space-y-3 bg-white leading-relaxed border-t border-neutral-200">
              <p>
                <strong>1. Índice FMEA:</strong> Criticidade (1 a 5) × Dependência (1 a 5) × Dificuldade de Reposição (1 a 5). Varia de 1 a 125 pontos.
              </p>
              <p>
                <strong>2. Custo de Transição SHRM:</strong> Para cargos de risco crítico (índice ≥ 48), adota-se 200% do salário anual (custo de recrutamento executivo, headhunter, rescisão e descontinuidade). Para risco relevante (18 a 47), 100%. Para controlado (&lt; 18), 50%.
              </p>
              <p>
                <strong>3. Queda de Produtividade:</strong> Reflete a perda de receita e entrega operacional da área durante os {mesesRampa} meses de rampa até que o substituto atinja plena autonomia operacional.
              </p>
            </div>
          )}
        </div>

        {/* 5. SEÇÃO COMERCIAL R$ 67: IMEDIATAMENTE DEPOIS DO RESULTADO */}
        {!isUnlocked ? (
          <div className="pt-8 border-t-2 border-neutral-200/80">
            {/* Callout Header */}
            <div className="text-center mb-4">
              <span className="inline-block px-4 py-1.5 rounded-full bg-black text-[#00D84F] text-xs font-black uppercase tracking-wider shadow-sm">
                SEU RESULTADO MOSTRA O RISCO. AGORA TRANSFORME ESSE RESULTADO EM AÇÃO.
              </span>
            </div>

            {/* Elegant Commercial Box */}
            <div className="bg-gradient-to-b from-neutral-950 via-neutral-900 to-black text-white p-6 sm:p-10 rounded-3xl relative overflow-hidden shadow-2xl border border-neutral-800">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#00D84F]/15 rounded-full blur-3xl pointer-events-none" />

              <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                  Adquira seu Diagnóstico Completo + Mini-Curso
                </h2>

                <p className="text-sm sm:text-base text-neutral-300 mt-3 leading-relaxed">
                  Tenha acesso ao diagnóstico completo com relatório executivo para diretoria, mapeamento de conhecimento tácito e ao conteúdo de capacitação em vídeo da Faculdade FEX Educação.
                </p>

                {/* Grid of Deliverables */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left my-6 bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/10 text-xs sm:text-sm">
                  <div className="flex items-start gap-2.5 text-white">
                    <CheckCircle2 className="w-4 h-4 text-[#00D84F] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-white">Diagnóstico Completo</span>
                      <span className="text-[11px] text-neutral-400">Relatório executivo estruturado para decisões da liderança</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-white">
                    <CheckCircle2 className="w-4 h-4 text-[#00D84F] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-white">Mini-Curso em Vídeo</span>
                      <span className="text-[11px] text-neutral-400">4 vídeo-aulas da FEX com o Método Atitude Emocional®</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-white">
                    <CheckCircle2 className="w-4 h-4 text-[#00D84F] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-white">Raio-X de Conhecimento Tácito</span>
                      <span className="text-[11px] text-neutral-400">Mapeamento de vulnerabilidade em saberes não documentados</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-white">
                    <CheckCircle2 className="w-4 h-4 text-[#00D84F] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-white">Área do Cliente FEX</span>
                      <span className="text-[11px] text-neutral-400">Acesso contínuo aos seus diagnósticos e conteúdos</span>
                    </div>
                  </div>
                </div>

                {/* Optional Buyer Pre-fill Expander */}
                <div className="my-4">
                  <button
                    type="button"
                    onClick={() => setShowLeadFields(!showLeadFields)}
                    className="text-xs text-neutral-400 hover:text-[#00D84F] underline cursor-pointer transition-colors"
                  >
                    {showLeadFields ? 'Ocultar dados corporativos adicionais ▲' : 'Personalizar dados para emissão corporativa (opcional) ▼'}
                  </button>

                  {showLeadFields && (
                    <div className="mt-4 p-5 rounded-2xl bg-white/5 border border-white/10 text-left space-y-3">
                      <p className="text-xs text-neutral-300 mb-2">
                        Preencha seus dados corporativos para que o relatório saia personalizado com o nome da sua empresa:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">Nome Completo</label>
                          <input
                            type="text"
                            placeholder="Ex: Roberto Silva"
                            value={lead.nome}
                            onChange={(e) => onUpdateLead({ ...lead, nome: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs focus:outline-none focus:border-[#00D84F]"
                          />
                          {leadErrors.nome && <p className="text-[10px] text-red-400 mt-1">{leadErrors.nome}</p>}
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">E-mail Corporativo</label>
                          <input
                            type="email"
                            placeholder="Ex: roberto@empresa.com.br"
                            value={lead.email}
                            onChange={(e) => onUpdateLead({ ...lead, email: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs focus:outline-none focus:border-[#00D84F]"
                          />
                          {leadErrors.email && <p className="text-[10px] text-red-400 mt-1">{leadErrors.email}</p>}
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">WhatsApp com DDD</label>
                          <input
                            type="tel"
                            placeholder="Ex: (11) 98765-4321"
                            value={lead.whatsapp}
                            onChange={(e) => onUpdateLead({ ...lead, whatsapp: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs focus:outline-none focus:border-[#00D84F]"
                          />
                          {leadErrors.whatsapp && <p className="text-[10px] text-red-400 mt-1">{leadErrors.whatsapp}</p>}
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase text-neutral-400 mb-1">Nome da Empresa</label>
                          <input
                            type="text"
                            placeholder="Ex: Minha Empresa S.A."
                            value={lead.empresa}
                            onChange={(e) => onUpdateLead({ ...lead, empresa: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs focus:outline-none focus:border-[#00D84F]"
                          />
                          {leadErrors.empresa && <p className="text-[10px] text-red-400 mt-1">{leadErrors.empresa}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Display */}
                <div className="flex items-center justify-center gap-3 my-4">
                  <span className="text-xs sm:text-sm text-neutral-400 font-bold uppercase tracking-wider">Apenas</span>
                  <span className="text-3xl sm:text-5xl font-black text-[#00D84F]">R$ 67</span>
                  <span className="text-xs text-neutral-400 font-medium">pagamento único</span>
                </div>

                {/* Main Action Button */}
                <div className="pt-2">
                  <button
                    onClick={() => handleGoToCheckout67()}
                    disabled={isSendingWebhook}
                    className="w-full sm:w-auto min-w-[320px] px-8 py-4 sm:py-5 rounded-full bg-[#00D84F] hover:bg-[#25eb69] text-black font-black text-sm sm:text-base uppercase tracking-wider transition-all transform active:scale-98 shadow-xl shadow-[#00D84F]/25 flex items-center justify-center gap-2.5 mx-auto cursor-pointer disabled:opacity-80"
                  >
                    {isSendingWebhook ? (
                      <>
                        <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Abrindo checkout seguro...</span>
                      </>
                    ) : (
                      <>
                        <span>ADQUIRIR DIAGNÓSTICO COMPLETO + MINI-CURSO</span>
                        <ArrowRight className="w-5 h-5 text-black shrink-0" />
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-neutral-400 mt-4 flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00D84F]" />
                  <span>Ambiente seguro Digital Manager Guru • Acesso liberado imediatamente após o pagamento</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* SE O USUÁRIO JÁ ADQUIRIU R$ 67: EXIBIR ENTREGÁVEIS E PRÓXIMOS PASSOS */
          <div className="pt-8 border-t border-neutral-200">
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#00D84F] text-black flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-black text-emerald-950 uppercase tracking-wide">
                    Diagnóstico Completo & Mini-Curso Liberados
                  </h4>
                  <p className="text-xs sm:text-sm text-emerald-800 mt-0.5">
                    Seu acesso foi confirmado. Você pode exportar o relatório executivo oficial e avançar para o Raio-X do Conhecimento e as aulas.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
                <button
                  onClick={onPrint}
                  className="flex-1 sm:flex-initial px-5 py-3 rounded-full bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4 text-neutral-600" />
                  <span>Exportar Relatório</span>
                </button>

                <button
                  onClick={onProceedToRaioX}
                  className="flex-1 sm:flex-initial px-6 py-3.5 rounded-full bg-[#00D84F] hover:bg-[#25eb69] text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#00D84F]/20 active:scale-98"
                >
                  <span>Avançar para o Raio-X</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
