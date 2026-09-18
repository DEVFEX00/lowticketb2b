import React from 'react';
import { DiagnosticoResultado, LeadInfo } from '../types';
import { formatarMoeda } from '../utils/calculations';
import { CHECKOUT_URL_97 } from './CheckoutModal';
import { Shield, CheckCircle2, ArrowRight, ArrowLeft, Sparkles, ExternalLink, Award, FileText, Users } from 'lucide-react';
import { trackEvent } from '../services/analytics';

interface UpsellSuccessionOfferProps {
  resultado: DiagnosticoResultado | null;
  lead: LeadInfo;
  hasUnlockedSuccession: boolean;
  onUnlockSuccession: () => void;
  onOpenCheckout97: () => void;
  onBack: () => void;
}

export const UpsellSuccessionOffer: React.FC<UpsellSuccessionOfferProps> = ({
  resultado,
  lead,
  hasUnlockedSuccession,
  onUnlockSuccession,
  onOpenCheckout97,
  onBack
}) => {
  const custoTotal = resultado?.custoTotal || 0;
  const cargoPrincipal = resultado?.cargosCalculados[0]?.nome || 'Cargos Críticos';

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4 sm:px-6 bg-white text-black rounded-2xl shadow-xl animate-fadeIn">
      {/* Header Badge */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="text-xs font-bold text-neutral-500 hover:text-black flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar ao Raio-X
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-[#00D84F] bg-black px-3 py-1 rounded-full">
          Próximo Nível • Transição Estratégica
        </span>
      </div>

      {/* Logical Bridge */}
      <div className="text-center max-w-xl mx-auto mb-8">
        <span className="text-[11px] font-black uppercase tracking-widest text-[#00D84F] bg-black px-3 py-1 rounded-full inline-block mb-3">
          Diagnóstico Concluído com Sucesso
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-black leading-tight uppercase">
          Construa o Plano de Sucessão da sua empresa
        </h2>
        <p className="text-sm sm:text-base text-neutral-600 mt-3 leading-relaxed">
          Você já descobriu onde sua empresa está vulnerável e que o risco financeiro de ruptura pode custar{' '}
          <strong className="text-black font-extrabold">{formatarMoeda(custoTotal)}</strong>.
          <br className="hidden sm:inline" />
          Agora transforme esse diagnóstico em um <strong>plano de ação estruturado de 90 dias</strong>.
        </p>
      </div>

      {/* R$67 vs R$97 Framing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="p-5 rounded-xl border border-neutral-300 bg-neutral-100 opacity-90">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block mb-1">
            Etapa 1 Concluída (R$ 67)
          </span>
          <h3 className="font-extrabold text-base text-black mb-2">
            Descobrir & Diagnosticar
          </h3>
          <ul className="text-xs text-neutral-600 space-y-1.5">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-black shrink-0" />
              <span>Matriz FMEA por cargo crítico</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-black shrink-0" />
              <span>Custo de transição e produtividade</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-black shrink-0" />
              <span>Raio-X de vulnerabilidade tácita</span>
            </li>
          </ul>
        </div>

        <div className="p-5 rounded-xl border-2 border-black bg-white shadow-lg relative">
          <div className="absolute -top-3 right-4 bg-[#00D84F] text-black font-black text-[10px] uppercase px-2.5 py-0.5 rounded-full">
            Próximo Passo Lógico
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#00D84F] block mb-1">
            Etapa 2 • Plano de Sucessão (R$ 97)
          </span>
          <h3 className="font-extrabold text-base text-black mb-2">
            Planejar, Agir & Blindar
          </h3>
          <ul className="text-xs text-neutral-700 space-y-1.5 font-medium">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00D84F] shrink-0" />
              <span>Plano estruturado de 90 dias (5 fases)</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00D84F] shrink-0" />
              <span>Metodologia Atitude Emocional® da FEX</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00D84F] shrink-0" />
              <span>Matriz de ações, prazos e responsáveis</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00D84F] shrink-0" />
              <span>Acesso garantido ao Mini-Curso em vídeo</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Comparison Table: Solo vs Faculdade FEX Educação */}
      <div className="mb-8 border border-neutral-200 rounded-xl overflow-hidden">
        <div className="bg-neutral-100 p-3.5 border-b border-neutral-200">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-800 text-center">
            O Teto do Plano Solo vs Aceleração com a Faculdade FEX Educação
          </h4>
        </div>
        <div className="divide-y divide-neutral-200 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 p-3.5 gap-2 bg-white">
            <div>
              <span className="font-bold text-neutral-500 block mb-0.5">Tentativa Solo com DHO Interno:</span>
              <span className="text-neutral-700">Documentação burocrática em manuais e PDFs estáticos que ninguém lê.</span>
            </div>
            <div className="sm:border-l sm:border-neutral-200 sm:pl-3">
              <span className="font-extrabold text-[#00D84F] block mb-0.5">Com a Faculdade FEX Educação:</span>
              <span className="text-neutral-900 font-medium">Metodologia estruturada de externalização de heurísticas com curadoria acadêmica.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 p-3.5 gap-2 bg-neutral-50">
            <div>
              <span className="font-bold text-neutral-500 block mb-0.5">Barreira Emocional do Especialista:</span>
              <span className="text-neutral-700">O profissional sente medo de ser descartado e sabota a transferência sutilmente.</span>
            </div>
            <div className="sm:border-l sm:border-neutral-200 sm:pl-3">
              <span className="font-extrabold text-[#00D84F] block mb-0.5">Método Atitude Emocional®:</span>
              <span className="text-neutral-900 font-medium">O especialista vira Educador Corporativo e Professor com chancela universitária.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 p-3.5 gap-2 bg-white">
            <div>
              <span className="font-bold text-neutral-500 block mb-0.5">Velocidade & Engajamento:</span>
              <span className="text-neutral-700">De 12 a 18 meses no ritmo interno; alta chance de abandono.</span>
            </div>
            <div className="sm:border-l sm:border-neutral-200 sm:pl-3">
              <span className="font-extrabold text-[#00D84F] block mb-0.5">Cronograma de 90 Dias:</span>
              <span className="text-neutral-900 font-medium">Marcos quinzenais e acompanhamento com testes de autonomia prática.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Upsell Box */}
      <div className="p-6 sm:p-8 rounded-2xl bg-black text-white text-center sm:text-left relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="max-w-md">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#00D84F] block mb-1">
              Módulo Order Bump • Transição Estratégica
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
              Plano de Sucessão de 90 Dias
            </h3>
            <p className="text-xs text-white/70 mt-2 leading-relaxed">
              Disponibilizado como order bump no checkout oficial da FEX. Receba o plano estruturado em 5 fases com ações prioritárias para a continuidade da {lead.empresa || 'sua empresa'}.
            </p>
          </div>

          <div className="text-center sm:text-right shrink-0">
            <span className="text-xs text-white/50 block">Incluso no Order Bump</span>
            <span className="text-2xl sm:text-3xl font-black text-[#00D84F]">R$ 97,00</span>
            <span className="text-[10px] text-white/60 block mt-0.5">Ativação no checkout oficial</span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onBack}
            className="w-full sm:w-auto py-3 px-6 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
          >
            Voltar para Área do Cliente
          </button>

          <button
            onClick={() => {
              trackEvent('upsell_checkout_initiated', { lead, custoTotal });
              onOpenCheckout97();
            }}
            className="w-full sm:w-auto py-3.5 px-6 rounded-full bg-[#00D84F] hover:bg-[#25eb69] text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00D84F]/25 transition-all transform active:scale-98 cursor-pointer"
          >
            <span>Conferir no Checkout Oficial</span>
            <ExternalLink className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>
    </div>
  );
};
