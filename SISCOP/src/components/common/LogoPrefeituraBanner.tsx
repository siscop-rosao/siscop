import React from 'react';
import { BrasaoPousoAlegre } from './BrasaoPousoAlegre';

interface LogoPrefeituraBannerProps {
  className?: string;
  brasaoSize?: number;
}

export const LogoPrefeituraBanner: React.FC<LogoPrefeituraBannerProps> = ({
  className = '',
  brasaoSize = 100,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center select-none py-2 px-4 ${className}`}
      aria-label="Logotipo Oficial da Prefeitura Municipal de Pouso Alegre"
    >
      {/* Brasão Oficial Colorido com Sombra Suave */}
      <div className="relative mb-3 flex items-center justify-center transition-transform hover:scale-105 duration-200">
        <BrasaoPousoAlegre size={brasaoSize} className="drop-shadow-md" />
      </div>

      {/* Dizeres Oficiais Institucionais */}
      <div className="flex flex-col items-center justify-center space-y-1">
        <span className="text-[11px] sm:text-xs font-black tracking-[0.2em] uppercase text-blue-900 leading-none">
          ESTADO DE MINAS GERAIS
        </span>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-slate-900 leading-tight">
          PREFEITURA MUNICIPAL DE POUSO ALEGRE
        </h2>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-blue-700">
            Secretaria Municipal de Esportes e Lazer
          </span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-slate-600">
            Praça de Esportes Pref. Alvarim Vieira Rios
          </span>
        </div>
      </div>
    </div>
  );
};
