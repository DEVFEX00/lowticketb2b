import React, { useState } from 'react';
import { PerfilEmpresa, CargoCritico, SegmentoEmpresa, PorteEmpresa } from '../types';
import { SALARIO_MIN, SALARIO_MAX, SALARIO_STEP, SALARIO_PADRAO, formatarMoeda } from '../utils/calculations';
import { Plus, Trash2, ChevronRight, AlertCircle, ArrowLeft, Check } from 'lucide-react';
import { trackEvent } from '../services/analytics';
import { sendPerfilInitialToN8n } from '../services/webhook';

interface DiagnosticFormProps {
  step: 'perfil' | 'cargos';
  perfil: PerfilEmpresa;
  onUpdatePerfil: (perfil: PerfilEmpresa) => void;
  cargos: CargoCritico[];
  onUpdateCargos: (cargos: CargoCritico[]) => void;
  onCalculate: () => void;
  onBack: () => void;
}

const SEGMENTOS: SegmentoEmpresa[] = [
  'Industria',
  'Varejo/Comercio',
  'Servicos',
  'Tecnologia',
  'Saude',
  'Financeiro',
  'Agronegocio',
  'Educacao',
  'Construcao Civil',
  'Outro'
];

const PORTES: { value: PorteEmpresa; label: string }[] = [
  { value: 'Ate100', label: 'Até 100 colaboradores' },
  { value: '101a300', label: '101 a 300 colaboradores' },
  { value: '301a1000', label: '301 a 1000 colaboradores' },
  { value: '1001a3000', label: '1001 a 3000 colaboradores' },
  { value: '3001ouMais', label: '3001 ou mais colaboradores' }
];

export const DiagnosticForm: React.FC<DiagnosticFormProps> = ({
  step,
  perfil,
  onUpdatePerfil,
  cargos,
  onUpdateCargos,
  onCalculate,
  onBack
}) => {
  // Current role being edited
  const [cargoEmEdicao, setCargoEmEdicao] = useState<CargoCritico>({
    id: 'temp-' + Date.now(),
    nome: '',
    salarioMensal: SALARIO_PADRAO,
    criticidade: 3,
    dependencia: 3,
    reposicao: 3
  });

  const [formAberto, setFormAberto] = useState<boolean>(cargos.length === 0);

  // Profile validation
  const isPerfilValido = Boolean(
    perfil.segmento &&
    perfil.porte &&
    (perfil.segmento !== 'Outro' || (perfil.segmentoOutro && perfil.segmentoOutro.trim().length >= 2))
  );

  // Add cargo
  const handleSalvarCargo = () => {
    if (!cargoEmEdicao.nome.trim()) return;

    const novoCargo: CargoCritico = {
      ...cargoEmEdicao,
      id: 'cargo-' + Date.now(),
      nome: cargoEmEdicao.nome.trim()
    };

    const novaLista = [...cargos, novoCargo];
    onUpdateCargos(novaLista);
    trackEvent('cargo_added', { total_cargos: novaLista.length, nome: novoCargo.nome });

    setCargoEmEdicao({
      id: 'temp-' + Date.now(),
      nome: '',
      salarioMensal: SALARIO_PADRAO,
      criticidade: 3,
      dependencia: 3,
      reposicao: 3
    });
    setFormAberto(false);
  };

  const handleRemoverCargo = (id: string) => {
    const novaLista = cargos.filter(c => c.id !== id);
    onUpdateCargos(novaLista);
    if (novaLista.length === 0) {
      setFormAberto(true);
    }
  };

  // STEP 1: PERFIL DA EMPRESA
  if (step === 'perfil') {
    return (
      <div className="w-full max-w-2xl mx-auto py-8 px-4 sm:px-6 bg-white text-black rounded-2xl shadow-xl animate-fadeIn">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#00D84F] bg-black px-3 py-1 rounded-full">
            Etapa 1 de 4 • Perfil da Empresa
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black mb-2">
          Fale rápido sobre a sua empresa
        </h2>
        <p className="text-sm text-neutral-600 mb-6">
          Dois toques rápidos para calibrar os parâmetros setoriais e seguimos.
        </p>

        {/* Segmento */}
        <div className="mb-6">
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-3">
            Qual o segmento da empresa?
          </label>
          <div className="flex flex-wrap gap-2">
            {SEGMENTOS.map((seg) => {
              const selected = perfil.segmento === seg;
              return (
                <button
                  key={seg}
                  type="button"
                  onClick={() => onUpdatePerfil({ ...perfil, segmento: seg })}
                  className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    selected
                      ? 'bg-black text-white border-2 border-black shadow-md'
                      : 'bg-[#F4F4F4] text-neutral-800 border border-neutral-300 hover:border-black'
                  }`}
                >
                  {seg}
                </button>
              );
            })}
          </div>

          {perfil.segmento === 'Outro' && (
            <div className="mt-3">
              <input
                type="text"
                placeholder="Qual o segmento específico?"
                value={perfil.segmentoOutro || ''}
                onChange={(e) => onUpdatePerfil({ ...perfil, segmentoOutro: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-[#F4F4F4] text-sm focus:outline-none focus:border-[#00D84F]"
              />
            </div>
          )}
        </div>

        {/* Porte da Empresa */}
        <div className="mb-8">
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-3">
            Quantos colaboradores a empresa tem, no total?
          </label>
          <div className="flex flex-wrap gap-2">
            {PORTES.map((porteItem) => {
              const selected = perfil.porte === porteItem.value;
              return (
                <button
                  key={porteItem.value}
                  type="button"
                  onClick={() => onUpdatePerfil({ ...perfil, porte: porteItem.value })}
                  className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    selected
                      ? 'bg-black text-white border-2 border-black shadow-md'
                      : 'bg-[#F4F4F4] text-neutral-800 border border-neutral-300 hover:border-black'
                  }`}
                >
                  {porteItem.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Continue Button */}
        <button
          disabled={!isPerfilValido}
          onClick={() => {
            trackEvent('company_profile_completed', perfil);
            sendPerfilInitialToN8n(perfil);
            onCalculate(); // Advances to cargos screen
          }}
          className={`w-full py-4 px-6 rounded-full font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isPerfilValido
              ? 'bg-[#00D84F] hover:bg-[#25eb69] text-black shadow-lg shadow-[#00D84F]/20'
              : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
          }`}
        >
          <span>Continuar para Cargos Críticos</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // STEP 2: CARGOS CRÍTICOS
  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4 sm:px-6 bg-white text-black rounded-2xl shadow-xl animate-fadeIn">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs font-bold text-neutral-500 hover:text-black flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar ao perfil
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-[#00D84F] bg-black px-3 py-1 rounded-full">
          Etapa 2 de 4 • Cargos Críticos
        </span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black mb-2">
        Quais cargos doeriam mais se a pessoa saísse?
      </h2>
      <p className="text-sm text-neutral-600 mb-6">
        Adicione de 1 a 5 posições estratégicas onde a perda de conhecimento tácito geraria crise imediata.
      </p>

      {/* Lista de cargos já adicionados */}
      {cargos.length > 0 && (
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-500 uppercase tracking-wider">
            <span>Cargos Adicionados ({cargos.length} de 5)</span>
          </div>

          {cargos.map((cargo, idx) => {
            const indice = cargo.criticidade * cargo.dependencia * cargo.reposicao;
            const isCritico = indice >= 64;
            const isRelevante = indice >= 28 && indice < 64;

            return (
              <div
                key={cargo.id}
                className="p-4 rounded-xl border border-neutral-200 bg-[#F4F4F4] flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-black">
                      {idx + 1}. {cargo.nome}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isCritico
                          ? 'bg-[#00D84F] text-black'
                          : isRelevante
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      Índice FMEA: {indice}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-600 mt-1">
                    Salário: <strong>{formatarMoeda(cargo.salarioMensal)}</strong>/mês • C: {cargo.criticidade} | D: {cargo.dependencia} | R: {cargo.reposicao}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoverCargo(cargo.id)}
                  className="text-neutral-400 hover:text-red-600 p-2 transition-colors cursor-pointer"
                  title="Remover cargo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Formulário de adicionar novo cargo */}
      {formAberto && cargos.length < 5 ? (
        <div className="p-5 rounded-xl border-2 border-neutral-300 bg-neutral-50 mb-6">
          <h3 className="text-base font-extrabold text-black mb-4">
            {cargos.length === 0 ? 'Adicionar primeiro cargo crítico' : `Adicionar Cargo #${cargos.length + 1}`}
          </h3>

          {/* Nome do cargo */}
          <div className="mb-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
              Nome da posição ou pessoa-chave *
            </label>
            <input
              type="text"
              placeholder="Ex: Diretor Comercial, Gerente Industrial, Arquiteto Chefe"
              value={cargoEmEdicao.nome}
              onChange={(e) => setCargoEmEdicao({ ...cargoEmEdicao, nome: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-white text-sm focus:outline-none focus:border-[#00D84F]"
            />
          </div>

          {/* Faixa Salarial Slider */}
          <div className="mb-5 bg-white p-4 rounded-xl border border-neutral-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Faixa Salarial Mensal Bruta
              </label>
              <span className="text-base font-black text-[#00D84F]">
                {formatarMoeda(cargoEmEdicao.salarioMensal)}
              </span>
            </div>
            <input
              type="range"
              min={SALARIO_MIN}
              max={SALARIO_MAX}
              step={SALARIO_STEP}
              value={cargoEmEdicao.salarioMensal}
              onChange={(e) => setCargoEmEdicao({ ...cargoEmEdicao, salarioMensal: Number(e.target.value) })}
              className="w-full accent-[#00D84F] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-neutral-400 mt-1 font-semibold">
              <span>{formatarMoeda(SALARIO_MIN)}</span>
              <span>{formatarMoeda(SALARIO_MAX)}</span>
            </div>
          </div>

          {/* Criticidade (1 a 5) */}
          <div className="mb-4 bg-white p-4 rounded-xl border border-neutral-200">
            <div className="mb-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-black block">
                1. Criticidade do Impacto
              </span>
              <span className="text-xs text-neutral-500">
                O quanto o negócio para ou sofre prejuízo financeiro se a pessoa sair amanhã.
              </span>
            </div>
            <div className="flex gap-2 my-2.5">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCargoEmEdicao({ ...cargoEmEdicao, criticidade: val })}
                  className={`flex-1 py-2 rounded-lg font-black text-sm transition-all cursor-pointer ${
                    cargoEmEdicao.criticidade === val
                      ? 'bg-[#00D84F] text-black shadow-md'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-neutral-500 font-semibold">
              <span>1 = Baixo impacto</span>
              <span>5 = Prejuízo severo / Parada</span>
            </div>
          </div>

          {/* Dependência (1 a 5) */}
          <div className="mb-4 bg-white p-4 rounded-xl border border-neutral-200">
            <div className="mb-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-black block">
                2. Dependência de Conhecimento Tácito
              </span>
              <span className="text-xs text-neutral-500">
                O quanto o conhecimento está apenas na cabeça dela, sem processos documentados.
              </span>
            </div>
            <div className="flex gap-2 my-2.5">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCargoEmEdicao({ ...cargoEmEdicao, dependencia: val })}
                  className={`flex-1 py-2 rounded-lg font-black text-sm transition-all cursor-pointer ${
                    cargoEmEdicao.dependencia === val
                      ? 'bg-[#00D84F] text-black shadow-md'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-neutral-500 font-semibold">
              <span>1 = Tudo documentado e compartilhado</span>
              <span>5 = 100% na cabeça dela</span>
            </div>
          </div>

          {/* Reposição (1 a 5) */}
          <div className="mb-5 bg-white p-4 rounded-xl border border-neutral-200">
            <div className="mb-1">
              <span className="text-xs font-extrabold uppercase tracking-wider text-black block">
                3. Dificuldade de Reposição no Mercado
              </span>
              <span className="text-xs text-neutral-500">
                Tempo e escassez para formar internamente ou recrutar substituto à altura.
              </span>
            </div>
            <div className="flex gap-2 my-2.5">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setCargoEmEdicao({ ...cargoEmEdicao, reposicao: val })}
                  className={`flex-1 py-2 rounded-lg font-black text-sm transition-all cursor-pointer ${
                    cargoEmEdicao.reposicao === val
                      ? 'bg-[#00D84F] text-black shadow-md'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-neutral-500 font-semibold">
              <span>1 = Rápido e fácil (&lt; 3 meses)</span>
              <span>5 = Mais de 12 a 24 meses</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!cargoEmEdicao.nome.trim()}
              onClick={handleSalvarCargo}
              className={`flex-1 py-3 px-4 rounded-full font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                cargoEmEdicao.nome.trim()
                  ? 'bg-black hover:bg-neutral-800 text-white'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              Salvar este cargo
            </button>

            {cargos.length > 0 && (
              <button
                type="button"
                onClick={() => setFormAberto(false)}
                className="py-3 px-4 rounded-full text-xs font-semibold text-neutral-500 hover:text-black"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      ) : (
        cargos.length < 5 && (
          <button
            type="button"
            onClick={() => setFormAberto(true)}
            className="w-full py-3.5 px-4 mb-6 rounded-xl border-2 border-dashed border-neutral-300 hover:border-black text-neutral-700 hover:text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#00D84F]" />
            <span>Adicionar outro cargo crítico</span>
          </button>
        )
      )}

      {/* Primary Calculate CTA */}
      <div className="pt-2">
        <button
          disabled={cargos.length === 0}
          onClick={() => {
            trackEvent('risk_calculation_initiated', { total_cargos: cargos.length });
            onCalculate();
          }}
          className={`w-full py-4 px-6 rounded-full font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            cargos.length > 0
              ? 'bg-[#00D84F] hover:bg-[#25eb69] text-black shadow-lg shadow-[#00D84F]/20'
              : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
          }`}
        >
          <span>Calcular meu risco em reais</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
