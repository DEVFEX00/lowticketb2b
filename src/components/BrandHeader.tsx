import React from 'react';
import { AccessStatus } from '../types';
import { FexLogo } from './FexLogo';
import { ShieldCheck, Sparkles, LayoutDashboard } from 'lucide-react';

interface BrandHeaderProps {
  currentScreen: string;
  accessStatus: AccessStatus;
  hasResult?: boolean;
  devMode?: boolean;
  onNavigate: (screen: string) => void;
  onSelectDemoState?: (status: AccessStatus) => void;
  onToggleDevMode?: () => void;
  onReset?: () => void;
}

export const BrandHeader: React.FC<BrandHeaderProps> = ({
  currentScreen,
  accessStatus,
  hasResult = false,
  onNavigate
}) => {
  return (
    <header className="w-full sticky top-0 z-40 shadow-sm">
      {/* Top micro bar */}
      <div className="bg-[#0D0D0D] text-white/70 text-[11px] py-1.5 px-4 border-b border-white/5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00D84F] inline-block"></span>
            <span className="font-semibold text-white/90">FACULDADE FEX EDUCAÇÃO</span>
            <span className="hidden sm:inline text-white/40">|</span>
            <span className="hidden sm:inline text-white/70">
              Metodologia Atitude Emocional® & Transferência de Conhecimento Tácito
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-[#00D84F]">
              <ShieldCheck className="w-3 h-3" />
              Ambiente Seguro
            </span>
          </div>
        </div>
      </div>

      {/* Main Brand & Navigation Bar */}
      <div className="bg-[#000000] py-3 px-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div 
            onClick={() => onNavigate('hub')} 
            className="flex items-center cursor-pointer group"
            title="Ir para Área do Cliente"
          >
            <FexLogo variant="dark" size="sm" />
          </div>

          {/* Quick navigation links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onNavigate('hub')}
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                currentScreen === 'hub'
                  ? 'bg-[#00D84F] text-black shadow-sm'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <LayoutDashboard className="w-3 h-3 text-current" />
              <span>Área do Cliente</span>
            </button>

            <button
              onClick={() => onNavigate(hasResult ? 'resultado' : 'perfil')}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                ['perfil', 'cargos', 'resultado'].includes(currentScreen)
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Diagnóstico
            </button>

            <button
              onClick={() => onNavigate('curso')}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                currentScreen === 'curso'
                  ? 'bg-[#00D84F] text-black'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Mini-Curso
            </button>

            <button
              onClick={() => onNavigate('plano')}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                currentScreen === 'plano'
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              Plano
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
