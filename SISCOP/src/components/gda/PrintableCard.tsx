import React, { useRef } from 'react';
import { CardData, CardLayoutConfig } from '../../types';
import { BrasaoPousoAlegre } from '../common/BrasaoPousoAlegre';
import { Scissors, Camera, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface PrintableCardProps {
  card: CardData;
  config: CardLayoutConfig;
  showFoldGuideline?: boolean;
  scale?: number;
  className?: string;
  isPrintPreview?: boolean;
  onPhotoChange?: (photoUrl: string) => void;
  renderOnly?: 'both' | 'front' | 'back';
}

const MONTHS_LIST = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

export const PrintableCard: React.FC<PrintableCardProps> = ({
  card,
  config,
  showFoldGuideline = true,
  scale = 1,
  className = '',
  onPhotoChange,
  renderOnly = 'both',
}) => {
  const { updateCard } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (onPhotoChange) {
          onPhotoChange(result);
        }
        if (card.id) {
          updateCard(card.id, { photoUrl: result });
        }
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPhotoChange) {
      onPhotoChange('');
    }
    if (card.id) {
      updateCard(card.id, { photoUrl: '' });
    }
  };
  const cardWidthStyle = `${config.cardWidthMm}mm`;
  const cardHeightStyle = `${config.cardHeightMm}mm`;

  const isEspecial = card.category === 'PLANO_ESPECIAL' || card.planType === 'ESPECIAL';
  const isFamiliar = (card.planType === 'FAMILIAR' || card.category === 'PLANO_FAMILIAR') && !isEspecial;
  const isIndividual = !isFamiliar && !isEspecial;

  return (
    <div
      className={`relative inline-flex transition-transform origin-top select-none print:shadow-none ${
        config.foldOrientation === 'horizontal' ? 'flex-row items-stretch' : 'flex-col items-center'
      } ${className}`}
      style={{
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center',
      }}
    >
      {/* ================= FRENTE DA CARTEIRINHA ================= */}
      {renderOnly !== 'back' && (
        <div
          id={`card-front-${card.id}`}
          className="relative bg-white text-slate-900 overflow-hidden box-border p-3.5 flex flex-col justify-between shadow-xs print:shadow-none"
          style={{
            width: cardWidthStyle,
            height: cardHeightStyle,
            minWidth: cardWidthStyle,
            minHeight: cardHeightStyle,
            border: config.showBorder
              ? `${config.borderWidth}px solid ${config.borderColor}`
              : '1px solid #cbd5e1',
          backgroundColor: config.cardBackground,
          fontFamily:
            config.fontFamily === 'Courier'
              ? "'Courier Prime', monospace"
              : config.fontFamily === 'Serif'
              ? "'Playfair Display', serif"
              : "'Inter', sans-serif",
        }}
      >
        {/* CABEÇALHO: Brasão à esquerda + Textos centralizados */}
        <div className="flex items-center gap-2 border-b border-slate-300 pb-1.5">
          {config.showCoatOfArms && (
            <div className="shrink-0 flex items-center justify-center">
              {config.customCoatOfArmsUrl ? (
                <img
                  src={config.customCoatOfArmsUrl}
                  alt="Brasão Prefeitura de Pouso Alegre"
                  style={{
                    width: `${config.coatOfArmsSize && config.coatOfArmsSize > 50 ? config.coatOfArmsSize : 62}px`,
                    height: `${config.coatOfArmsSize && config.coatOfArmsSize > 50 ? config.coatOfArmsSize : 62}px`,
                    objectFit: 'contain',
                  }}
                  className="rounded-xs drop-shadow-2xs"
                />
              ) : (
                <BrasaoPousoAlegre size={config.coatOfArmsSize && config.coatOfArmsSize > 50 ? config.coatOfArmsSize : 62} />
              )}
            </div>
          )}

          <div className="flex-1 text-center leading-tight">
            <h1 className="text-[10.5px] sm:text-[11.5px] font-bold tracking-tight uppercase text-slate-900">
              {config.customHeaderTitle || 'Prefeitura Municipal de Pouso Alegre-MG'}
            </h1>
            <h2 className="text-[9px] sm:text-[10px] font-semibold text-slate-700 mt-0.5 tracking-tight">
              {config.customHeaderSubtitle || 'Praça de Esportes Pref. Alvarim Vieira Rios'}
            </h2>
            <div className="text-[7.5px] font-bold text-blue-900 tracking-wider uppercase mt-0.5">
              Carteira de Acesso às Piscinas
            </div>
          </div>
        </div>

        {/* CORPO CENTRAL: Dados à esquerda + Área delimitada para Foto 3x4 Física à direita */}
        <div className="flex items-start justify-between gap-2.5 my-auto pt-1.5 pb-1">
          {/* Dados Pessoais e Plano */}
          <div className="flex-1 space-y-1.5 text-[10.5px] leading-snug">
            {/* Linha 1: Número */}
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-slate-900 shrink-0">Número:</span>
              <span className="font-bold tracking-wider font-mono text-[11px] text-blue-900 bg-blue-50/70 px-1 py-0.5 rounded border border-blue-200/80">
                {card.controlNumber}
              </span>
              {isEspecial && (
                <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 rounded uppercase font-bold border border-emerald-300">
                  Isento
                </span>
              )}
            </div>

            {/* Linha 2: Nome (quebra em várias linhas se for grande, empurrando os campos abaixo) */}
            <div className="flex items-start gap-1.5 leading-snug">
              <span className="font-bold text-slate-900 shrink-0 mt-0.5">Nome:</span>
              <span className="font-semibold text-slate-900 uppercase break-words whitespace-normal leading-tight flex-1 text-[10px] sm:text-[10.5px]">
                {card.name}
              </span>
            </div>

            {/* Linha 3: Data de Nascimento */}
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-slate-900 shrink-0">Data de Nascimento:</span>
              <span className="font-medium tracking-wide">
                {card.birthDate || '    /    /        '}
              </span>
            </div>

            {/* Linha 4: Checkboxes de Plano (Familiar / Individual) */}
            <div className="flex items-center gap-3 pt-0.5 flex-wrap">
              {/* Plano Familiar */}
              <label className="inline-flex items-center gap-1 cursor-default">
                <span
                  className={`w-3.5 h-3.5 border border-slate-700 rounded-xs flex items-center justify-center font-bold text-[10px] leading-none ${
                    isFamiliar ? 'bg-slate-900 text-white' : 'bg-white text-transparent'
                  }`}
                >
                  {isFamiliar ? 'X' : ''}
                </span>
                <span className="font-semibold text-[9px]">P. Familiar</span>
              </label>

              {/* Plano Individual */}
              <label className="inline-flex items-center gap-1 cursor-default">
                <span
                  className={`w-3.5 h-3.5 border border-slate-700 rounded-xs flex items-center justify-center font-bold text-[10px] leading-none ${
                    isIndividual ? 'bg-slate-900 text-white' : 'bg-white text-transparent'
                  }`}
                >
                  {isIndividual ? 'X' : ''}
                </span>
                <span className="font-semibold text-[9px]">P. Individual</span>
              </label>
            </div>
          </div>

          {/* Área delimitada para Foto 3x4 (Clique para buscar imagem do computador) */}
          {config.showPhotoBox && (
            <div className="shrink-0 flex flex-col items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <div
                onClick={handlePhotoClick}
                className={`relative w-[24mm] h-[30mm] bg-slate-50/90 flex flex-col items-center justify-center text-center overflow-hidden cursor-pointer group transition-all hover:ring-2 hover:ring-blue-500 hover:ring-offset-1 select-none ${
                  config.photoBorderDashed
                    ? 'border-2 border-dashed border-slate-400'
                    : 'border border-slate-700'
                }`}
                title="Clique aqui para buscar a Foto 3x4 do seu computador"
              >
                {card.photoUrl ? (
                  <>
                    <img
                      src={card.photoUrl}
                      alt="Foto 3x4"
                      className="w-full h-full object-cover select-none"
                    />
                    {/* Overlay interativo apenas na tela (oculto na impressão) */}
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity p-1 print:hidden">
                      <Camera className="w-3.5 h-3.5 mb-0.5 text-blue-200" />
                      <span className="text-[7.5px] font-bold leading-none text-center">Trocar Foto</span>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="mt-1 text-[6.5px] bg-red-600 hover:bg-red-700 text-white px-1.5 py-0.5 rounded leading-none flex items-center gap-0.5 font-bold shadow-xs cursor-pointer"
                        title="Remover Foto"
                      >
                        <Trash2 className="w-2 h-2" /> Remover
                      </button>
                    </div>
                  </>
                ) : (
                  /* Sem foto carregada: Exibe guia padrão com convite de clique */
                  <div className="flex flex-col items-center justify-center text-slate-400 p-1 w-full h-full group-hover:bg-blue-50/70 transition-colors">
                    <div className="w-5 h-5 rounded-full border border-dashed border-slate-300 group-hover:border-blue-500 group-hover:bg-blue-100 flex items-center justify-center mb-1 transition-colors">
                      <Camera className="w-2.5 h-2.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <span className="text-[7.5px] font-bold tracking-tighter uppercase text-slate-600 group-hover:text-blue-700 leading-tight">
                      FOTO 3x4
                    </span>
                    <span className="text-[6.5px] font-medium text-slate-400 group-hover:text-blue-600 leading-tight">
                      (Clique p/ Inserir)
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RODAPÉ: Linha de Assinatura do Diretor */}
        <div className="pt-2 border-t border-slate-200 mt-auto flex items-end justify-start">
          <div className="w-[45%] text-center">
            <div className="border-b border-slate-800 w-full mb-0.5" />
            <span className="text-[8.5px] font-semibold text-slate-800 tracking-wide uppercase">
              {config.directorLabel || 'Diretor'}
            </span>
          </div>

          <div className="ml-auto text-right text-[7px] text-slate-600 font-mono font-bold leading-tight flex flex-col items-end">
            <div>
              {card.category === 'PREFEITURA' && 'CONVÊNIO PMPA'}
              {card.category === 'BOMBEIROS' && 'CONVÊNIO CBMMG'}
              {card.category === 'PLANO_INDIVIDUAL' && 'PLANO INDIVIDUAL'}
              {card.category === 'PLANO_FAMILIAR' && (card.isTitular ? 'PLANO FAMILIAR (TITULAR)' : 'PLANO FAMILIAR (DEPENDENTE)')}
              {card.category === 'PLANO_ESPECIAL' && 'PLANO ESPECIAL (ISENTO)'}
            </div>
            {card.physicalArchiveLocation && (
              <div className="text-[7px] text-slate-600 font-mono font-bold leading-tight">
                {card.physicalArchiveLocation}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* ================= LINHA GUIA DE DOBRA / CORTE ================= */}
      {renderOnly === 'both' && showFoldGuideline && config.showFoldGuideline && (
        <div
          className={`flex items-center justify-center select-none ${
            config.foldOrientation === 'horizontal'
              ? 'w-[4mm] flex-col py-1'
              : 'h-[4mm] flex-row px-1'
          }`}
        >
          <div
            className={`flex items-center justify-center text-slate-400 ${
              config.foldOrientation === 'horizontal'
                ? 'border-l-2 border-dashed border-slate-400 h-full'
                : 'border-t-2 border-dashed border-slate-400 w-full'
            }`}
          >
            <div className="bg-slate-100 text-slate-500 text-[8px] font-mono px-1 py-0.5 rounded flex items-center gap-0.5 whitespace-nowrap shadow-xs">
              <Scissors className="w-2.5 h-2.5" />
              <span>Dobra</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= PARTE DE TRÁS DA CARTEIRINHA (VERSO) ================= */}
      {/* 
        Atenção: Todos os campos dos 12 meses ficam 100% em branco.
        Apenas as colunas e títulos são mantidos para preenchimento/carimbo manual.
      */}
      {renderOnly !== 'front' && (
      <div
        id={`card-back-${card.id}`}
        className={`relative bg-white text-slate-900 overflow-hidden box-border pt-0.5 px-1.5 pb-1 flex flex-col justify-between shadow-xs print:shadow-none ${
          config.rotateVerso180 ? 'rotate-180' : ''
        }`}
        style={{
          width: cardWidthStyle,
          height: cardHeightStyle,
          minWidth: cardWidthStyle,
          minHeight: cardHeightStyle,
          border: config.showBorder
            ? `${config.borderWidth}px solid ${config.borderColor}`
            : '1px solid #cbd5e1',
          backgroundColor: config.cardBackground,
          fontFamily:
            config.fontFamily === 'Courier'
              ? "'Courier Prime', monospace"
              : config.fontFamily === 'Serif'
              ? "'Playfair Display', serif"
              : "'Inter', sans-serif",
        }}
      >
        {/* DOIS QUADROS LADO A LADO - Estendidos para o topo da carteirinha */}
        <div className="grid grid-cols-2 gap-1.5 flex-1 min-h-0">
          {/* Quadro 1 (Ano 1) */}
          <div className="border border-slate-900 rounded-xs flex flex-col overflow-hidden h-full">
            {/* Primeira linha com Ano 20____ */}
            <div className="bg-slate-100 border-b border-slate-900 py-0.5 text-center font-bold text-[9px] uppercase tracking-wider shrink-0">
              Ano {card.year1 || '20____'}
            </div>

            {/* Cabeçalho das 3 colunas */}
            <div className="grid grid-cols-12 border-b border-slate-900 text-[7px] font-bold text-center bg-slate-50 py-0.5 shrink-0">
              <div className="col-span-4 border-r border-slate-900">Pgto Data</div>
              <div className="col-span-3 border-r border-slate-900 text-[6.5px]">Mês</div>
              <div className="col-span-5">Assinatura</div>
            </div>

            {/* Linhas dos 12 meses - Altura rigorosamente idêntica para todos os meses (incluindo JAN) */}
            <div className="flex-1 grid grid-rows-12 divide-y divide-slate-300 min-h-0">
              {MONTHS_LIST.map((month, idx) => (
                <div key={idx} className="grid grid-cols-12 text-[7.5px] items-center h-full min-h-0 leading-none">
                  <div className="col-span-4 border-r border-slate-300 text-center font-mono text-[6.5px] truncate px-0.5 h-full flex items-center justify-center">
                    {/* Em branco para preenchimento manual */}
                  </div>
                  <div className="col-span-3 border-r border-slate-300 text-center font-bold text-[7px] bg-slate-50/80 text-slate-800 h-full flex items-center justify-center">
                    {month}
                  </div>
                  <div className="col-span-5 text-center font-mono text-[6.5px] truncate px-0.5 h-full flex items-center justify-center">
                    {/* Em branco para assinatura/carimbo manual */}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quadro 2 (Ano 2) */}
          <div className="border border-slate-900 rounded-xs flex flex-col overflow-hidden h-full">
            {/* Primeira linha com Ano 20____ */}
            <div className="bg-slate-100 border-b border-slate-900 py-0.5 text-center font-bold text-[9px] uppercase tracking-wider shrink-0">
              Ano {card.year2 || '20____'}
            </div>

            {/* Cabeçalho das 3 colunas */}
            <div className="grid grid-cols-12 border-b border-slate-900 text-[7px] font-bold text-center bg-slate-50 py-0.5 shrink-0">
              <div className="col-span-4 border-r border-slate-900">Pgto Data</div>
              <div className="col-span-3 border-r border-slate-900 text-[6.5px]">Mês</div>
              <div className="col-span-5">Assinatura</div>
            </div>

            {/* Linhas dos 12 meses - Altura rigorosamente idêntica para todos os meses (incluindo JAN) */}
            <div className="flex-1 grid grid-rows-12 divide-y divide-slate-300 min-h-0">
              {MONTHS_LIST.map((month, idx) => (
                <div key={idx} className="grid grid-cols-12 text-[7.5px] items-center h-full min-h-0 leading-none">
                  <div className="col-span-4 border-r border-slate-300 text-center font-mono text-[6.5px] truncate px-0.5 h-full flex items-center justify-center">
                    {/* Em branco para preenchimento manual */}
                  </div>
                  <div className="col-span-3 border-r border-slate-300 text-center font-bold text-[7px] bg-slate-50/80 text-slate-800 h-full flex items-center justify-center">
                    {month}
                  </div>
                  <div className="col-span-5 text-center font-mono text-[6.5px] truncate px-0.5 h-full flex items-center justify-center">
                    {/* Em branco para assinatura/carimbo manual */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rodapé do Verso: NÃO PLASTIFICAR */}
        <div className="mt-0.5 border-t border-slate-300 pt-0.5 flex items-center justify-center w-full shrink-0">
          <span className="text-[10px] font-black text-center text-slate-950 tracking-wide uppercase leading-none whitespace-nowrap">
            NÃO PLASTIFICAR
          </span>
        </div>
      </div>
      )}
    </div>
  );
};
