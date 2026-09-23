import React, { useState } from 'react';
import { VideoAula } from '../types';
import { AULAS_FEX_MINICURSO } from '../data/mockDefaults';
import { FexLogo } from './FexLogo';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle2, 
  Circle, 
  Clock, 
  BookOpen, 
  Award, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  Share2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { trackEvent } from '../services/analytics';

interface MiniCursoViewProps {
  cursoProgresso: Record<string, boolean>;
  onToggleAulaConcluida: (aulaId: string) => void;
  onBack: () => void;
  isLocked?: boolean;
  onUnlock?: () => void;
}

export const MiniCursoView: React.FC<MiniCursoViewProps> = ({
  cursoProgresso,
  onToggleAulaConcluida,
  onBack,
  isLocked = false,
  onUnlock
}) => {
  const aulas = AULAS_FEX_MINICURSO;
  const [aulaAtiva, setAulaAtiva] = useState<VideoAula>(aulas[0]);

  const totalAulas = aulas.length;
  const aulasConcluidas = aulas.filter((a) => cursoProgresso[a.id]).length;
  const percentualConclusao = Math.round((aulasConcluidas / totalAulas) * 100);

  const handleSelecionarAula = (aula: VideoAula) => {
    setAulaAtiva(aula);
    trackEvent('course_lesson_selected', { 
      aulaId: aula.id, 
      titulo: aula.titulo,
      youtubeId: aula.youtubeId
    });
  };

  const isAulaConcluida = Boolean(cursoProgresso[aulaAtiva.id]);

  return (
    <div className="w-full max-w-6xl mx-auto py-6 sm:py-10 px-4 sm:px-6 animate-fadeIn">
      {/* Top Bar Navigation */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-98"
        >
          <span>← Voltar para Área de Membros</span>
        </button>

        <div className="flex items-center gap-3">
          <FexLogo variant="light" size="sm" />
        </div>
      </div>

      {/* Main Course Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#00D84F] bg-black px-3 py-0.5 rounded-full inline-block">
                Formação Executiva FEX
              </span>
              <span className="text-xs font-semibold text-neutral-500">
                Curso Prático em 4 Aulas
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900">
              Curso FEX Educação
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 mt-1 leading-relaxed">
              Conteúdos exclusivos para transformar conhecimento em prática.
            </p>
          </div>

          {/* Progress Box */}
          <div className="bg-neutral-50 p-4 sm:p-5 rounded-2xl border border-neutral-200/90 min-w-[240px]">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5 text-neutral-800">
              <span>Seu progresso:</span>
              <span className="text-[#00D84F] font-black text-sm">{percentualConclusao}%</span>
            </div>

            <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00D84F] transition-all duration-500 rounded-full"
                style={{ width: `${percentualConclusao}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-500 mt-2 font-medium">
              <span>{aulasConcluidas} de {totalAulas} aulas concluídas</span>
              {percentualConclusao === 100 && (
                <span className="text-emerald-700 font-bold">100% Concluído ✓</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Course Area: Player & Playlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Main Column: Video Player and Lesson Details (appears FIRST on mobile) */}
        <div className="lg:col-span-2 flex flex-col gap-6 order-1 lg:order-1">
          {/* 16:9 Responsive Video Container */}
          {isLocked ? (
            <div className="w-full bg-neutral-950 text-white rounded-3xl overflow-hidden aspect-video relative shadow-lg border border-neutral-800 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-center mb-3 text-[#00D84F]">
                <Lock className="w-7 h-7" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#00D84F] mb-1">
                Conteúdo Reservado
              </span>
              <h3 className="text-base sm:text-lg font-black text-white max-w-md mb-2">
                {aulaAtiva.titulo}
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm mb-4 leading-relaxed">
                Este curso está incluso na aquisição do Diagnóstico de Custo de Pessoa-Chave por R$ 67,00.
              </p>
              {onUnlock && (
                <button
                  onClick={onUnlock}
                  className="px-6 py-3 rounded-full bg-[#00D84F] hover:bg-[#25eb69] text-black font-extrabold text-xs uppercase tracking-wider transition-all transform active:scale-98 shadow-lg shadow-[#00D84F]/20 flex items-center gap-2 cursor-pointer"
                >
                  <span>Liberar Acesso no Diagnóstico (R$ 67)</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </button>
              )}
            </div>
          ) : (
            <div className="w-full bg-black rounded-3xl overflow-hidden aspect-video relative shadow-lg border border-neutral-800">
              <iframe
                key={aulaAtiva.id}
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${aulaAtiva.youtubeId}?rel=0&modestbranding=1`}
                title={aulaAtiva.titulo}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0 absolute inset-0"
              />
            </div>
          )}

          {/* Lesson Metadata & Status Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200/80 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-neutral-100">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
                  <span className="bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded font-black text-[11px]">
                    {aulaAtiva.numero || 'Aula'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {aulaAtiva.duracao}
                  </span>
                  <span>•</span>
                  <span className="text-[#00D84F] font-bold">YouTube Vídeo Não Listado</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                  {aulaAtiva.titulo}
                </h2>
              </div>

              {/* Mark Complete Button */}
              {!isLocked ? (
                <button
                  onClick={() => onToggleAulaConcluida(aulaAtiva.id)}
                  className={`shrink-0 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98 ${
                    isAulaConcluida
                      ? 'bg-[#00D84F] text-black shadow-md shadow-[#00D84F]/20'
                      : 'bg-black hover:bg-neutral-800 text-white'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAulaConcluida ? 'Aula Concluída ✓' : 'Marcar como Concluída'}</span>
                </button>
              ) : (
                <span className="shrink-0 px-4 py-2 rounded-full bg-neutral-100 text-neutral-500 text-xs font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Bloqueado</span>
                </span>
              )}
            </div>

            {/* Description */}
            <div className="pt-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-2">
                Sobre esta aula
              </h3>
              <p className="text-sm sm:text-base text-neutral-700 leading-relaxed">
                {aulaAtiva.descricao}
              </p>
            </div>

            {/* Navigation buttons between lessons */}
            <div className="mt-6 pt-5 border-t border-neutral-100 flex items-center justify-between gap-3">
              {(() => {
                const currentIndex = aulas.findIndex((a) => a.id === aulaAtiva.id);
                const prevAula = currentIndex > 0 ? aulas[currentIndex - 1] : null;
                const nextAula = currentIndex < aulas.length - 1 ? aulas[currentIndex + 1] : null;

                return (
                  <>
                    {prevAula ? (
                      <button
                        onClick={() => handleSelecionarAula(prevAula)}
                        className="text-xs font-bold text-neutral-600 hover:text-black flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Aula anterior</span>
                      </button>
                    ) : <div />}

                    {nextAula && (
                      <button
                        onClick={() => handleSelecionarAula(nextAula)}
                        className="text-xs font-bold text-neutral-900 hover:text-[#00D84F] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>Próxima aula</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Academic seal & certification note */}
          <div className="bg-black text-white rounded-3xl p-6 border border-neutral-800 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-[#00D84F]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-wider text-white">
                Metodologia Atitude Emocional® • Faculdade FEX Educação
              </h4>
              <p className="text-xs text-white/70 mt-1 leading-relaxed">
                As 4 aulas deste curso foram estruturadas para transformar o conhecimento tácito em metodologia corporativa viva, superando a resistência emocional e garantindo a continuidade do seu negócio.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Lessons Playlist (order-2, responsive) */}
        <div className="lg:col-span-1 flex flex-col gap-4 order-2 lg:order-2">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-neutral-200/80 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-4">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-neutral-900">
                  Grade do Curso
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  4 aulas práticas em vídeo
                </p>
              </div>
              <span className="text-[11px] font-bold bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-full">
                {aulasConcluidas}/4
              </span>
            </div>

            {/* List of 4 Lessons */}
            <div className="space-y-3">
              {aulas.map((aula, index) => {
                const isSelected = aula.id === aulaAtiva.id;
                const isDone = Boolean(cursoProgresso[aula.id]);

                return (
                  <button
                    key={aula.id}
                    type="button"
                    onClick={() => handleSelecionarAula(aula)}
                    className={`w-full p-4 rounded-2xl text-left transition-all flex items-start gap-3.5 cursor-pointer relative border ${
                      isSelected
                        ? 'bg-black text-white border-black shadow-md'
                        : isDone
                        ? 'bg-neutral-50/80 hover:bg-neutral-100/80 text-neutral-900 border-neutral-200/80'
                        : 'bg-white hover:bg-neutral-50 text-neutral-900 border-neutral-200/80'
                    }`}
                  >
                    {/* Status icon */}
                    <div className="mt-0.5 shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-[#00D84F]" />
                      ) : isLocked ? (
                        <Lock className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-[#00D84F]' : 'text-neutral-400'}`} />
                      ) : isSelected ? (
                        <Play className="w-5 h-5 text-[#00D84F] fill-[#00D84F]" />
                      ) : (
                        <Circle className="w-5 h-5 text-neutral-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${
                          isSelected ? 'text-[#00D84F]' : 'text-neutral-400'
                        }`}>
                          {aula.numero || `Aula 0${index + 1}`}
                        </span>

                        <span className={`text-[10px] font-medium flex items-center gap-1 ${
                          isSelected ? 'text-white/60' : 'text-neutral-400'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {aula.duracao}
                        </span>
                      </div>

                      <h4 className={`text-xs font-bold leading-snug ${
                        isSelected ? 'text-white' : 'text-neutral-900'
                      }`}>
                        {aula.titulo}
                      </h4>

                      <p className={`text-[11px] mt-1.5 line-clamp-2 leading-relaxed ${
                        isSelected ? 'text-white/70' : 'text-neutral-500'
                      }`}>
                        {aula.descricao}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Return to Hub button at bottom of playlist */}
            <div className="pt-5 mt-4 border-t border-neutral-100">
              <button
                onClick={onBack}
                className="w-full py-3 px-4 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-extrabold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar para Área do Cliente</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
