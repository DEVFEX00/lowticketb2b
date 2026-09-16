import React, { useEffect, useState } from 'react';

interface CalculatingSuspenseProps {
  onFinish: () => void;
}

const STEPS = [
  'Aplicando a metodologia de risco baseada em FMEA...',
  'Cruzando com parâmetros de custo de reposição da SHRM...',
  'Calculando índice de risco e fator de transição por cargo...',
  'Projetando custo de rampa e produtividade perdida...',
  'Montando o diagnóstico estratégico e mapa de vulnerabilidade...'
];

export const CalculatingSuspense: React.FC<CalculatingSuspenseProps> = ({ onFinish }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        } else {
          clearInterval(timer);
          setTimeout(onFinish, 600);
          return prev;
        }
      });
    }, 550);

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div className="w-full max-w-lg mx-auto py-16 px-6 text-center text-white flex flex-col items-center justify-center animate-fadeIn min-h-[60vh]">
      {/* Animated Spinner with brand green */}
      <div className="relative w-20 h-20 mb-8">
        <div className="w-20 h-20 rounded-full border-4 border-white/10 border-t-[#00D84F] animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-[#00D84F]">
          FEX
        </div>
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-white mb-2">
        Calculando o Risco da sua Empresa
      </h2>
      <p className="text-sm text-white/60 mb-8">
        Cruzando bases empíricas com a metodologia da Faculdade FEX Educação
      </p>

      {/* Steps List */}
      <div className="w-full space-y-3 text-left">
        {STEPS.map((stepText, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;

          return (
            <div
              key={idx}
              className={`flex items-center gap-3 text-xs sm:text-sm transition-all duration-300 ${
                isCurrent
                  ? 'text-white font-bold opacity-100 scale-102'
                  : isDone
                  ? 'text-[#00D84F] opacity-90'
                  : 'text-white/30 opacity-30'
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors ${
                  isDone || isCurrent ? 'bg-[#00D84F]' : 'bg-white/20'
                }`}
              />
              <span>{stepText}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
