import React from 'react';
import { FexLogo } from './FexLogo';

interface BrandFooterProps {
  isDark?: boolean;
}

export const BrandFooter: React.FC<BrandFooterProps> = ({ isDark = true }) => {
  return (
    <footer className={`w-full py-8 px-4 mt-auto no-print ${isDark ? 'bg-black text-white/70' : 'bg-[#F4F4F4] text-[#111111]'}`}>
      <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-3">
        <FexLogo variant={isDark ? 'dark' : 'light'} size="sm" />
        <p className="text-xs font-semibold mt-1">
          Faculdade FEX Educação — Credenciada pelo MEC através da Portaria nº 196/2024
        </p>
        <p className="text-[11px] opacity-70">
          Metodologia Atitude Emocional® & Curadoria Universitária de Gestão do Conhecimento
        </p>
        <div className="text-[11px] opacity-60 flex flex-wrap justify-center gap-4 mt-1">
          <span>fexeducacao.edu.br</span>
          <span>•</span>
          <span>São Paulo / Brasil</span>
          <span>•</span>
          <span>Todos os direitos reservados</span>
        </div>
      </div>
    </footer>
  );
};
