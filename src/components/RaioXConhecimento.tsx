import React from 'react';
import { TacitKnowledgeSelection, DiagnosticoResultado } from '../types';
import { CHIPS_CONHECIMENTO } from '../data/mockDefaults';
import { ShieldAlert, HeartHandshake, Brain, Users, ArrowRight, ArrowLeft, Lock, Check } from 'lucide-react';
import { trackEvent } from '../services/analytics';

interface RaioXConhecimentoProps {
  conhecimentoTacito: TacitKnowledgeSelection;
  onUpdateTacito: (tacito: TacitKnowledgeSelection) => void;
  resultado: DiagnosticoResultado | null;
  onProceedToUpsell: () => void;
  onBack: () => void;
}

export const RaioXConhecimento: React.FC<RaioXConhecimentoProps> = ({
  conhecimentoTacito,
  onUpdateTacito,
  resultado,
  onProceedToUpsell,
  onBack
}) => {
  const cargoMaisCritico = resultado?.cargosCalculados.length
    ? [...resultado.cargosCalculados].sort((a, b) => b.indice - a.indice)[0]
    : null;

  const nomeCargo = cargoMaisCritico ? cargoMaisCritico.nome : 'Cargo Estratégico';

  const toggleItem = (categoria: keyof TacitKnowledgeSelection, item: string) => {
    const list = conhecimentoTacito[categoria];
    const exists = list.includes(item);
    const updated = exists ? list.filter((i) => i !== item) : [...list, item];

    onUpdateTacito({
      ...conhecimentoTacito,
      [categoria]: updated
    });

    trackEvent('tacit_chip_toggled', { categoria, item, selected: !exists });
  };

  const totalSelecionados =
    conhecimentoTacito.tecnico.length +
    conhecimentoTacito.relacionamentos.length +
    conhecimentoTacito.julgamento.length +
    conhecimentoTacito.cultura.length;

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4 sm:px-6 bg-white text-black rounded-2xl shadow-xl animate-fadeIn">
      {/* Header Badge */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="text-xs font-bold text-neutral-500 hover:text-black flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar ao resultado
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-[#00D84F] bg-black px-3 py-1 rounded-full">
          Raio-X • Conhecimento Tácito
        </span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black mb-2">
        Onde está o conhecimento invisível de {nomeCargo}?
      </h2>
      <p className="text-sm text-neutral-600 mb-6">
        Selecione abaixo os saberes e práticas que hoje estão <strong>apenas na cabeça</strong> desta pessoa-chave e que se perderiam em uma saída inesperada:
      </p>

      {/* Categories Grid */}
      <div className="space-y-6 mb-8">
        {/* 1. Conhecimento Técnico */}
        <div className="p-5 rounded-xl border border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-black text-[#00D84F] flex items-center justify-center font-bold text-xs">
              1
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase text-black">
                Conhecimento Técnico & Operacional
              </h3>
              <p className="text-xs text-neutral-500">
                Sistemas, métodos próprios e segredos práticos do dia a dia
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {CHIPS_CONHECIMENTO.tecnico.map((chip) => {
              const selected = conhecimentoTacito.tecnico.includes(chip);
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => toggleItem('tecnico', chip)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                    selected
                      ? 'bg-black text-white border-2 border-black shadow-sm'
                      : 'bg-white text-neutral-800 border border-neutral-300 hover:border-black'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${selected ? 'bg-[#00D84F] text-black font-black' : 'border border-neutral-400'}`}>
                    {selected ? '✓' : ''}
                  </span>
                  <span>{chip}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Relacionamentos */}
        <div className="p-5 rounded-xl border border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-black text-[#00D84F] flex items-center justify-center font-bold text-xs">
              2
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase text-black">
                Relacionamentos & Capital Social
              </h3>
              <p className="text-xs text-neutral-500">
                Confiança pessoal de clientes, fornecedores e influência interna
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {CHIPS_CONHECIMENTO.relacionamentos.map((chip) => {
              const selected = conhecimentoTacito.relacionamentos.includes(chip);
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => toggleItem('relacionamentos', chip)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                    selected
                      ? 'bg-black text-white border-2 border-black shadow-sm'
                      : 'bg-white text-neutral-800 border border-neutral-300 hover:border-black'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${selected ? 'bg-[#00D84F] text-black font-black' : 'border border-neutral-400'}`}>
                    {selected ? '✓' : ''}
                  </span>
                  <span>{chip}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Julgamento & Tomada de Decisão */}
        <div className="p-5 rounded-xl border border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-black text-[#00D84F] flex items-center justify-center font-bold text-xs">
              3
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase text-black">
                Julgamento & Intuição Calibrada
              </h3>
              <p className="text-xs text-neutral-500">
                O que fazer quando o procedimento oficial falha e a crise aperta
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {CHIPS_CONHECIMENTO.julgamento.map((chip) => {
              const selected = conhecimentoTacito.julgamento.includes(chip);
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => toggleItem('julgamento', chip)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                    selected
                      ? 'bg-black text-white border-2 border-black shadow-sm'
                      : 'bg-white text-neutral-800 border border-neutral-300 hover:border-black'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${selected ? 'bg-[#00D84F] text-black font-black' : 'border border-neutral-400'}`}>
                    {selected ? '✓' : ''}
                  </span>
                  <span>{chip}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Cultura & Liderança */}
        <div className="p-5 rounded-xl border border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-black text-[#00D84F] flex items-center justify-center font-bold text-xs">
              4
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase text-black">
                Cultura & Memória Institucional
              </h3>
              <p className="text-xs text-neutral-500">
                Referência ética, guardião dos valores e história da organização
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {CHIPS_CONHECIMENTO.cultura.map((chip) => {
              const selected = conhecimentoTacito.cultura.includes(chip);
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => toggleItem('cultura', chip)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left flex items-center gap-1.5 cursor-pointer ${
                    selected
                      ? 'bg-black text-white border-2 border-black shadow-sm'
                      : 'bg-white text-neutral-800 border border-neutral-300 hover:border-black'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${selected ? 'bg-[#00D84F] text-black font-black' : 'border border-neutral-400'}`}>
                    {selected ? '✓' : ''}
                  </span>
                  <span>{chip}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Card: Por Que a Documentação Quase Sempre Falha (Brand Insight FEX) */}
      <div className="p-6 rounded-2xl bg-black text-white border-l-4 border-[#00D84F] mb-8">
        <span className="text-[11px] font-black uppercase tracking-widest text-[#00D84F] block mb-2">
          Fundamento Acadêmico • FEX Educação
        </span>
        <h3 className="text-lg font-extrabold text-white mb-3">
          Por que a maioria dos projetos de documentação morre na praia?
        </h3>
        <p className="text-xs sm:text-sm text-white/80 leading-relaxed mb-3">
          Existe uma barreira oculta que nenhum software de gestão de processos resolve: <strong>o medo</strong>. O profissional sênior que é obrigado a documentar tudo o que sabe sente, inconscientemente, que está redigindo o manual da sua própria demissão ou descarte.
        </p>
        <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
          Transferir conhecimento tácito não é um ato mecânico; é um <strong>processo emocional</strong>. A pessoa-chave precisa ser elevada à posição de <em>Educador Corporativo e Formador de Sucessores</em>, com ganho de prestígio universitário e status, nunca ameaça. É exatamente nisso que se fundamenta o <strong>Método Atitude Emocional®</strong> da Faculdade FEX Educação.
        </p>
      </div>

      {/* Progress count & CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="text-xs text-neutral-500 text-center sm:text-left">
          <strong>{totalSelecionados} pontos críticos</strong> mapeados para o plano de ação
        </div>

        <button
          onClick={() => {
            trackEvent('tacit_knowledge_completed', { totalSelecionados });
            onProceedToUpsell();
          }}
          className="w-full sm:w-auto py-4 px-8 rounded-full bg-[#00D84F] hover:bg-[#25eb69] text-black font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00D84F]/20 cursor-pointer"
        >
          <span>Transformar Diagnóstico em Plano de Ação</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
