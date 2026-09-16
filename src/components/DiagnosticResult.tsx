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
  ShieldAlert
} from 'lucide-react';
import { trackEvent } from '../services/analytics';
import { CHECKOUT_URL_67 } from './CheckoutModal';
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
  const [leadErrors, setLeadErrors] = useState<Record<string, string>>({});
  const [shareCopied, setShareCopied] = useState(false);
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);

  // Check if diagnostic financial portrait is unlocked
  // ONLY real confirmed payments unlock the financial numbers and next steps
  const isUnlocked = ['diagnostic_paid', 'succession_unlocked', 'succession_paid'].includes(accessStatus);

  const { cargosCalculados, custoTotal, nivelGeral, mesesRampa, percentualPerda } = resultado;

  const validateLead = (): boolean => {
    const errors: Record<string, string> = {};
    if (!lead.nome.trim()) errors.nome = 'Digite seu nome completo.';
    if (!lead.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
      errors.email = 'Digite um e-mail corporativo válido.';
    }
    if (!lead.whatsapp.trim() || lead.whatsapp.replace(/\D/g, '').length < 10) {
      errors.whatsapp = 'Digite um telefone/WhatsApp válido com DDD.';
    }
    if (!lead.empresa.trim()) errors.empresa = 'Informe o nome da sua empresa.';
    if (!lead.cargo.trim()) errors.cargo = 'Informe seu cargo na empresa.';
    if (!lead.lgpdAceito) errors.lgpd = 'É necessário autorizar o uso dos dados conforme a LGPD.';

    setLeadErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGoToCheckout67 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLead()) return;

    setIsSendingWebhook(true);

    trackEvent('lead_captured_pre_checkout', {
      ...lead,
      nivelGeral,
      custoTotal
    });

    // Build checkout URL with pre-filled lead details and return parameters
    const checkoutParams = new URLSearchParams();
    if (lead.nome) checkoutParams.set('name', lead.nome);
    if (lead.email) checkoutParams.set('email', lead.email);
    if (lead.whatsapp) {
      const rawPhone = lead.whatsapp.replace(/\D/g, '');
      checkoutParams.set('phone', rawPhone || lead.whatsapp);
    }
    if (lead.empresa) checkoutParams.set('company', lead.empresa);
    if (typeof window !== 'undefined') {
      const returnUrl = `${window.location.origin}${window.location.pathname}?status=approved&paid=67&sck=fex_diag67`;
      checkoutParams.set('return_url', returnUrl);
      checkoutParams.set('redirect_url', returnUrl);
      checkoutParams.set('sck', 'fex_diag67');
    }
    const fullCheckoutUrl = `${CHECKOUT_URL_67}?${checkoutParams.toString()}`;

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
      // Direct navigation in the same window to ensure consistent return from Guru
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
            {isUnlocked ? 'Etapa 3 de 4 • Retrato Financeiro do Risco' : 'Etapa 3 de 4 • Diagnóstico Processado'}
          </span>
          {isUnlocked && (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              ✓ Liberado
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

      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900">
          {isUnlocked
            ? 'Aqui está o retrato financeiro do seu risco'
            : 'Seu cálculo de risco foi processado com sucesso!'}
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 mt-1 leading-relaxed">
          {isUnlocked
            ? 'Baseado no cruzamento FMEA com os salários e taxas de reposição da sua organização.'
            : 'Preencha seus dados corporativos abaixo para desbloquear o valor detalhado em reais e o acesso integral ao Mini-Curso.'}
        </p>
      </div>

      {/* SCENARIO A: LOCKED (Preencher dados e checkout R$ 67) */}
      {!isUnlocked ? (
        <div className="space-y-6">
          {/* Teaser notification box */}
          <div className="p-6 rounded-3xl bg-neutral-900 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D84F]/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-black border border-white/10 flex items-center justify-center text-[#00D84F] shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#00D84F] block mb-1">
                  Cálculo Algorítmico FEX Concluído
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  {cargosCalculados.length} cargo(s) crítico(s) analisado(s) com impacto no DRE
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 mt-1.5 leading-relaxed max-w-2xl">
                  Calculamos o tempo de rampa, a queda de produtividade departamental e o custo de reposição SHRM. 
                  Preencha o formulário abaixo para adquirir o Diagnóstico Completo por <strong>R$ 67,00</strong> e liberar a visualização financeira imediata.
                </p>
              </div>
            </div>
          </div>

          {/* Lead Capture Form & Checkout CTA */}
          <div className="p-6 sm:p-8 rounded-3xl bg-neutral-50 border border-neutral-200">
            <div className="mb-6">
              <span className="text-xs font-black uppercase tracking-wider text-[#00D84F] bg-black px-3 py-1 rounded-full inline-block mb-2">
                Dados para Emissão do Relatório
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900">
                Onde devemos disponibilizar seu diagnóstico e acesso ao curso?
              </h2>
              <p className="text-xs sm:text-sm text-neutral-600 mt-1">
                Ao prosseguir, você adquire o <strong>Diagnóstico de Custo da Pessoa-Chave</strong> com direito ao <strong>Mini-Curso da Faculdade FEX Educação</strong>.
              </p>
            </div>

            <form onSubmit={handleGoToCheckout67} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    Seu Nome Completo *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Roberto Silva"
                    value={lead.nome}
                    onChange={(e) => onUpdateLead({ ...lead, nome: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-300 text-neutral-900 text-sm focus:outline-none focus:border-[#00D84F]"
                  />
                  {leadErrors.nome && <p className="text-xs text-red-500 mt-1 font-semibold">{leadErrors.nome}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    E-mail Corporativo *
                  </label>
                  <input
                    type="email"
                    placeholder="Ex: roberto@suaempresa.com.br"
                    value={lead.email}
                    onChange={(e) => onUpdateLead({ ...lead, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-300 text-neutral-900 text-sm focus:outline-none focus:border-[#00D84F]"
                  />
                  {leadErrors.email && <p className="text-xs text-red-500 mt-1 font-semibold">{leadErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    WhatsApp com DDD *
                  </label>
                  <input
                    type="tel"
                    placeholder="Ex: (11) 98765-4321"
                    value={lead.whatsapp}
                    onChange={(e) => onUpdateLead({ ...lead, whatsapp: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-300 text-neutral-900 text-sm focus:outline-none focus:border-[#00D84F]"
                  />
                  {leadErrors.whatsapp && <p className="text-xs text-red-500 mt-1 font-semibold">{leadErrors.whatsapp}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                    Nome da Empresa *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Grupo Vanguarda"
                    value={lead.empresa}
                    onChange={(e) => onUpdateLead({ ...lead, empresa: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-300 text-neutral-900 text-sm focus:outline-none focus:border-[#00D84F]"
                  />
                  {leadErrors.empresa && <p className="text-xs text-red-500 mt-1 font-semibold">{leadErrors.empresa}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-700 mb-1">
                  Seu Cargo na Empresa *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Diretor de RH, CEO, Gerente DHO"
                  value={lead.cargo}
                  onChange={(e) => onUpdateLead({ ...lead, cargo: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-neutral-300 text-neutral-900 text-sm focus:outline-none focus:border-[#00D84F]"
                />
                {leadErrors.cargo && <p className="text-xs text-red-500 mt-1 font-semibold">{leadErrors.cargo}</p>}
              </div>

              {/* LGPD Consent */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={lead.lgpdAceito}
                    onChange={(e) => onUpdateLead({ ...lead, lgpdAceito: e.target.checked })}
                    className="mt-1 w-4 h-4 rounded border-neutral-400 accent-[#00D84F] cursor-pointer"
                  />
                  <span className="text-xs text-neutral-600 leading-relaxed">
                    Autorizo o envio do diagnóstico detalhado e contatos institucionais da Faculdade FEX Educação conforme as diretrizes da LGPD. Posso revogar a qualquer momento.
                  </span>
                </label>
                {leadErrors.lgpd && <p className="text-xs text-red-500 mt-1 font-semibold">{leadErrors.lgpd}</p>}
              </div>

              {/* Offer Details Box */}
              <div className="p-4 rounded-2xl bg-white border border-neutral-200 mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-neutral-500 font-semibold block">
                    Oferta Especial de Lançamento
                  </span>
                  <span className="text-sm font-extrabold text-neutral-900">
                    Diagnóstico Completo + Mini-Curso em Vídeo
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-black text-[#00D84F]">R$ 67,00</span>
                  <span className="text-[11px] text-neutral-400 block font-medium">pagamento único</span>
                </div>
              </div>

              {/* Main Button to Checkout R$ 67 */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSendingWebhook}
                  className="w-full py-4 px-6 rounded-full bg-[#00D84F] hover:bg-[#25eb69] text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00D84F]/20 cursor-pointer active:scale-98 transition-all disabled:opacity-80"
                >
                  {isSendingWebhook ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Processando dados e abrindo checkout...</span>
                    </>
                  ) : (
                    <>
                      <span>Adquirir Diagnóstico por R$ 67,00</span>
                      <ArrowRight className="w-4 h-4 text-black" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        /* SCENARIO B: UNLOCKED (Retrato Financeiro Completo) */
        <div className="space-y-8">
          {/* Hero Metric Box */}
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

          {/* Simulation Sliders */}
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

          {/* Detalhamento por Cargo */}
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

          {/* Memória de Cálculo FMEA (Collapsible) */}
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

          {/* Next Steps CTA Strip */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={onNavigateToHub}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full border border-neutral-300 hover:bg-neutral-100 text-neutral-900 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 text-[#00D84F]" />
              <span>Ir para Área do Cliente</span>
            </button>

            <button
              onClick={onProceedToRaioX}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#00D84F] hover:bg-[#25eb69] text-black font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#00D84F]/20 active:scale-98"
            >
              <span>Avançar para o Raio-X do Conhecimento</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
