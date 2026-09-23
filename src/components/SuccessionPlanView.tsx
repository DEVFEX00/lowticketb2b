import React, { useState } from 'react';
import { PlanoSucessao, DiagnosticoResultado, LeadInfo, TacitKnowledgeSelection } from '../types';
import { formatarMoeda } from '../utils/calculations';
import { CheckCircle2, Clock, Calendar, Download, Printer, ArrowRight, BookOpen, ShieldCheck, AlertCircle, Edit3, Plus } from 'lucide-react';
import { trackEvent } from '../services/analytics';

interface SuccessionPlanViewProps {
  plano: PlanoSucessao;
  resultado: DiagnosticoResultado | null;
  lead: LeadInfo;
  onUpdatePlano: (plano: PlanoSucessao) => void;
  onNavigateToCourse: () => void;
  onNavigateToHub: () => void;
  onPrint: () => void;
}

export const SuccessionPlanView: React.FC<SuccessionPlanViewProps> = ({
  plano,
  resultado,
  lead,
  onUpdatePlano,
  onNavigateToCourse,
  onNavigateToHub,
  onPrint
}) => {
  const [activeFaseId, setActiveFaseId] = useState<string>(plano.fases[0]?.id || 'f1');
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});

  const toggleActionCompleted = (faseId: string, actionIndex: number) => {
    const key = `${faseId}-${actionIndex}`;
    setCompletedActions((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
    trackEvent('plan_action_toggled', { faseId, actionIndex, status: !completedActions[key] });
  };

  const cargoMaisCritico = resultado?.cargosCalculados[0];
  const custoTotal = resultado?.custoTotal || 0;

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 sm:px-6 bg-white text-black rounded-3xl shadow-xl animate-fadeIn border border-neutral-200/80">
      {/* Top Bar / Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-neutral-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#00D84F] bg-black px-3 py-1 rounded-full inline-block">
              Entregável Exclusivo • Plano de 90 Dias
            </span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              ✓ Acesso Liberado
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900">
            Seu Plano de Sucessão de 90 Dias
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-1">
            Empresa: <strong>{lead.empresa || plano.empresa}</strong> • Cargo Prioritário: <strong>{plano.cargoPrincipal}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToHub}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-neutral-300 hover:bg-neutral-100 text-xs font-bold text-neutral-700 cursor-pointer transition-colors"
            title="Retornar para a Área de Membros"
          >
            <span>← Voltar para Área de Membros</span>
          </button>

          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-neutral-300 hover:bg-neutral-100 text-xs font-bold text-neutral-700 cursor-pointer transition-colors"
            title="Exportar ou Imprimir em PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Baixar / Imprimir Plano</span>
          </button>
        </div>
      </div>

      {/* Strategic Summary Box */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-black text-white">
          <span className="text-[10px] uppercase tracking-wider text-white/50 block mb-1">
            Prioridade de Implementação
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-black px-2.5 py-0.5 rounded-full uppercase ${
                plano.nivelPrioridade === 'URGENTE'
                  ? 'bg-[#00D84F] text-black'
                  : plano.nivelPrioridade === 'ALTA'
                  ? 'bg-amber-400 text-black'
                  : 'bg-emerald-300 text-black'
              }`}
            >
              {plano.nivelPrioridade}
            </span>
          </div>
          <p className="text-[11px] text-white/70 mt-2">
            Risco FMEA identificado de alta criticidade e baixa documentação.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-100 border border-neutral-200">
          <span className="text-[10px] uppercase tracking-wider text-neutral-500 block mb-1">
            Capital Financeiro Protegido
          </span>
          <span className="text-xl font-black text-black">
            {formatarMoeda(custoTotal)}
          </span>
          <p className="text-[11px] text-neutral-600 mt-1">
            Prevenção de custos de transição e paralisia operacional na área.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-neutral-100 border border-neutral-200">
          <span className="text-[10px] uppercase tracking-wider text-neutral-500 block mb-1">
            Horizonte de Execução
          </span>
          <span className="text-xl font-black text-[#00D84F]">
            90 Dias Corridos
          </span>
          <p className="text-[11px] text-neutral-600 mt-1">
            3 ciclos de 30 dias com validação prática em ambiente real.
          </p>
        </div>
      </div>

      {/* 90-Day Timeline Tabs */}
      <div className="mb-6">
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-black mb-3">
          As 5 Fases da Metodologia FEX Educação
        </h3>

        <div className="flex overflow-x-auto gap-2 pb-2">
          {plano.fases.map((fase) => {
            const isActive = activeFaseId === fase.id;
            return (
              <button
                key={fase.id}
                onClick={() => {
                  setActiveFaseId(fase.id);
                  trackEvent('plan_phase_viewed', { fase: fase.titulo });
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-black text-white shadow-md'
                    : 'bg-[#F4F4F4] text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${isActive ? 'bg-[#00D84F] text-black' : 'bg-neutral-300 text-black'}`}>
                  {fase.fase}
                </span>
                <span>{fase.titulo.split(':')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Phase Details */}
      {(() => {
        const faseAtiva = plano.fases.find((f) => f.id === activeFaseId) || plano.fases[0];
        if (!faseAtiva) return null;

        return (
          <div className="p-6 rounded-2xl border-2 border-black bg-white mb-8 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <span className="text-xs font-extrabold uppercase text-[#00D84F] tracking-wider block">
                  {faseAtiva.periodo}
                </span>
                <h4 className="text-xl font-black text-black">
                  {faseAtiva.titulo}
                </h4>
              </div>
              <span className="text-xs font-semibold px-3 py-1 bg-neutral-100 rounded-full text-neutral-700">
                Responsável Sugerido: <strong>{faseAtiva.responsavelSugerido}</strong>
              </span>
            </div>

            <p className="text-xs sm:text-sm text-neutral-600 mb-5 leading-relaxed bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
              <strong>Objetivo da Fase:</strong> {faseAtiva.objetivo}
            </p>

            <h5 className="text-xs font-extrabold uppercase tracking-wider text-neutral-700 mb-3">
              Plano de Ação Prático & Checklists:
            </h5>

            <div className="space-y-2.5">
              {faseAtiva.acoes.map((acao, idx) => {
                const actionKey = `${faseAtiva.id}-${idx}`;
                const isChecked = Boolean(completedActions[actionKey]);

                return (
                  <div
                    key={idx}
                    onClick={() => toggleActionCompleted(faseAtiva.id, idx)}
                    className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-white border-neutral-200 hover:border-neutral-400 text-neutral-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by parent div click
                      className="mt-1 w-4 h-4 rounded border-neutral-400 accent-[#00D84F] cursor-pointer shrink-0"
                    />
                    <span className={`text-xs sm:text-sm leading-relaxed ${isChecked ? 'line-through opacity-70' : ''}`}>
                      {acao}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Insight: Blindagem Emocional do Especialista */}
      <div className="p-5 rounded-2xl bg-neutral-100 border border-neutral-300 mb-8">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-black shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-extrabold text-black uppercase mb-1">
              Diretriz do Método Atitude Emocional®
            </h4>
            <p className="text-xs text-neutral-700 leading-relaxed">
              {plano.alertaEmocional}
            </p>
          </div>
        </div>
      </div>

      {/* Next Step: Mini-Course Access */}
      <div className="p-6 rounded-2xl bg-black text-white flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#00D84F] block mb-1">
            Benefício Incluso nos Dois Produtos
          </span>
          <h4 className="text-lg sm:text-xl font-black text-white">
            Acessar o Curso em Vídeo (YouTube)
          </h4>
          <p className="text-xs text-white/70 mt-1 max-w-lg leading-relaxed">
            Acesse as 4 aulas exclusivas sobre como desarmar o medo da equipe, conduzir entrevistas de externalização e registrar saberes tácitos na prática.
          </p>
        </div>

        <button
          onClick={() => {
            trackEvent('course_access_from_plan');
            onNavigateToCourse();
          }}
          className="w-full sm:w-auto py-3.5 px-6 rounded-full bg-[#00D84F] hover:bg-[#25eb69] text-black font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 transition-all cursor-pointer shadow-lg shadow-[#00D84F]/20"
        >
          <BookOpen className="w-4 h-4" />
          <span>Acessar Curso Agora</span>
        </button>
      </div>
    </div>
  );
};
