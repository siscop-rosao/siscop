import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toPng, toJpeg } from 'html-to-image';
import { CardData, CardLayoutConfig } from '../../types';
import { PrintableCard } from './PrintableCard';
import { executePrint } from '../../utils/printHelper';
import {
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  Layers,
  FileText,
  Check,
  Download,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Image as ImageIcon,
  HelpCircle,
} from 'lucide-react';

interface PrintSheetViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCard: CardData | null;
  familyMembers: CardData[];
  allCards: CardData[];
  layoutConfig: CardLayoutConfig;
}

type PrintMode = 'FAMILY' | 'SINGLE_4X' | 'SINGLE_1X' | 'ALL_ACTIVE';

export const PrintSheetViewerModal: React.FC<PrintSheetViewerModalProps> = ({
  isOpen,
  onClose,
  activeCard,
  familyMembers,
  allCards,
  layoutConfig,
}) => {
  // Dimensões ampliadas da carteirinha na folha de impressão:
  // 100mm x 70mm por face (desdobrada: 204mm x 70mm).
  // Aproveitamento máximo da folha com margem de segurança de 3mm no topo/base na folha A4 (210mm)
  // e 3mm de espaçamento livre entre as carteirinhas, sem risco de cortes indesejados nas bordas de impressão.
  const targetWidthMm = Math.min(100, Math.max(70, layoutConfig.cardWidthMm || 100));
  const targetHeightMm = Math.min(70, Math.max(45, layoutConfig.cardHeightMm || 70));

  const printCardConfig: CardLayoutConfig = {
    ...layoutConfig,
    cardWidthMm: targetWidthMm,
    cardHeightMm: targetHeightMm,
    foldOrientation: 'horizontal',
  };

  const cardTotalWidthMm = printCardConfig.cardWidthMm * 2 + 4; // frente (100mm) + guia de dobra (4mm) + verso (100mm) = 204mm
  const cardHeightMm = printCardConfig.cardHeightMm; // 70mm

  const [printMode, setPrintMode] = useState<PrintMode>(
    familyMembers.length > 1 ? 'FAMILY' : 'SINGLE_4X'
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState<{
    type: 'LOADING' | 'SUCCESS' | 'ERROR' | 'INFO';
    message: string;
  } | null>(null);

  const [printScope, setPrintScope] = useState<'CURRENT' | 'ALL'>('CURRENT');
  const sheetRef = useRef<HTMLDivElement>(null);

  // Build the list of cards to lay out based on printMode
  let cardsList: (CardData | null)[] = [];

  if (printMode === 'SINGLE_1X') {
    cardsList = activeCard ? [activeCard] : (allCards.length > 0 ? [allCards[0]] : []);
  } else if (printMode === 'SINGLE_4X') {
    // 4 copies of the current card to fill the sheet
    const target = activeCard || (allCards.length > 0 ? allCards[0] : null);
    cardsList = target ? [target, target, target, target] : [];
  } else if (printMode === 'FAMILY') {
    // Family members
    cardsList = familyMembers.length > 0 ? familyMembers : (activeCard ? [activeCard] : []);
  } else if (printMode === 'ALL_ACTIVE') {
    // All cards in system
    cardsList = allCards;
  }

  // Group into pages of 4 cards per sheet
  const CARDS_PER_SHEET = 4;
  const totalSheets = Math.max(1, Math.ceil(cardsList.length / CARDS_PER_SHEET));
  const safeCurrentPage = Math.min(currentPage, totalSheets - 1);

  // Cards on current sheet
  const currentSheetCards = cardsList.slice(
    safeCurrentPage * CARDS_PER_SHEET,
    (safeCurrentPage + 1) * CARDS_PER_SHEET
  );

  // Pad to 4 slots
  const slots: (CardData | null)[] = [
    currentSheetCards[0] || null,
    currentSheetCards[1] || null,
    currentSheetCards[2] || null,
    currentSheetCards[3] || null,
  ];

  // Robust rasterizer for sheet DOM to image data URL
  const captureSheetImage = async (element: HTMLElement): Promise<string> => {
    // 1. Primary engine: html-to-image toPng (modern browser engine, respects oklch, transforms, and SVG)
    try {
      const dataUrl = await toPng(element, {
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        skipFonts: true,
        cacheBust: true,
      });
      if (dataUrl && dataUrl.startsWith('data:image/')) {
        return dataUrl;
      }
    } catch (err) {
      console.warn('html-to-image toPng falhou, tentando toJpeg:', err);
    }

    // 2. Secondary engine: html-to-image toJpeg
    try {
      const dataUrl = await toJpeg(element, {
        quality: 0.96,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        skipFonts: true,
      });
      if (dataUrl && dataUrl.startsWith('data:image/')) {
        return dataUrl;
      }
    } catch (err2) {
      console.warn('html-to-image toJpeg falhou, tentando html2canvas:', err2);
    }

    // 3. Fallback engine: html2canvas
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      return canvas.toDataURL('image/jpeg', 0.95);
    } catch (err3) {
      console.error('html2canvas também falhou:', err3);
    }

    throw new Error('Falha ao rasterizar a folha de carteirinhas.');
  };

  // Safe file downloader using Blob link
  const saveBlobFile = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    link.style.position = 'fixed';
    link.style.left = '-9999px';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (e) {
        // ignore
      }
    }, 2000);
  };

  const handlePrint = (printAll: boolean) => {
    setPrintScope(printAll ? 'ALL' : 'CURRENT');
    setFeedbackStatus({
      type: 'INFO',
      message: 'Comando de impressão enviado. Se o diálogo do navegador não abrir (bloqueio do ambiente incorporado), utilize o botão "Baixar Folha em PDF" para salvar e imprimir o arquivo com 100% de nitidez.',
    });

    executePrint({
      orientation: 'landscape',
      bodyClass: 'printing-carteirinhas-sheet',
      pageMargin: '0',
    });
  };

  // Keyboard shortcut Ctrl+P / Cmd+P to trigger clean print of the sheet
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrint(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, safeCurrentPage]);

  if (!isOpen) return null;

  const handleDownloadPdf = async (downloadAll = false) => {
    setIsDownloadingPdf(true);
    setFeedbackStatus({
      type: 'LOADING',
      message: downloadAll
        ? `Gerando PDF completo com ${totalSheets} folha(s) A4... Por favor, aguarde alguns instantes.`
        : `Gerando arquivo PDF da Folha A4 (Página ${safeCurrentPage + 1})...`,
    });

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      if (!downloadAll) {
        if (!sheetRef.current) throw new Error('Elemento da folha não encontrado no DOM.');
        const imgData = await captureSheetImage(sheetRef.current);
        pdf.addImage(imgData, 'PNG', 0, 0, 297, 210, undefined, 'FAST');
        const fileName = `SISCOP-Folha-A4-Carteirinhas-Pagina-${safeCurrentPage + 1}.pdf`;

        // Direct jsPDF save
        try {
          pdf.save(fileName);
        } catch (e) {
          console.warn('pdf.save direto falhou, usando fallback por blob:', e);
        }

        // Guaranteed blob link download
        const blob = pdf.output('blob');
        saveBlobFile(blob, fileName);

        setFeedbackStatus({
          type: 'SUCCESS',
          message: `Folha em PDF baixada com sucesso! Arquivo: ${fileName}. Pronto para abrir e imprimir.`,
        });
      } else {
        const originalPage = currentPage;
        for (let p = 0; p < totalSheets; p++) {
          setCurrentPage(p);
          setFeedbackStatus({
            type: 'LOADING',
            message: `Processando folha ${p + 1} de ${totalSheets} para o PDF...`,
          });
          await new Promise((resolve) => setTimeout(resolve, 350));
          if (sheetRef.current) {
            if (p > 0) pdf.addPage('a4', 'landscape');
            const imgData = await captureSheetImage(sheetRef.current);
            pdf.addImage(imgData, 'PNG', 0, 0, 297, 210, undefined, 'FAST');
          }
        }
        setCurrentPage(originalPage);
        const fileName = `SISCOP-Folhas-A4-Carteirinhas-Todas-${totalSheets}-Folhas.pdf`;

        try {
          pdf.save(fileName);
        } catch (e) {
          console.warn('pdf.save direto falhou, usando fallback por blob:', e);
        }

        const blob = pdf.output('blob');
        saveBlobFile(blob, fileName);

        setFeedbackStatus({
          type: 'SUCCESS',
          message: `Arquivo PDF com todas as ${totalSheets} folhas baixado com sucesso!`,
        });
      }
    } catch (error) {
      console.error('Erro ao gerar arquivo PDF:', error);
      setFeedbackStatus({
        type: 'ERROR',
        message: 'Ocorreu um erro ao gerar o PDF. Você também pode utilizar o botão "Baixar Imagem PNG" para imprimir a folha.',
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadPng = async () => {
    if (!sheetRef.current) return;
    setIsDownloadingPng(true);
    setFeedbackStatus({
      type: 'LOADING',
      message: `Gerando imagem da folha A4 (Página ${safeCurrentPage + 1})...`,
    });

    try {
      const imgData = await captureSheetImage(sheetRef.current);
      const fileName = `SISCOP-Folha-A4-Carteirinhas-Pagina-${safeCurrentPage + 1}.png`;
      const link = document.createElement('a');
      link.href = imgData;
      link.download = fileName;
      link.target = '_blank';
      link.style.position = 'fixed';
      link.style.left = '-9999px';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try {
          document.body.removeChild(link);
        } catch (e) {
          // ignore
        }
      }, 1500);

      setFeedbackStatus({
        type: 'SUCCESS',
        message: `Imagem PNG da Folha A4 baixada com sucesso! Arquivo: ${fileName}. Pronto para abrir e imprimir.`,
      });
    } catch (err) {
      console.error('Erro ao baixar PNG:', err);
      setFeedbackStatus({
        type: 'ERROR',
        message: 'Falha ao gerar a imagem PNG da folha.',
      });
    } finally {
      setIsDownloadingPng(false);
    }
  };

  const pagesToPrintInRoot = printScope === 'ALL'
    ? Array.from({ length: totalSheets }, (_, i) => i)
    : [safeCurrentPage];

  return (
    <>
      {/* ================= MODAL DE VISUALIZAÇÃO EM TELA (OCULTO NA IMPRESSÃO) ================= */}
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col p-2 sm:p-4 overflow-hidden print:hidden">
        {/* ================= MODAL TOP BAR ================= */}
        <div className="bg-slate-900 text-white rounded-t-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-lg border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-600 rounded-lg text-white">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Visualizador de Impressão • Folha A4 Paisagem
                <span className="bg-blue-900/80 text-blue-200 text-xs px-2 py-0.5 rounded border border-blue-700/60 font-mono font-semibold">
                  4 Carteirinhas por Folha
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Disposição otimizada na folha A4 em modo Paisagem com guias de corte e dobras
              </p>
            </div>
          </div>

          {/* Download PDF, Download PNG, Print & Close actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* BOTÃO PRINCIPAL 1: BAIXAR FOLHA EM PDF */}
            <button
              onClick={() => handleDownloadPdf(false)}
              disabled={isDownloadingPdf || isDownloadingPng}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-60 cursor-pointer"
              title="Baixar a folha A4 atual em arquivo PDF de alta resolução pronto para impressão"
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-100" />
              ) : (
                <Download className="w-4 h-4 text-emerald-100" />
              )}
              <span>{isDownloadingPdf ? 'Gerando PDF...' : 'Baixar Folha em PDF'}</span>
            </button>

            {/* BOTÃO PRINCIPAL 2: BAIXAR IMAGEM (PNG) */}
            <button
              onClick={handleDownloadPng}
              disabled={isDownloadingPdf || isDownloadingPng}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md active:scale-95 disabled:opacity-60 cursor-pointer"
              title="Baixar a folha A4 em formato de imagem PNG de alta resolução para impressão rápida"
            >
              {isDownloadingPng ? (
                <Loader2 className="w-4 h-4 animate-spin text-teal-100" />
              ) : (
                <ImageIcon className="w-4 h-4 text-teal-100" />
              )}
              <span>{isDownloadingPng ? 'Gerando PNG...' : 'Baixar Imagem (PNG)'}</span>
            </button>

            {totalSheets > 1 && (
              <button
                onClick={() => handleDownloadPdf(true)}
                disabled={isDownloadingPdf || isDownloadingPng}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-800 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                title={`Baixar todas as ${totalSheets} folhas em um único arquivo PDF`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Todas ({totalSheets}) em PDF</span>
              </button>
            )}

            {/* Linha vertical divisória entre Download e Impressão Direta */}
            <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block" />

            {/* BOTÃO DE IMPRESSÃO DIRETA */}
            <button
              onClick={() => handlePrint(false)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors active:scale-95 cursor-pointer shadow-md"
              title="Acionar diálogo de impressão do navegador ou pressione Ctrl+P"
            >
              <Printer className="w-4 h-4 text-blue-100" />
              <span>Imprimir Esta Folha</span>
            </button>

            {totalSheets > 1 && (
              <button
                onClick={() => handlePrint(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                title={`Imprimir todas as ${totalSheets} folha(s) A4 Paisagem`}
              >
                <Printer className="w-4 h-4 text-slate-300" />
                <span>Imprimir Todas ({totalSheets})</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-1 cursor-pointer"
              title="Fechar visualizador"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FEEDBACK STATUS TOAST / BANNER */}
        {feedbackStatus && (
          <div
            className={`px-4 py-2 flex items-center justify-between text-xs transition-all border-b shrink-0 ${
              feedbackStatus.type === 'LOADING'
                ? 'bg-blue-950/95 text-blue-200 border-blue-800'
                : feedbackStatus.type === 'SUCCESS'
                ? 'bg-emerald-950/95 text-emerald-200 border-emerald-800'
                : feedbackStatus.type === 'ERROR'
                ? 'bg-rose-950/95 text-rose-200 border-rose-800'
                : 'bg-indigo-950/95 text-indigo-200 border-indigo-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackStatus.type === 'LOADING' && (
                <Loader2 className="w-4 h-4 animate-spin text-blue-400 shrink-0" />
              )}
              {feedbackStatus.type === 'SUCCESS' && (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              {feedbackStatus.type === 'ERROR' && (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              {feedbackStatus.type === 'INFO' && (
                <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0" />
              )}
              <span className="font-semibold">{feedbackStatus.message}</span>
            </div>
            <button
              onClick={() => setFeedbackStatus(null)}
              className="text-slate-400 hover:text-white ml-3 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Banner com orientação prática de impressão e download */}
        <div className="bg-slate-900/90 text-slate-300 px-4 py-1.5 flex items-center justify-between text-[11px] border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              <strong>Opções de Emissão:</strong> Clique em <strong>Baixar Folha em PDF</strong> para salvar o documento oficial pronto para imprimir em qualquer impressora, ou utilize o botão <strong>Imprimir Esta Folha</strong> (ou atalho <strong>Ctrl+P</strong>).
            </span>
          </div>
          <span className="font-mono text-slate-300 text-[10px] hidden sm:inline bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            A4 Paisagem: 297 x 210 mm • Carteirinhas {printCardConfig.cardWidthMm} x {printCardConfig.cardHeightMm} mm (Tamanho ampliado com margem de segurança)
          </span>
        </div>

      {/* ================= CONTROLS & PAGINATION BAR ================= */}
      <div className="bg-slate-800 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-700 shrink-0">
        {/* Print mode selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-slate-300 mr-1">Modo de Distribuição:</span>
          {familyMembers.length > 1 && (
            <button
              onClick={() => {
                setPrintMode('FAMILY');
                setCurrentPage(0);
              }}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                printMode === 'FAMILY'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Plano Familiar ({familyMembers.length} pessoas)
            </button>
          )}

          <button
            onClick={() => {
              setPrintMode('SINGLE_4X');
              setCurrentPage(0);
            }}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              printMode === 'SINGLE_4X'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Preencher Folha com Esta Carteirinha (4x)
          </button>

          <button
            onClick={() => {
              setPrintMode('SINGLE_1X');
              setCurrentPage(0);
            }}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              printMode === 'SINGLE_1X'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Apenas 1 Carteirinha
          </button>

          <button
            onClick={() => {
              setPrintMode('ALL_ACTIVE');
              setCurrentPage(0);
            }}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              printMode === 'ALL_ACTIVE'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Todas do Sistema ({allCards.length})
          </button>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-300 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-medium text-slate-200">Margem de Segurança Ativa</span>
          </div>

          <div className="h-4 w-px bg-slate-600" />

          <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
            <button
              disabled={safeCurrentPage === 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              className="p-1 disabled:opacity-30 hover:text-blue-400 transition-colors"
              title="Folha Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-mono font-bold px-2 text-blue-300">
              Folha {safeCurrentPage + 1} de {totalSheets}
            </span>

            <button
              disabled={safeCurrentPage >= totalSheets - 1}
              onClick={() => setCurrentPage((p) => Math.min(totalSheets - 1, p + 1))}
              className="p-1 disabled:opacity-30 hover:text-blue-400 transition-colors"
              title="Próxima Folha"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= A4 SHEET CANVAS VIEWER ================= */}
      <div className="flex-1 bg-slate-950 p-4 overflow-auto flex items-center justify-center rounded-b-xl">
        {/* A4 Landscape Virtual Sheet (297mm x 210mm proportional aspect ratio ~ 1.414) */}
        <div
          ref={sheetRef}
          id={`print-page-${safeCurrentPage}`}
          className="relative bg-white text-slate-900 shadow-2xl rounded-none flex flex-col justify-center p-0 box-border border-0 transition-all select-none overflow-hidden"
          style={{
            width: '960px',
            height: '678px', // Proporção exata da folha A4 em modo Paisagem
            minWidth: '960px',
            minHeight: '678px',
          }}
        >
          {/* 4 Colunas Verticais com corredor reduzido entre as carteirinhas e margem lateral protegida contra cortes de impressora */}
          <div className="flex-1 flex items-center justify-between px-4 overflow-visible h-full w-full">
            {slots.map((card, idx) => (
              <div
                key={idx}
                className="relative flex flex-col items-center justify-center border-0 bg-white overflow-visible h-full w-[23.5%] shrink-0"
              >
                {card ? (
                  <div className="w-full h-full flex items-center justify-center overflow-visible relative">
                    <div
                      style={{
                        transform: 'rotate(-90deg) scale(0.85522)',
                        transformOrigin: 'center center',
                        width: `${cardTotalWidthMm}mm`,
                        height: `${cardHeightMm}mm`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        position: 'relative',
                      }}
                    >
                      <PrintableCard
                        card={card}
                        config={printCardConfig}
                        showFoldGuideline={true}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-white" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

      {/* ================= CONTAINER DEDICADO DE IMPRESSÃO NATIVA (VISÍVEL SOMENTE NA IMPRESSÃO) ================= */}
      {createPortal(
        <div id="print-sheet-root" className="hidden print:block">
          {pagesToPrintInRoot.map((pgIdx) => {
            const pageCards = cardsList.slice(pgIdx * CARDS_PER_SHEET, (pgIdx + 1) * CARDS_PER_SHEET);
            const pageSlots = [
              pageCards[0] || null,
              pageCards[1] || null,
              pageCards[2] || null,
              pageCards[3] || null,
            ];

            return (
              <div key={pgIdx} className="a4-print-page">
                {/* 4 Colunas Verticais com Carteirinhas Reais: A4 Paisagem (297mm x 210mm) com corredor reduzido em 1.5mm e margem externa protegida contra cortes de impressora */}
                <div className="flex items-center justify-between h-[210mm] w-[297mm] px-[5mm] my-auto overflow-visible">
                  {pageSlots.map((card, slotIdx) => (
                    <div
                      key={slotIdx}
                      className="relative flex flex-col items-center justify-center border-0 bg-white overflow-visible h-full w-[70mm] shrink-0"
                    >
                      {card ? (
                        <div className="w-full h-full flex items-center justify-center overflow-visible relative">
                          <div
                            style={{
                              transform: 'rotate(-90deg)',
                              transformOrigin: 'center center',
                              width: `${cardTotalWidthMm}mm`,
                              height: `${cardHeightMm}mm`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              position: 'relative',
                            }}
                          >
                            <PrintableCard
                              card={card}
                              config={printCardConfig}
                              showFoldGuideline={true}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-white" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
};
