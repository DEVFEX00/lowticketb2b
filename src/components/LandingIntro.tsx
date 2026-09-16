import React from 'react';
import { ArrowRight, ShieldCheck, TrendingUp, AlertTriangle, Users, Award, BookOpen } from 'lucide-react';
import { trackEvent } from '../services/analytics';

interface LandingIntroProps {
  onStart: () => void;
}

export const LandingIntro: React.FC<LandingIntroProps> = ({
  onStart
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4 sm:px-6 animate-fadeIn">
      {/* Eyebrow & Brand Tag */}
      <div className="text-center mb-6">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#00D84F] text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          Metodologia Exclusiva Faculdade FEX Educação
        </span>
      </div>

      {/* Main Headline from reference */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight text-white text-center leading-tight mb-8">
        <span className="text-[#00D84F]">Quanto da sua empresa</span>
        <br />
        mora na cabeça de uma pessoa só?
      </h1>

      {/* 3 Research Statistic Cards */}
      <div className="space-y-3.5 mb-8">
        <div className="bg-white text-black p-4 sm:p-5 rounded-xl shadow-lg flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#00D84F]/20 flex items-center justify-center shrink-0 text-[#00D84F] font-black text-lg">
            79%
          </div>
          <p className="text-sm sm:text-base leading-relaxed text-[#111111]">
            <strong>79% das empresas</strong> admitem que seus processos de transferência de conhecimento são pouco ou apenas moderadamente eficazes (NC State ERM Initiative).
          </p>
        </div>

        <div className="bg-white text-black p-4 sm:p-5 rounded-xl shadow-lg flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#00D84F]/20 flex items-center justify-center shrink-0 text-[#00D84F] font-black text-lg">
            25%
          </div>
          <p className="text-sm sm:text-base leading-relaxed text-[#111111]">
            <strong>Apenas 25%</strong> das empresas brasileiras têm sucessores prontos para cargos de alta liderança (Brandon Hall Group).
          </p>
        </div>

        <div className="bg-white text-black p-4 sm:p-5 rounded-xl shadow-lg flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#00D84F]/20 flex items-center justify-center shrink-0 text-[#00D84F] font-black text-lg">
            200%
          </div>
          <p className="text-sm sm:text-base leading-relaxed text-[#111111]">
            Uma transição de liderança malsucedida custa de <strong>50% a 200%</strong> do salário anual do cargo (SHRM).
          </p>
        </div>
      </div>

      {/* Lead Copy */}
      <p className="text-white/80 text-base sm:text-lg leading-relaxed text-center mb-8">
        Nos próximos minutos, você vai medir esse risco na sua empresa, <strong>em reais</strong>, através da metodologia FMEA e sair com a base para um plano de sucessão de 90 dias.
      </p>

      {/* Action Button */}
      <div>
        <button
          onClick={() => {
            trackEvent('diagnostic_start');
            onStart();
          }}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-full bg-[#00D84F] hover:bg-[#25eb69] text-black font-extrabold text-base uppercase tracking-wider transition-all transform active:scale-98 shadow-xl shadow-[#00D84F]/20 cursor-pointer"
        >
          <span>Começar meu diagnóstico</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-white/40">
          Tempo estimado de preenchimento: 3 a 5 minutos. Nenhum dado confidencial da sua empresa é exposto publicamente.
        </p>
      </div>
    </div>
  );
};
