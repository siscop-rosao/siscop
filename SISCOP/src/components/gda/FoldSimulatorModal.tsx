import React, { useState } from 'react';
import { CardData, CardLayoutConfig } from '../../types';
import { PrintableCard } from './PrintableCard';
import { X, RotateCw, CheckCircle2, Eye, HelpCircle, Layers } from 'lucide-react';

interface FoldSimulatorModalProps {
  card: CardData;
  config: CardLayoutConfig;
  onClose: () => void;
  onUpdateConfig: (updates: Partial<CardLayoutConfig>) => void;
}

export const FoldSimulatorModal: React.FC<FoldSimulatorModalProps> = ({
  card,
  config,
  onClose,
  onUpdateConfig,
}) => {
  const [folded, setFolded] = useState(false);
  const [viewSide, setViewSide] = useState<'front' | 'back' | 'both'>('front');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-xs">
              3D
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                Simulador de Dobra e Orientação da Carteirinha
              </h2>
              <p className="text-xs text-slate-300">
                Visualize a carteirinha real aberta na folha e o resultado final exato após a dobra de bolso
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar simulador"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Controls Bar */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setFolded(!folded)}
              className={`px-4 py-2 rounded-lg font-semibold text-xs transition-all shadow-xs flex items-center gap-2 ${
                folded
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white text-slate-800 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              {folded ? 'Desdobrar (Ver Plano Aberto)' : 'Executar Dobra (Ver Tamanho Final)'}
            </button>

            {folded && (
              <div className="flex items-center bg-white border border-slate-300 rounded-lg p-1 text-xs shadow-xs">
                <button
                  onClick={() => setViewSide('front')}
                  className={`px-3 py-1 rounded font-medium transition-colors ${
                    viewSide === 'front' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Ver Frente
                </button>
                <button
                  onClick={() => setViewSide('back')}
                  className={`px-3 py-1 rounded font-medium transition-colors ${
                    viewSide === 'back' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Ver Verso (Tabelas de Pgto)
                </button>
                <button
                  onClick={() => setViewSide('both')}
                  className={`px-3 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                    viewSide === 'both' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>Ambas as Faces</span>
                </button>
              </div>
            )}
          </div>

          {/* Orientation Fix Option */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs shadow-xs">
            <input
              type="checkbox"
              id="flipVersoCheck"
              checked={config.rotateVerso180}
              onChange={(e) => onUpdateConfig({ rotateVerso180: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="flipVersoCheck" className="text-slate-700 font-medium cursor-pointer">
              Girar Verso em 180° (para alimentação invertida)
            </label>
          </div>
        </div>

        {/* Simulator Stage */}
        <div className="flex-1 bg-slate-200/80 p-6 sm:p-8 flex flex-col items-center justify-center overflow-auto min-h-[420px]">
          {!folded ? (
            /* ================= ESTADO ABERTO (PLANO DE IMPRESSÃO) ================= */
            <div className="flex flex-col items-center max-w-full">
              <div className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full shadow-xs border border-slate-200">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>Plano de Impressão Aberto na Cartolina (Frente e Verso Lado a Lado)</span>
              </div>

              {/* Card real in open state */}
              <div className="p-4 bg-white/80 rounded-xl shadow-md border border-slate-300 overflow-x-auto max-w-full flex items-center justify-center">
                <PrintableCard card={card} config={config} scale={1.15} />
              </div>

              <div className="mt-4 text-xs text-slate-600 flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-lg border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>
                  Comprimento total aberto: ~{config.cardWidthMm * 2 + 4} × {config.cardHeightMm} mm. Ao dobrar ao meio na linha tracejada, adquire o tamanho de bolso ({config.cardWidthMm} × {config.cardHeightMm} mm).
                </span>
              </div>
            </div>
          ) : (
            /* ================= ESTADO DOBRADO (CARTEIRINHA REAL FINAL) ================= */
            <div className="flex flex-col items-center max-w-full">
              <div className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-1.5 bg-white px-3.5 py-1.5 rounded-full shadow-xs border border-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {viewSide === 'both'
                    ? `Carteirinha Real Dobrada: Frente e Verso Lado a Lado (${config.cardWidthMm} × ${config.cardHeightMm} mm cada)`
                    : `Carteirinha Real Dobrada: ${viewSide === 'front' ? 'Face Dianteira (Frente)' : 'Face Traseira (Verso)'} (${config.cardWidthMm} × ${config.cardHeightMm} mm)`}
                </span>
              </div>

              {/* Layout da carteirinha dobrada */}
              {viewSide === 'both' ? (
                <div className="flex flex-wrap items-center justify-center gap-6 max-w-full">
                  {/* Face Dianteira Real */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide bg-white px-3 py-0.5 rounded-full border border-slate-200 shadow-xs">
                      Face Dianteira (Frente)
                    </span>
                    <div
                      className="p-3 bg-white/80 rounded-xl shadow-md border border-slate-300 flex items-center justify-center"
                      style={{
                        minWidth: `${config.cardWidthMm * 1.15 + 16}mm`,
                        minHeight: `${config.cardHeightMm * 1.15 + 16}mm`,
                      }}
                    >
                      <PrintableCard
                        card={card}
                        config={config}
                        scale={1.15}
                        renderOnly="front"
                        showFoldGuideline={false}
                      />
                    </div>
                  </div>

                  {/* Face Traseira Real */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide bg-white px-3 py-0.5 rounded-full border border-slate-200 shadow-xs">
                      Face Traseira (Verso / Pagamentos)
                    </span>
                    <div
                      className="p-3 bg-white/80 rounded-xl shadow-md border border-slate-300 flex items-center justify-center"
                      style={{
                        minWidth: `${config.cardWidthMm * 1.15 + 16}mm`,
                        minHeight: `${config.cardHeightMm * 1.15 + 16}mm`,
                      }}
                    >
                      <PrintableCard
                        card={card}
                        config={config}
                        scale={1.15}
                        renderOnly="back"
                        showFoldGuideline={false}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Visualização Individual (Frente ou Verso) com clique para virar */
                <div className="flex flex-col items-center">
                  <div
                    className="group relative cursor-pointer p-3 bg-white/80 rounded-xl shadow-md border border-slate-300 hover:shadow-xl hover:border-blue-300 transition-all duration-300 flex items-center justify-center"
                    style={{
                      minWidth: `${config.cardWidthMm * 1.15 + 16}mm`,
                      minHeight: `${config.cardHeightMm * 1.15 + 16}mm`,
                    }}
                    onClick={() => setViewSide((prev) => (prev === 'front' ? 'back' : 'front'))}
                    title="Clique na carteirinha para virar entre Frente e Verso"
                  >
                    <PrintableCard
                      card={card}
                      config={config}
                      scale={1.15}
                      renderOnly={viewSide}
                      showFoldGuideline={false}
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => setViewSide((prev) => (prev === 'front' ? 'back' : 'front'))}
                      className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                      <span>Virar Carteirinha (Mostrar {viewSide === 'front' ? 'Verso' : 'Frente'})</span>
                    </button>
                    <span className="text-[11px] text-slate-500">
                      • Clique sobre a carteirinha para alternar as faces
                    </span>
                  </div>
                </div>
              )}

              {/* Barra de Validação de Dobra */}
              <div className="mt-4 flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-lg text-xs max-w-xl text-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Layout 100% Real:</strong> Dados do associado, foto 3x4, brasão, tipografia e grade de 24 mensalidades exibidos com fidelidade milimétrica exata ({config.cardWidthMm} × {config.cardHeightMm} mm).
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Dica: Use papel cartolina ou papel couchê 180g a 240g para acabamento firme e durável.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            Entendido, Voltar ao Layout
          </button>
        </div>
      </div>
    </div>
  );
};
