import React from 'react';
import { DiagnosticoResultado, LeadInfo, PlanoSucessao, TacitKnowledgeSelection } from '../types';
import { formatarMoeda, LABEL_CLASSIFICACAO } from '../utils/calculations';

interface PrintReportViewProps {
  resultado: DiagnosticoResultado | null;
  lead: LeadInfo;
  plano: PlanoSucessao | null;
  tacit: TacitKnowledgeSelection;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({
  resultado,
  lead,
  plano,
  tacit
}) => {
  const dataHoje = new Date().toLocaleDateString('pt-BR');
  const chipsList = [
    ...tacit.tecnico,
    ...tacit.relacionamentos,
    ...tacit.julgamento,
    ...tacit.cultura
  ];

  return (
    <div className="print-only p-8 text-black bg-white max-w-4xl mx-auto font-['Montserrat']">
      {/* Print Header */}
      <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">
            FEX Educação • Faculdade Credenciada pelo MEC
          </h1>
          <p className="text-xs text-neutral-600 mt-1">
            Portaria nº 196/2024 • Metodologia Atitude Emocional® & Curadoria Universitária
          </p>
          <h2 className="text-lg font-bold mt-2">
            Relatório Executivo: Diagnóstico de Risco de Pessoa-Chave & Plano de Sucessão
          </h2>
        </div>
        <div className="text-right text-xs text-neutral-600">
          <p><strong>Data:</strong> {dataHoje}</p>
          <p><strong>Empresa:</strong> {lead.empresa || plano?.empresa || 'Empresa Avaliada'}</p>
          <p><strong>Responsável:</strong> {lead.nome || 'Liderança Executiva'}</p>
          <p><strong>Cargo:</strong> {lead.cargo || 'Gestor'}</p>
        </div>
      </div>

      {/* Risco Financeiro Total */}
      {resultado && (
        <div className="mb-6 p-4 border border-black rounded-lg bg-neutral-50">
          <span className="text-xs uppercase font-extrabold text-neutral-500 block">
            Custo Total Estimado de Ruptura
          </span>
          <div className="text-3xl font-black my-1">
            {formatarMoeda(resultado.custoTotal)}
          </div>
          <p className="text-xs text-neutral-700">
            Nível Geral: <strong>{LABEL_CLASSIFICACAO[resultado.nivelGeral]}</strong> • {resultado.cargosCalculados.length} cargo(s) avaliado(s) • Metodologia FMEA cruzada com SHRM (Society for Human Resource Management).
          </p>
        </div>
      )}

      {/* 1. Mapa de Cargos Críticos */}
      {resultado && resultado.cargosCalculados.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-extrabold uppercase border-b border-neutral-300 pb-1 mb-3">
            1. Cargos Críticos Avaliados
          </h3>
          <div className="space-y-3">
            {resultado.cargosCalculados.map((cargo, idx) => (
              <div key={cargo.id} className="p-3 border border-neutral-300 rounded text-xs">
                <div className="flex justify-between font-bold text-sm mb-1">
                  <span>{idx + 1}. {cargo.nome}</span>
                  <span>{formatarMoeda(cargo.custoTotalCargo)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-neutral-600">
                  <div>Salário: {formatarMoeda(cargo.salarioMensal)}/mês</div>
                  <div>Índice FMEA: {cargo.indice} (C:{cargo.criticidade} | D:{cargo.dependencia} | R:{cargo.reposicao})</div>
                  <div>Classificação: {LABEL_CLASSIFICACAO[cargo.classificacao]}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-neutral-500 mt-1 pt-1 border-t border-neutral-200">
                  <div>Custo de Transição: {formatarMoeda(cargo.custoTransicao)}</div>
                  <div>Produtividade Perdida: {formatarMoeda(cargo.custoProdutividade)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Raio-X do Conhecimento Tácito */}
      {chipsList.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-extrabold uppercase border-b border-neutral-300 pb-1 mb-2">
            2. Raio-X dos Conhecimentos Tácitos Vulneráveis
          </h3>
          <ul className="list-disc list-inside text-xs space-y-1 text-neutral-800">
            {chipsList.map((chip, i) => (
              <li key={i}>{chip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 3. Plano de Sucessão de 90 Dias */}
      {plano && (
        <div className="page-break pt-4">
          <h3 className="text-sm font-extrabold uppercase border-b border-neutral-300 pb-1 mb-3">
            3. Plano de Sucessão de 90 Dias (5 Fases FEX)
          </h3>
          <p className="text-xs text-neutral-600 mb-4">
            Prioridade Estratégica: <strong>{plano.nivelPrioridade}</strong> • Cargo de Maior Atenção: <strong>{plano.cargoPrincipal}</strong>
          </p>

          <div className="space-y-4">
            {plano.fases.map((fase) => (
              <div key={fase.id} className="p-3 border border-neutral-300 rounded text-xs">
                <div className="flex justify-between font-bold mb-1">
                  <span className="text-sm">{fase.titulo}</span>
                  <span className="text-neutral-500">{fase.periodo}</span>
                </div>
                <p className="text-neutral-600 italic mb-2">Objetivo: {fase.objetivo}</p>
                <ul className="list-disc list-inside space-y-1">
                  {fase.acoes.map((acao, aIdx) => (
                    <li key={aIdx} className="text-neutral-800">{acao}</li>
                  ))}
                </ul>
                <div className="mt-2 text-[10px] text-neutral-500">
                  Responsável Recomendado: {fase.responsavelSugerido}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-3 bg-neutral-100 border border-neutral-300 rounded text-xs">
            <strong>Diretriz Metodológica (Método Atitude Emocional®):</strong>
            <p className="mt-1 text-neutral-700">{plano.alertaEmocional}</p>
          </div>
        </div>
      )}

      {/* Print Footer */}
      <div className="mt-8 pt-4 border-t border-neutral-300 text-center text-xs text-neutral-500">
        <p className="font-bold text-black">Faculdade FEX Educação — fexeducacao.edu.br</p>
        <p>Instituição de Ensino Superior Credenciada pelo MEC — Portaria 196/2024</p>
        <p className="mt-1 font-semibold text-black">#sejaFEX</p>
      </div>
    </div>
  );
};
