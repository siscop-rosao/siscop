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
  RotateCw,
  Scissors,
  ArrowLeftRight,
} from 'lucide-react';

interface PrintSheetViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCard: CardData | null;
  familyMembers: CardData[];
  allCards: CardData[];
  layoutConfig: CardLayoutConfig;
  initialMode?: PrintMode;
}

export type PrintMode = 'FAMILY' | 'SINGLE_4X' | 'SINGLE_1X' | 'ALL_ACTIVE' | 'BATCH_INDIVIDUAL';

export const PrintSheetViewerModal: React.FC<PrintSheetViewerModalProps> = ({
  isOpen,
  onClose,
  activeCard,
  familyMembers,
  allCards,
  layoutConfig,
  initialMode,
}) => {
  // Dimensões ampliadas da carteirinha na folha de impressão:
  // 100mm x 70mm por face (duas faces lado a lado: 204mm x 70mm).
  // Aproveitamento máximo da folha com margem de segurança de 3mm no topo/base na folha A4 (210mm)
  // e 3mm de espaçamento livre entre as carteirinhas, sem risco de cortes indesejados nas bordas de impressão.
  const targetWidthMm = Math.min(100, Math.max(70, layoutConfig.cardWidthMm || 100));
  // Altura calibrada para 68.5mm (ganho de 6mm na folha A4 com redução da margem sobre o brasão),
  // garantindo que a base da última carteirinha ("NÃO PLASTIFICAR") nunca seja cortada.
  const targetHeightMm = Math.min(68.5, Math.max(45, (layoutConfig.cardHeightMm || 70) <= 70 ? 68.5 : layoutConfig.cardHeightMm - 1.5));

  const printCardConfig: CardLayoutConfig = {
    ...layoutConfig,
    cardWidthMm: targetWidthMm,
    cardHeightMm: targetHeightMm,
    foldOrientation: 'horizontal',
  };

  const cardTotalWidthMm = printCardConfig.cardWidthMm * 2 + 4; // frente 1 (100mm) + guia de corte (4mm) + frente 2 (100mm) = 204mm
  const cardHeightMm = printCardConfig.cardHeightMm; // 68.5mm

  const [printMode, setPrintMode] = useState<PrintMode>(
    initialMode || (familyMembers.length > 1 ? 'FAMILY' : 'SINGLE_4X')
  );

  useEffect(() => {
    if (isOpen && initialMode) {
      setPrintMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Modo Frente e Verso (Melhorias 02 e 03):
  // FRONT: Exibe e imprime as faces principais (com dados e foto), duas por coluna.
  // BACK: Exibe e imprime os versos com dados de pagamento (Ano 2026, 2027, 2028 com Mês e Assinatura).
  const [sheetSide, setSheetSide] = useState<'FRONT' | 'BACK'>('FRONT');
  const [duplexFlipMode, setDuplexFlipMode] = useState<'HORIZONTAL' | 'DIRECT'>('HORIZONTAL');

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
    // 1 única carteirinha na folha: ao lado dela, o espaço fica vazio
    cardsList = activeCard ? [activeCard] : (allCards.length > 0 ? [allCards[0]] : []);
  } else if (printMode === 'SINGLE_4X') {
    // Preencher a folha com a carteirinha atual (8 faces principais: 4 colunas x 2 faces)
    const target = activeCard || (allCards.length > 0 ? allCards[0] : null);
    cardsList = target ? [target, target, target, target, target, target, target, target] : [];
  } else if (printMode === 'FAMILY') {
    // Membros do Plano Familiar em sequência (João, Maria, Carlos, José, Alice...)
    cardsList = familyMembers.length > 0 ? familyMembers : (activeCard ? [activeCard] : []);
  } else if (printMode === 'BATCH_INDIVIDUAL') {
    // Carteirinhas do Plano Individual selecionadas em lote
    const batchCards = allCards.filter((c) => c.batchPrintSelected);
    cardsList = batchCards.length > 0 ? batchCards : (activeCard ? [activeCard] : []);
  } else if (printMode === 'ALL_ACTIVE') {
    // Todas as carteirinhas ativas do sistema
    cardsList = allCards;
  }

  // Group into pages of 8 cards per sheet (4 colunas verticais x 2 carteirinhas por coluna)
  const CARDS_PER_SHEET = 8;
  const totalSheets = Math.max(1, Math.ceil(cardsList.length / CARDS_PER_SHEET));
  const safeCurrentPage = Math.min(currentPage, totalSheets - 1);

  interface ColumnSlot {
    leftCard: CardData | null;
    rightCard: CardData | null;
  }

  // Função para retornar as 4 colunas da folha (Frente ou Verso com alinhamento duplex)
  const getPageColumns = (pageIndex: number, side: 'FRONT' | 'BACK'): ColumnSlot[] => {
    const raw = cardsList.slice(pageIndex * CARDS_PER_SHEET, (pageIndex + 1) * CARDS_PER_SHEET);
    const pCards: (CardData | null)[] = [
      raw[0] || null,
      raw[1] || null,
      raw[2] || null,
      raw[3] || null,
      raw[4] || null,
      raw[5] || null,
      raw[6] || null,
      raw[7] || null,
    ];

    if (side === 'FRONT') {
      return [
        { leftCard: pCards[0], rightCard: pCards[1] },
        { leftCard: pCards[2], rightCard: pCards[3] },
        { leftCard: pCards[4], rightCard: pCards[5] },
        { leftCard: pCards[6], rightCard: pCards[7] },
      ];
    } else {
      // BACK side (Verso)
      if (duplexFlipMode === 'HORIZONTAL') {
        // Giro Horizontal (padrão de impressora ao virar a folha de lado como folha de livro):
        // Coluna 0 na frente corresponde à Coluna 3 no verso (com left/right invertidos);
        // Coluna 1 na frente corresponde à Coluna 2 no verso (com left/right invertidos).
        return [
          { leftCard: pCards[7], rightCard: pCards[6] },
          { leftCard: pCards[5], rightCard: pCards[4] },
          { leftCard: pCards[3], rightCard: pCards[2] },
          { leftCard: pCards[1], rightCard: pCards[0] },
        ];
      } else {
        // Alinhamento direto
        return [
          { leftCard: pCards[0], rightCard: pCards[1] },
          { leftCard: pCards[2], rightCard: pCards[3] },
          { leftCard: pCards[4], rightCard: pCards[5] },
          { leftCard: pCards[6], rightCard: pCards[7] },
        ];
      }
    }
  };

  const currentColumns = getPageColumns(safeCurrentPage, sheetSide);

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
    const sideLabel = sheetSide === 'FRONT' ? 'Frente' : 'Verso';
    setFeedbackStatus({
      type: 'LOADING',
      message: downloadAll
        ? `Gerando PDF completo com ${totalSheets} folha(s) A4 (${sideLabel})... Por favor, aguarde alguns instantes.`
        : `Gerando arquivo PDF da Folha A4 (${sideLabel} - Página ${safeCurrentPage + 1})...`,
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
        const fileName = `SISCOP-Folha-A4-Carteirinhas-${sideLabel}-Pagina-${safeCurrentPage + 1}.pdf`;

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
          message: `Folha em PDF (${sideLabel}) baixada com sucesso! Arquivo: ${fileName}. Pronto para abrir e imprimir.`,
        });
      } else {
        const originalPage = currentPage;
        for (let p = 0; p < totalSheets; p++) {
          setCurrentPage(p);
          setFeedbackStatus({
            type: 'LOADING',
            message: `Processando folha ${p + 1} de ${totalSheets} (${sideLabel}) para o PDF...`,
          });
          await new Promise((resolve) => setTimeout(resolve, 350));
          if (sheetRef.current) {
            if (p > 0) pdf.addPage('a4', 'landscape');
            const imgData = await captureSheetImage(sheetRef.current);
            pdf.addImage(imgData, 'PNG', 0, 0, 297, 210, undefined, 'FAST');
          }
        }
        setCurrentPage(originalPage);
        const fileName = `SISCOP-Folhas-A4-Carteirinhas-${sideLabel}-Todas-${totalSheets}-Folhas.pdf`;

        try {
          pdf.save(fileName);
        } catch (e) {
          console.warn('pdf.save direto falhou, usando fallback por blob:', e);
        }

        const blob = pdf.output('blob');
        saveBlobFile(blob, fileName);

        setFeedbackStatus({
          type: 'SUCCESS',
          message: `Arquivo PDF com todas as ${totalSheets} folhas (${sideLabel}) baixado com sucesso!`,
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

  const handleDownloadDuplexPdf = async () => {
    setIsDownloadingPdf(true);
    const originalSide = sheetSide;
    const originalPage = currentPage;
    setFeedbackStatus({
      type: 'LOADING',
      message: 'Gerando PDF Duplex Completo (Página 1: Frente | Página 2: Verso)...',
    });

    try {
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      // 1. Captura a Frente da folha atual
      setSheetSide('FRONT');
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (sheetRef.current) {
        const frontImg = await captureSheetImage(sheetRef.current);
        pdf.addImage(frontImg, 'PNG', 0, 0, 297, 210, undefined, 'FAST');
      }

      // 2. Captura o Verso da folha atual
      setSheetSide('BACK');
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (sheetRef.current) {
        pdf.addPage('a4', 'landscape');
        const backImg = await captureSheetImage(sheetRef.current);
        pdf.addImage(backImg, 'PNG', 0, 0, 297, 210, undefined, 'FAST');
      }

      // Restaura o lado original
      setSheetSide(originalSide);
      setCurrentPage(originalPage);

      const fileName = `SISCOP-Carteirinhas-Duplex-Frente-e-Verso-Folha-${safeCurrentPage + 1}.pdf`;
      const blob = pdf.output('blob');
      saveBlobFile(blob, fileName);

      setFeedbackStatus({
        type: 'SUCCESS',
        message: `PDF Duplex baixado com sucesso! Arquivo: ${fileName} (Contém Frente e Verso em páginas sequenciais).`,
      });
    } catch (err) {
      console.error('Erro ao gerar PDF Duplex:', err);
      setFeedbackStatus({
        type: 'ERROR',
        message: 'Falha ao gerar o PDF Duplex Frente e Verso.',
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadPng = async () => {
    if (!sheetRef.current) return;
    setIsDownloadingPng(true);
    const sideLabel = sheetSide === 'FRONT' ? 'Frente' : 'Verso';
    setFeedbackStatus({
      type: 'LOADING',
      message: `Gerando imagem da folha A4 (${sideLabel} - Página ${safeCurrentPage + 1})...`,
    });

    try {
      const imgData = await captureSheetImage(sheetRef.current);
      const fileName = `SISCOP-Folha-A4-Carteirinhas-${sideLabel}-Pagina-${safeCurrentPage + 1}.png`;
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
        message: `Imagem PNG da Folha A4 (${sideLabel}) baixada com sucesso! Arquivo: ${fileName}. Pronto para abrir e imprimir.`,
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
                  Até 8 Faces Principais por Folha • Frente e Verso (Duplex)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Disposição em duas faces por coluna (Frente na 1ª folha, Verso na 2ª folha) com guias de corte precisas
              </p>
            </div>
          </div>

          {/* Download PDF, Download PNG, Print & Close actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* BOTÃO PRINCIPAL 1: BAIXAR FOLHA EM PDF */}
            <button
              onClick={() => handleDownloadPdf(false)}
              disabled={isDownloadingPdf || isDownloadingPng}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-60 cursor-pointer"
              title={`Baixar a folha A4 atual (${sheetSide === 'FRONT' ? 'Frente' : 'Verso'}) em arquivo PDF`}
            >
              {isDownloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-100" />
              ) : (
                <Download className="w-4 h-4 text-emerald-100" />
              )}
              <span>{isDownloadingPdf ? 'Gerando PDF...' : `Baixar PDF (${sheetSide === 'FRONT' ? 'Frente' : 'Verso'})`}</span>
            </button>

            {/* BOTÃO ESPECIAL: BAIXAR PDF DUPLEX COMPLETO (FRENTE + VERSO) */}
            <button
              onClick={handleDownloadDuplexPdf}
              disabled={isDownloadingPdf || isDownloadingPng}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-60 cursor-pointer"
              title="Baixar um único arquivo PDF contendo a página da Frente seguida pela página do Verso"
            >
              <Layers className="w-4 h-4 text-indigo-100" />
              <span>Baixar Duplex (Frente + Verso)</span>
            </button>

            {/* BOTÃO PRINCIPAL 2: BAIXAR IMAGEM (PNG) */}
            <button
              onClick={handleDownloadPng}
              disabled={isDownloadingPdf || isDownloadingPng}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md active:scale-95 disabled:opacity-60 cursor-pointer"
              title={`Baixar a folha A4 (${sheetSide === 'FRONT' ? 'Frente' : 'Verso'}) em imagem PNG`}
            >
              {isDownloadingPng ? (
                <Loader2 className="w-4 h-4 animate-spin text-teal-100" />
              ) : (
                <ImageIcon className="w-4 h-4 text-teal-100" />
              )}
              <span>{isDownloadingPng ? 'Gerando PNG...' : `Baixar PNG (${sheetSide === 'FRONT' ? 'Frente' : 'Verso'})`}</span>
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
              <span>Imprimir Esta Folha ({sheetSide === 'FRONT' ? 'Frente' : 'Verso'})</span>
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

        {/* Banner com orientação prática da etapa Frente ou Verso */}
        <div className="bg-slate-900/90 text-slate-300 px-4 py-2 flex flex-wrap items-center justify-between text-[11px] border-b border-slate-800 shrink-0 gap-2">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${sheetSide === 'FRONT' ? 'bg-blue-400' : 'bg-emerald-400'} animate-pulse shrink-0`} />
            {sheetSide === 'FRONT' ? (
              <span>
                <strong className="text-white">1ª Etapa • FRENTE (Faces Principais):</strong> A folha exibe as faces principais das carteirinhas (dados e foto), agrupadas duas a duas em cada coluna (até 8 por folha). Imprima esta folha primeiro.
              </span>
            ) : (
              <span>
                <strong className="text-emerald-300">2ª Etapa • VERSO (3 Anos de Pagamento):</strong> A folha exibe os dados de pagamento (Ano 2026, 2027, 2028 com Mês e Assinatura) perfeitamente alinhados para sobreposição. Insira a folha já impressa na impressora para estampar os versos.
              </span>
            )}
          </div>
          <span className="font-mono text-slate-300 text-[10px] hidden sm:inline bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            A4 Paisagem: 297 x 210 mm • Cada Face: {printCardConfig.cardWidthMm} x {printCardConfig.cardHeightMm} mm
          </span>
        </div>

      {/* ================= CONTROLS & PAGINATION BAR ================= */}
      <div className="bg-slate-800 text-white px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-700 shrink-0">
        {/* Print mode selector e Seletor Frente/Verso (Melhoria 03) */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* SELETOR FRENTE / VERSO (MELHORIA 03) */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-700 shrink-0">
            <button
              type="button"
              onClick={() => setSheetSide('FRONT')}
              className={`px-3 py-1.5 rounded-md font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                sheetSide === 'FRONT'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="1ª Etapa: Imprimir as Faces Principais das carteirinhas (dados e foto)"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>1ª Etapa: Frente</span>
            </button>

            <button
              type="button"
              onClick={() => setSheetSide('BACK')}
              className={`px-3 py-1.5 rounded-md font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                sheetSide === 'BACK'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="2ª Etapa: Imprimir o Verso com 3 anos de pagamento (conforme Melhoria 01)"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>2ª Etapa: Verso (3 Anos)</span>
            </button>
          </div>

          {/* Se estiver no VERSO, exibir o botão de modo de alinhamento */}
          {sheetSide === 'BACK' && (
            <button
              type="button"
              onClick={() => setDuplexFlipMode((m) => (m === 'HORIZONTAL' ? 'DIRECT' : 'HORIZONTAL'))}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md text-[11px] font-medium flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
              title="Alternar entre Giro Horizontal (Padrão de Impressora ao virar de lado) ou Alinhamento Direto"
            >
              <ArrowLeftRight className="w-3 h-3 text-emerald-400" />
              <span>Giro:</span>
              <strong className="text-emerald-300">
                {duplexFlipMode === 'HORIZONTAL' ? 'Horizontal (Padrão Livro)' : 'Direto'}
              </strong>
            </button>
          )}

          <div className="h-5 w-px bg-slate-700 mx-1 hidden sm:block" />

          <span className="font-semibold text-slate-300 mr-1">Modo de Distribuição:</span>
          {/* Modo Impressão em Lote (Plano Individual) */}
          {allCards.some((c) => c.batchPrintSelected) && (
            <button
              onClick={() => {
                setPrintMode('BATCH_INDIVIDUAL');
                setCurrentPage(0);
              }}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                printMode === 'BATCH_INDIVIDUAL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-indigo-900/80 text-indigo-200 hover:bg-indigo-800 border border-indigo-700/60'
              }`}
              title="Exibir na folha todas as carteirinhas individuais marcadas para Impressão em Lote"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Impressão em Lote ({allCards.filter((c) => c.batchPrintSelected).length})</span>
            </button>
          )}

          {familyMembers.length > 1 && (
            <button
              onClick={() => {
                setPrintMode('FAMILY');
                setCurrentPage(0);
              }}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors ${
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
            className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors ${
              printMode === 'SINGLE_4X'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Preencher Folha (8x)
          </button>

          <button
            onClick={() => {
              setPrintMode('SINGLE_1X');
              setCurrentPage(0);
            }}
            className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors ${
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
            className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors ${
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
            <span className="font-medium text-slate-200">Guia de Corte Central</span>
          </div>

          <div className="h-4 w-px bg-slate-600" />

          <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-700">
            <button
              disabled={safeCurrentPage === 0}
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              className="p-1 disabled:opacity-30 hover:text-blue-400 transition-colors cursor-pointer"
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
              className="p-1 disabled:opacity-30 hover:text-blue-400 transition-colors cursor-pointer"
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
          {/* 4 Colunas Verticais sem corredor: cada coluna contém 2 carteirinhas lado a lado */}
          <div className="flex-1 flex items-center justify-center overflow-visible h-full w-full">
            <div
              className="flex items-center justify-center overflow-visible"
              style={{
                transform: 'scale(0.85522)',
                transformOrigin: 'center center',
              }}
            >
              {currentColumns.map((col, idx) => {
                const isColEmpty = !col.leftCard && !col.rightCard;

                return (
                  <div
                    key={idx}
                    className="relative flex items-center justify-center border-0 overflow-visible shrink-0"
                    style={{
                      width: `${cardHeightMm}mm`,
                      height: `${cardTotalWidthMm}mm`,
                      marginLeft: idx > 0 && !isColEmpty ? '-1px' : '0',
                    }}
                  >
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
                      }}
                    >
                      <div
                        className="flex items-center box-border select-none"
                        style={{
                          width: `${cardTotalWidthMm}mm`,
                          height: `${cardHeightMm}mm`,
                        }}
                      >
                        {/* FACE 1 (ESQUERDA) */}
                        <div
                          style={{
                            width: `${printCardConfig.cardWidthMm}mm`,
                            height: `${cardHeightMm}mm`,
                            minWidth: `${printCardConfig.cardWidthMm}mm`,
                            minHeight: `${cardHeightMm}mm`,
                          }}
                          className="relative flex items-center justify-center overflow-visible"
                        >
                          {col.leftCard ? (
                            <PrintableCard
                              card={col.leftCard}
                              config={printCardConfig}
                              renderOnly={sheetSide === 'FRONT' ? 'front' : 'back'}
                              showFoldGuideline={false}
                            />
                          ) : (
                            <div className="w-full h-full bg-transparent border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 text-[10px]">
                              <span className="font-mono text-[9px] text-slate-400">Espaço Vazio</span>
                            </div>
                          )}
                        </div>

                        {/* LINHA DE CORTE CENTRAL ENTRE AS DUAS CARTEIRINHAS (4mm) */}
                        <div
                          className="flex items-center justify-center select-none"
                          style={{
                            width: '4mm',
                            height: `${cardHeightMm}mm`,
                          }}
                        >
                          {(col.leftCard || col.rightCard) && (
                            <div className="border-l-2 border-dashed border-slate-400 h-full flex items-center justify-center">
                              <div className="bg-slate-100 text-slate-500 text-[7px] font-mono px-0.5 py-0.5 rounded flex items-center gap-0.5 whitespace-nowrap shadow-xs">
                                <Scissors className="w-2 h-2" />
                                <span>Corte</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* FACE 2 (DIREITA) */}
                        <div
                          style={{
                            width: `${printCardConfig.cardWidthMm}mm`,
                            height: `${cardHeightMm}mm`,
                            minWidth: `${printCardConfig.cardWidthMm}mm`,
                            minHeight: `${cardHeightMm}mm`,
                          }}
                          className="relative flex items-center justify-center overflow-visible"
                        >
                          {col.rightCard ? (
                            <PrintableCard
                              card={col.rightCard}
                              config={printCardConfig}
                              renderOnly={sheetSide === 'FRONT' ? 'front' : 'back'}
                              showFoldGuideline={false}
                            />
                          ) : (
                            <div className="w-full h-full bg-transparent border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300 text-[10px]">
                              <span className="font-mono text-[9px] text-slate-400">Espaço Vazio</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* ================= CONTAINER DEDICADO DE IMPRESSÃO NATIVA (VISÍVEL SOMENTE NA IMPRESSÃO) ================= */}
      {createPortal(
        <div id="print-sheet-root" className="hidden print:block">
          {pagesToPrintInRoot.map((pgIdx) => {
            const pageCols = getPageColumns(pgIdx, sheetSide);

            return (
              <div key={pgIdx} className="a4-print-page">
                {/* 4 Colunas Verticais sem corredor: carteirinhas unidas lado a lado com linha de contorno compartilhada */}
                <div className="flex items-center justify-center h-[210mm] w-[297mm] my-auto overflow-visible">
                  <div
                    className="flex items-center justify-center overflow-visible"
                    style={{
                      transform: 'scale(0.97)',
                      transformOrigin: 'center center',
                    }}
                  >
                    {pageCols.map((col, slotIdx) => {
                      const isColEmpty = !col.leftCard && !col.rightCard;

                      return (
                        <div
                          key={slotIdx}
                          className="relative flex items-center justify-center border-0 overflow-visible shrink-0"
                          style={{
                            width: `${cardHeightMm}mm`,
                            height: `${cardTotalWidthMm}mm`,
                            marginLeft: slotIdx > 0 && !isColEmpty ? '-1px' : '0',
                            visibility: isColEmpty ? 'hidden' : 'visible',
                          }}
                        >
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
                            }}
                          >
                            <div
                              className="flex items-center box-border select-none"
                              style={{
                                width: `${cardTotalWidthMm}mm`,
                                height: `${cardHeightMm}mm`,
                              }}
                            >
                              {/* Face 1 */}
                              <div
                                style={{
                                  width: `${printCardConfig.cardWidthMm}mm`,
                                  height: `${cardHeightMm}mm`,
                                }}
                                className="relative flex items-center justify-center overflow-visible"
                              >
                                {col.leftCard ? (
                                  <PrintableCard
                                    card={col.leftCard}
                                    config={printCardConfig}
                                    renderOnly={sheetSide === 'FRONT' ? 'front' : 'back'}
                                    showFoldGuideline={false}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-transparent" />
                                )}
                              </div>

                              {/* Linha Divisória de Corte */}
                              <div
                                className="flex items-center justify-center select-none"
                                style={{
                                  width: '4mm',
                                  height: `${cardHeightMm}mm`,
                                }}
                              >
                                {col.leftCard && col.rightCard && (
                                  <div className="border-l-2 border-dashed border-slate-400 h-full flex items-center justify-center">
                                    <div className="bg-slate-100 text-slate-500 text-[7px] font-mono px-0.5 py-0.5 rounded flex items-center gap-0.5 whitespace-nowrap shadow-xs">
                                      <Scissors className="w-2 h-2" />
                                      <span>Corte</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Face 2 */}
                              <div
                                style={{
                                  width: `${printCardConfig.cardWidthMm}mm`,
                                  height: `${cardHeightMm}mm`,
                                }}
                                className="relative flex items-center justify-center overflow-visible"
                              >
                                {col.rightCard ? (
                                  <PrintableCard
                                    card={col.rightCard}
                                    config={printCardConfig}
                                    renderOnly={sheetSide === 'FRONT' ? 'front' : 'back'}
                                    showFoldGuideline={false}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-transparent" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
