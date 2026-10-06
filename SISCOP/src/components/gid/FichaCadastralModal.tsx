import React, { useState, useEffect, useRef } from 'react';
import { CardData, MonthPayment, CategoryType, CalculationRecord } from '../../types';
import { RichTextEditor } from '../common/RichTextEditor';
import { BrasaoPousoAlegre } from '../common/BrasaoPousoAlegre';
import { AcertoCalculatorModal } from '../calculator/AcertoCalculatorModal';
import { formatBirthDate, formatPhoneNumber, formatCpfNumber } from '../../utils/formatters';
import { executePrint } from '../../utils/printHelper';
import {
  X,
  Printer,
  Edit,
  Save,
  Clock,
  UserCheck,
  Calendar,
  CreditCard,
  Building,
  CheckCircle2,
  FileText,
  DollarSign,
  User,
  Phone,
  MapPin,
  Shield,
  Layers,
  Search,
  Upload,
  Globe,
  Scissors,
  Calculator,
  AlertTriangle,
  History,
  ArrowRight,
  Camera,
  Trash2
} from 'lucide-react';

const YEARS_2024_2050 = Array.from({ length: 2050 - 2024 + 1 }, (_, i) => 2024 + i);
const MONTHS_3_LETTERS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

interface FichaCadastralModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: CardData | null;
  initialMode?: 'VIEW' | 'EDIT';
  initialTab?: 'DADOS' | 'PAGAMENTOS';
  onSave: (updatedCard: CardData) => void;
  currentUser?: { name: string } | null;
}

export interface BankOption {
  code: string;
  name: string;
  badge: string;
  bgColor: string;
  textColor: string;
  customLogoUrl?: string;
}

export const OFFICIAL_BANKS: BankOption[] = [
  { code: '001', name: 'Banco do Brasil', badge: 'BB', bgColor: 'bg-yellow-400', textColor: 'text-blue-900' },
  { code: '104', name: 'Caixa Econômica Federal', badge: 'CEF', bgColor: 'bg-blue-600', textColor: 'text-white' },
  { code: '237', name: 'Bradesco', badge: 'BRAD', bgColor: 'bg-red-600', textColor: 'text-white' },
  { code: '341', name: 'Itaú Unibanco', badge: 'ITAÚ', bgColor: 'bg-orange-500', textColor: 'text-white' },
  { code: '033', name: 'Santander', badge: 'SAN', bgColor: 'bg-red-700', textColor: 'text-white' },
  { code: '260', name: 'Nubank', badge: 'NU', bgColor: 'bg-purple-700', textColor: 'text-white' },
  { code: '077', name: 'Banco Inter', badge: 'INTER', bgColor: 'bg-orange-600', textColor: 'text-white' },
  { code: '756', name: 'Sicoob', badge: 'SICOOB', bgColor: 'bg-emerald-800', textColor: 'text-white' },
  { code: '748', name: 'Sicredi', badge: 'SICREDI', bgColor: 'bg-green-700', textColor: 'text-white' },
  { code: '336', name: 'C6 Bank', badge: 'C6', bgColor: 'bg-slate-900', textColor: 'text-white' },
  { code: '212', name: 'Banco Original', badge: 'ORIG', bgColor: 'bg-emerald-600', textColor: 'text-white' },
  { code: '290', name: 'PagBank / PagSeguro', badge: 'PAG', bgColor: 'bg-amber-500', textColor: 'text-slate-950' },
  { code: '000', name: 'Outro Banco / Casa Lotérica', badge: 'OUTRO', bgColor: 'bg-slate-700', textColor: 'text-white' },
];

export const FichaCadastralModal: React.FC<FichaCadastralModalProps> = ({
  isOpen,
  onClose,
  card,
  initialMode = 'VIEW',
  initialTab = 'DADOS',
  onSave,
  currentUser,
}) => {
  const [mode, setMode] = useState<'VIEW' | 'EDIT'>(initialMode);
  const [activeTab, setActiveTab] = useState<'DADOS' | 'PAGAMENTOS'>(initialTab);

  // Form State for Associate
  const [formData, setFormData] = useState<CardData | null>(null);

  // Custom bank logos state (bankCode -> logoUrl)
  const [customBankLogos, setCustomBankLogos] = useState<Record<string, string>>({});
  const [showCustomLogoModal, setShowCustomLogoModal] = useState(false);
  const [customLogoInput, setCustomLogoInput] = useState('');
  const [targetBankCodeForCustomLogo, setTargetBankCodeForCustomLogo] = useState('001');

  // Date picker ref for payment dialog
  const datePickerRef = useRef<HTMLInputElement>(null);

  // Photo input ref and upload handler
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setFormData((prev) => (prev ? { ...prev, photoUrl: dataUrl } : null));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Helper to format continuous payment date (e.g. "15012026" -> "15/01/2026")
  const formatPaymentDateOnBlur = (val: string): string => {
    if (!val) return '';
    const cleaned = val.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
      return cleaned;
    }
    const digits = cleaned.replace(/\D/g, '');
    if (digits.length === 8) {
      return `${digits.substring(0, 2)}/${digits.substring(2, 4)}/${digits.substring(4, 8)}`;
    } else if (digits.length === 6) {
      return `${digits.substring(0, 2)}/${digits.substring(2, 4)}/20${digits.substring(4, 6)}`;
    }
    return val;
  };

  // Payment Details Dialog State
  const [editingPayment, setEditingPayment] = useState<{
    gridNumber: 1 | 2;
    monthIndex: number;
    month: string;
    year: string;
    datePaid: string;
    signature: string;
    paymentMethod: string;
    payingBank: string;
    payingBankIcon: string;
    referenceId: string;
  } | null>(null);

  // Calculator Modal state
  const [showCalcModal, setShowCalcModal] = useState(false);

  // Extend Payment State inside Informações de Pagamento
  const [extendPayment, setExtendPayment] = useState(false);
  const [extendYear, setExtendYear] = useState('2027');
  const [extendMonth, setExtendMonth] = useState('ABR');
  const [extendYearWarning, setExtendYearWarning] = useState<string | null>(null);
  const [extendValidationWarning, setExtendValidationWarning] = useState<string | null>(null);
  const [extendFeedbackToast, setExtendFeedbackToast] = useState<string | null>(null);

  // Sync state with incoming card prop
  useEffect(() => {
    if (card) {
      setFormData({
        ...card,
        notesHtml: card.notesHtml || '',
        internalInfoHtml: card.internalInfoHtml || '',
        includeNotesInPrint: card.includeNotesInPrint !== undefined ? card.includeNotesInPrint : true,
        includeInternalInfoInPrint: card.includeInternalInfoInPrint !== undefined ? card.includeInternalInfoInPrint : false,
      });
      setMode(initialMode);
      setActiveTab(initialTab);
    }
  }, [card, initialMode, initialTab]);

  if (!isOpen || !formData) return null;

  // Format date and time for last update
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'Data não registrada';
    try {
      const d = new Date(isoString);
      return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } catch {
      return isoString;
    }
  };

  const handleSave = () => {
    if (!formData) return;
    const updated: CardData = {
      ...formData,
      updatedAt: new Date().toISOString(),
      lastEditedBy: currentUser?.name || 'Administrador',
    };
    onSave(updated);
    setMode('VIEW');
  };

  const handlePrint = () => {
    executePrint({
      orientation: 'portrait',
      bodyClass: 'printing-ficha-cadastral',
      pageMargin: '6mm',
    });
  };

  // Open Payment info dialog for specific month
  const handleOpenPaymentDialog = (gridNum: 1 | 2, monthIndex: number) => {
    const grid = gridNum === 1 ? formData.grid1 : formData.grid2;
    const year = gridNum === 1 ? formData.year1 || '2026' : formData.year2 || '2027';
    const item = grid[monthIndex];

    setExtendPayment(false);
    setExtendYear(formData.year2 || '2027');
    setExtendMonth('ABR');
    setExtendYearWarning(null);
    setExtendValidationWarning(null);
    setExtendFeedbackToast(null);

    setEditingPayment({
      gridNumber: gridNum,
      monthIndex,
      month: item.month,
      year,
      datePaid: item.datePaid || '',
      signature: item.signature || currentUser?.name?.split(' ')[0] || 'Atendente',
      paymentMethod: item.paymentMethod || 'Pix',
      payingBank: item.payingBank || 'Banco do Brasil - 001',
      payingBankIcon: item.payingBankIcon || customBankLogos['001'] || '',
      referenceId: item.referenceId || '',
    });
  };

  // Replicar pagamento atual até o Ano e Mês selecionados (Estender Pagamento)
  const handleApplyExtendPayment = () => {
    if (!editingPayment) return;

    if (!extendPayment) {
      setExtendValidationWarning('A checkbox "Estender Pagamento" precisa estar marcada para aplicar a extensão.');
      return;
    }

    const formattedDate = formatPaymentDateOnBlur(editingPayment.datePaid || '');
    if (!formattedDate) {
      setExtendValidationWarning('Por favor, informe a "Data do Pagamento" antes de aplicar a extensão.');
      return;
    }

    const validYear1 = formData.year1?.trim() || '2026';
    const validYear2 = formData.year2?.trim() || '2027';

    // Verificação estrita: o ano selecionado existe nos quadros de ANO DE EXERCÍCIO?
    if (extendYear !== validYear1 && extendYear !== validYear2) {
      setExtendYearWarning(extendYear);
      return;
    }

    // Identificar ano e mês de início com base na data do pagamento ou na linha clicada
    let startYear = editingPayment.year || (editingPayment.gridNumber === 1 ? validYear1 : validYear2);
    let startMonthIndex = editingPayment.monthIndex;

    const dateParts = formattedDate.split('/');
    if (dateParts.length === 3) {
      const dMonth = parseInt(dateParts[1], 10) - 1;
      const dYear = dateParts[2];
      if ((dYear === validYear1 || dYear === validYear2) && dMonth >= 0 && dMonth <= 11) {
        startYear = dYear;
        startMonthIndex = dMonth;
      }
    }

    // Montar a sequência cronológica dos 24 meses (12 do Ano 1 e 12 do Ano 2)
    const isYear1First = parseInt(validYear1, 10) <= parseInt(validYear2, 10);
    const slots: { gridNum: 1 | 2; monthIndex: number; year: string; monthName: string }[] = [];

    const firstGridNum: 1 | 2 = isYear1First ? 1 : 2;
    const firstYear = isYear1First ? validYear1 : validYear2;
    const secondGridNum: 1 | 2 = isYear1First ? 2 : 1;
    const secondYear = isYear1First ? validYear2 : validYear1;

    for (let m = 0; m < 12; m++) {
      slots.push({ gridNum: firstGridNum, monthIndex: m, year: firstYear, monthName: MONTHS_3_LETTERS[m] });
    }
    for (let m = 0; m < 12; m++) {
      slots.push({ gridNum: secondGridNum, monthIndex: m, year: secondYear, monthName: MONTHS_3_LETTERS[m] });
    }

    const startIndex = slots.findIndex((s) => s.year === startYear && s.monthIndex === startMonthIndex);
    const targetMonthIndex = MONTHS_3_LETTERS.indexOf(extendMonth);
    const targetIndex = slots.findIndex((s) => s.year === extendYear && s.monthIndex === targetMonthIndex);

    if (startIndex === -1 || targetIndex === -1) {
      setExtendYearWarning(extendYear);
      return;
    }

    if (targetIndex < startIndex) {
      setExtendValidationWarning(
        `O período final (${extendMonth}/${extendYear}) não pode ser anterior ao início do pagamento (${slots[startIndex].monthName}/${slots[startIndex].year}).`
      );
      return;
    }

    const newGrid1 = [...formData.grid1];
    const newGrid2 = [...formData.grid2];
    const paymentData = {
      datePaid: formattedDate,
      signature: editingPayment.signature,
      paymentMethod: editingPayment.paymentMethod,
      payingBank: editingPayment.payingBank,
      payingBankIcon: editingPayment.payingBankIcon,
      referenceId: editingPayment.referenceId,
    };

    let count = 0;
    for (let i = startIndex; i <= targetIndex; i++) {
      const s = slots[i];
      if (s.gridNum === 1) {
        newGrid1[s.monthIndex] = { ...newGrid1[s.monthIndex], ...paymentData };
      } else {
        newGrid2[s.monthIndex] = { ...newGrid2[s.monthIndex], ...paymentData };
      }
      count++;
    }

    setFormData((prev) => (prev ? { ...prev, grid1: newGrid1, grid2: newGrid2 } : null));
    setExtendFeedbackToast(
      `Pagamento estendido com sucesso para ${count} meses (de ${slots[startIndex].monthName}/${slots[startIndex].year} até ${slots[targetIndex].monthName}/${slots[targetIndex].year})!`
    );
    setTimeout(() => {
      setExtendFeedbackToast(null);
      setEditingPayment(null);
    }, 1400);
  };

  // Save specific payment record into grid
  const handleSavePaymentDialog = () => {
    if (!editingPayment) return;

    if (extendPayment) {
      handleApplyExtendPayment();
      return;
    }

    const { gridNumber, monthIndex, datePaid, signature, paymentMethod, payingBank, payingBankIcon, referenceId } = editingPayment;
    const formattedDate = formatPaymentDateOnBlur(datePaid);

    if (gridNumber === 1) {
      const updatedGrid1 = [...formData.grid1];
      updatedGrid1[monthIndex] = {
        ...updatedGrid1[monthIndex],
        datePaid: formattedDate,
        signature,
        paymentMethod,
        payingBank,
        payingBankIcon,
        referenceId,
      };
      setFormData((prev) => (prev ? { ...prev, grid1: updatedGrid1 } : null));
    } else {
      const updatedGrid2 = [...formData.grid2];
      updatedGrid2[monthIndex] = {
        ...updatedGrid2[monthIndex],
        datePaid: formattedDate,
        signature,
        paymentMethod,
        payingBank,
        payingBankIcon,
        referenceId,
      };
      setFormData((prev) => (prev ? { ...prev, grid2: updatedGrid2 } : null));
    }

    setEditingPayment(null);
  };

  // Clear payment for that month
  const handleClearPaymentDialog = () => {
    if (!editingPayment) return;
    const { gridNumber, monthIndex } = editingPayment;

    if (gridNumber === 1) {
      const updatedGrid1 = [...formData.grid1];
      updatedGrid1[monthIndex] = {
        ...updatedGrid1[monthIndex],
        datePaid: '',
        signature: '',
        paymentMethod: undefined,
        payingBank: undefined,
        payingBankIcon: undefined,
        referenceId: undefined,
      };
      setFormData((prev) => (prev ? { ...prev, grid1: updatedGrid1 } : null));
    } else {
      const updatedGrid2 = [...formData.grid2];
      updatedGrid2[monthIndex] = {
        ...updatedGrid2[monthIndex],
        datePaid: '',
        signature: '',
        paymentMethod: undefined,
        payingBank: undefined,
        payingBankIcon: undefined,
        referenceId: undefined,
      };
      setFormData((prev) => (prev ? { ...prev, grid2: updatedGrid2 } : null));
    }

    setEditingPayment(null);
  };

  const handleApplyCustomBankLogo = () => {
    if (customLogoInput.trim()) {
      setCustomBankLogos((prev) => ({
        ...prev,
        [targetBankCodeForCustomLogo]: customLogoInput.trim(),
      }));
      if (editingPayment) {
        setEditingPayment((prev) =>
          prev ? { ...prev, payingBankIcon: customLogoInput.trim() } : null
        );
      }
    }
    setShowCustomLogoModal(false);
    setCustomLogoInput('');
  };

  return (
    <div className="ficha-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-2.5 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150 print:p-0 print:bg-white print:static print:inset-auto">
      {/* Modal Container */}
      <div className="ficha-modal-container bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-[98vw] 2xl:max-w-[1780px] overflow-hidden flex flex-col h-[95vh] max-h-[95vh] print:max-h-none print:h-auto print:border-none print:shadow-none print:w-full">
        {/* ================= MODAL HEADER (PRINT:HIDDEN) ================= */}
        <div className="bg-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-slate-800 print:hidden select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                  {mode === 'EDIT' ? 'Editar Ficha Cadastral Oficial' : 'Ficha Cadastral do Associado'}
                </h2>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-900/80 text-blue-200 border border-blue-700/60">
                  {formData.controlNumber}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-200 border border-emerald-700/60">
                  {formData.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Praça de Esportes Pref. Alvarim Vieira Rios • Secretaria Municipal de Esportes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'EDIT' && (
              <button
                type="button"
                onClick={() => setMode('VIEW')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                title="Alternar para modo visualização"
              >
                <span>Visualizar</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Imprimir Ficha Cadastral Completa"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= INFORMAÇÃO DE AUDITORIA NO CABEÇALHO (NÃO SAI NA IMPRESSÃO) ================= */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-600 shrink-0 print:hidden select-none">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Última edição / atualização:</strong> {formatDateTime(formData.updatedAt)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-700">
            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Realizada por: <strong>{formData.lastEditedBy || currentUser?.name || 'Administrador do Sistema'}</strong>
            </span>
            <span className="text-[10px] text-slate-400 ml-2 font-mono">(Esta auditoria não sai na impressão)</span>
          </div>
        </div>

        {/* ================= ABAS (DADOS CADASTRAIS / DEMONSTRATIVO DE PAGAMENTO) ================= */}
        <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between gap-3 text-xs shrink-0 print:hidden select-none">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('DADOS')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'DADOS'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Ficha Cadastral Completa</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PAGAMENTOS')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'PAGAMENTOS'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Demonstrativo de Pagamento (Histórico)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-400">
            {mode === 'EDIT' ? (
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <Edit className="w-3 h-3" /> Campos em modo de edição
              </span>
            ) : (
              <span className="text-slate-400">Modo de consulta rápida</span>
            )}
          </div>
        </div>

        {/* ================= MODAL BODY / SCROLLABLE CONTENT ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 print:bg-white print:p-0 print:overflow-visible">
          {/* OFICIAL PRINT HEADER (EXIBIDO APENAS NA IMPRESSÃO) */}
          <div className="hidden print:flex items-center justify-between border-b-2 border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-3">
              <BrasaoPousoAlegre size={55} />
              <div>
                <h1 className="font-bold text-sm text-slate-900 uppercase">
                  Prefeitura Municipal de Pouso Alegre
                </h1>
                <h2 className="font-semibold text-xs text-slate-700 uppercase">
                  Secretaria Municipal de Esportes • Praça de Esportes
                </h2>
                <div className="font-bold text-xs text-blue-900 mt-0.5">
                  FICHA CADASTRAL OFICIAL DO ASSOCIADO
                </div>
              </div>
            </div>
            <div className="text-right font-mono text-xs">
              <div className="font-bold text-sm text-slate-900">{formData.controlNumber}</div>
              <div className="text-[10px] text-slate-600">Emissão: {formData.emissionDate}</div>
              <div className="text-[10px] font-bold text-emerald-800 uppercase">Status: {formData.status}</div>
            </div>
          </div>

          {/* ================= TAB 1: DADOS CADASTRAIS COMPLETOS ================= */}
          {activeTab === 'DADOS' && (
            <div className="space-y-6">
              {/* BLOCO 1: IDENTIFICAÇÃO DO ASSOCIADO */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center pb-2 mb-3 border-b border-slate-200 flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      1. Identificação Geral do Associado
                    </h3>
                  </div>

                  {/* Retângulo informativo de Vínculo: TITULAR (fundo preto) ou DEPENDENTE (fundo azul) */}
                  {formData.isTitular !== false ? (
                    <span
                      className="bg-black text-white px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider select-none cursor-default border border-black shadow-2xs inline-flex items-center justify-center print:bg-black print:text-white"
                      title="Vínculo no Plano: Titular"
                    >
                      TITULAR
                    </span>
                  ) : (
                    <span
                      className="bg-blue-600 text-white px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider select-none cursor-default border border-blue-600 shadow-2xs inline-flex items-center justify-center print:bg-blue-600 print:text-white"
                      title="Vínculo no Plano: Dependente"
                    >
                      DEPENDENTE
                    </span>
                  )}
                </div>

                {/* Input oculto para carregar arquivo de foto */}
                <input
                  type="file"
                  ref={photoInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                />

                <div className="flex flex-col md:flex-row gap-5 items-start">
                  {/* CAMPO DE FOTO DO ASSOCIADO (TAMANHO MÉDIO PARA BOA VISUALIZAÇÃO E IDENTIFICAÇÃO) */}
                  <div className="flex flex-col items-center shrink-0 w-full md:w-44 self-start">
                    <div className="w-40 md:w-44 h-52 relative rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden flex flex-col items-center justify-center shadow-xs transition-all group">
                      {formData.photoUrl ? (
                        <>
                          <img
                            src={formData.photoUrl}
                            alt={`Foto de ${formData.name}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          {mode === 'EDIT' && (
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2 print:hidden">
                              <button
                                type="button"
                                onClick={() => photoInputRef.current?.click()}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Trocar Foto do Associado"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <span>Trocar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setFormData((prev) => (prev ? { ...prev, photoUrl: '' } : null))}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Remover Foto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remover</span>
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div
                          onClick={() => {
                            if (mode === 'EDIT') photoInputRef.current?.click();
                          }}
                          className={`w-full h-full flex flex-col items-center justify-center p-3 text-center transition-colors ${
                            mode === 'EDIT'
                              ? 'cursor-pointer hover:bg-blue-50/70 border-blue-300 group-hover:border-blue-500'
                              : 'cursor-default'
                          }`}
                          title={mode === 'EDIT' ? 'Clique para inserir foto do associado' : 'Sem foto cadastrada'}
                        >
                          <div className="w-14 h-14 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-500 mb-2 group-hover:scale-105 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all">
                            {mode === 'EDIT' ? (
                              <Camera className="w-7 h-7" />
                            ) : (
                              <User className="w-7 h-7" />
                            )}
                          </div>
                          {mode === 'EDIT' ? (
                            <>
                              <span className="font-bold text-xs text-blue-900 leading-tight">
                                Inserir Foto
                              </span>
                              <span className="text-[10px] text-slate-500 mt-1 leading-tight">
                                Clique para buscar no computador (JPG, PNG)
                              </span>
                            </>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400">
                              Sem foto cadastrada
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Botões de Ação da Foto (No Modo de Edição) */}
                    {mode === 'EDIT' && (
                      <div className="flex items-center gap-1.5 mt-2 print:hidden w-full justify-center">
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Selecionar imagem do computador"
                        >
                          <Upload className="w-3 h-3" />
                          <span>{formData.photoUrl ? 'Alterar' : 'Inserir Foto'}</span>
                        </button>
                        {formData.photoUrl && (
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => (prev ? { ...prev, photoUrl: '' } : null))}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Remover Foto Atual"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1 select-none">
                      Foto do Associado
                    </span>
                  </div>

                  {/* CAMPOS DE DADOS CADASTRAIS DO ASSOCIADO */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs w-full">
                    {/* Nome Completo */}
                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">Nome Completo:</label>
                      {mode === 'EDIT' ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      ) : (
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-900">
                          {formData.name}
                        </div>
                      )}
                    </div>

                    {/* Número de Controle */}
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Nº de Controle:</label>
                      {mode === 'EDIT' ? (
                        <input
                          type="text"
                          value={formData.controlNumber}
                          onChange={(e) => setFormData({ ...formData, controlNumber: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-blue-900 focus:border-blue-500 outline-none"
                        />
                      ) : (
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg font-mono font-bold text-blue-900">
                          {formData.controlNumber}
                        </div>
                      )}
                    </div>

                    {/* Data de Nascimento */}
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Data de Nascimento:</label>
                      {mode === 'EDIT' ? (
                        <input
                          type="text"
                          value={formData.birthDate}
                          onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                          onBlur={() => setFormData((prev) => prev ? { ...prev, birthDate: formatBirthDate(prev.birthDate) } : null)}
                          placeholder="DD/MM/AAAA (ex: 15012026)"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:border-blue-500 outline-none font-mono text-xs"
                        />
                      ) : (
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                          {formData.birthDate || 'Não informada'}
                        </div>
                      )}
                    </div>

                    {/* RG ou CPF */}
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">RG / CPF:</label>
                      {mode === 'EDIT' ? (
                        <input
                          type="text"
                          value={formData.rgOrCpf || ''}
                          onChange={(e) => setFormData({ ...formData, rgOrCpf: e.target.value })}
                          onBlur={() => {
                            const val = (formData.rgOrCpf || '').replace(/\D/g, '');
                            if (val.length === 11) {
                              setFormData((prev) => prev ? { ...prev, rgOrCpf: formatCpfNumber(prev.rgOrCpf || '') } : null);
                            }
                          }}
                          placeholder="000.000.000-00 ou RG"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:border-blue-500 outline-none font-mono text-xs"
                        />
                      ) : (
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono">
                          {formData.rgOrCpf || 'Não informado'}
                        </div>
                      )}
                    </div>

                    {/* Telefone / WhatsApp */}
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Telefone / Celular:</label>
                      {mode === 'EDIT' ? (
                        <input
                          type="text"
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          onBlur={() => setFormData((prev) => prev ? { ...prev, phone: formatPhoneNumber(prev.phone || '') } : null)}
                          placeholder="(35) 9 9955-8899"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:border-blue-500 outline-none font-mono text-xs"
                        />
                      ) : (
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                          {formData.phone || 'Não informado'}
                        </div>
                      )}
                    </div>

                    {/* Localização Arquivo Físico */}
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Localização Arquivo Físico:</label>
                      {mode === 'EDIT' ? (
                        <input
                          type="text"
                          value={formData.physicalArchiveLocation || ''}
                          onChange={(e) => setFormData({ ...formData, physicalArchiveLocation: e.target.value })}
                          placeholder="Ex: 10-C"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 font-mono font-bold uppercase focus:border-blue-500 outline-none"
                        />
                      ) : (
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono font-bold">
                          {formData.physicalArchiveLocation || 'Não informada'}
                        </div>
                      )}
                    </div>

                    {/* Endereço Completo */}
                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 block mb-1">Endereço Residencial:</label>
                      {mode === 'EDIT' ? (
                        <input
                          type="text"
                          value={formData.address || ''}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="Rua, Número, Bairro, Cidade/UF"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:border-blue-500 outline-none"
                        />
                      ) : (
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                          {formData.address || 'Não cadastrado'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOCO 2: CLASSIFICAÇÃO DO PLANO & CONDIÇÕES */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-200">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    2. Modalidade de Plano & Informações de Saúde
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                  {/* Categoria */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Categoria do Plano:</label>
                    {mode === 'EDIT' ? (
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          const cat = e.target.value as CategoryType;
                          setFormData({
                            ...formData,
                            category: cat,
                            planType: cat === 'PLANO_ESPECIAL' ? 'ESPECIAL' : cat === 'PLANO_FAMILIAR' ? 'FAMILIAR' : 'INDIVIDUAL',
                            isSpecialExempt: cat === 'PLANO_ESPECIAL',
                          });
                        }}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-800 focus:border-blue-500 outline-none"
                      >
                        <option value="PLANO_INDIVIDUAL">Plano Individual</option>
                        <option value="PLANO_FAMILIAR">Plano Familiar</option>
                        <option value="PLANO_ESPECIAL">Plano Especial (Isento)</option>
                        <option value="PREFEITURA">Servidor da Prefeitura</option>
                        <option value="BOMBEIROS">Corpo de Bombeiros</option>
                      </select>
                    ) : (
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800">
                        {formData.category}
                      </div>
                    )}
                  </div>

                  {/* Status Cadastral */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Status Cadastral:</label>
                    {mode === 'EDIT' ? (
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-semibold text-slate-800 focus:border-blue-500 outline-none"
                      >
                        <option value="ATIVO">ATIVO (Regular)</option>
                        <option value="SUSPENSO">SUSPENSO (Pendente)</option>
                        <option value="INATIVO">INATIVO</option>
                      </select>
                    ) : (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg font-bold text-emerald-800">
                        {formData.status}
                      </div>
                    )}
                  </div>

                  {/* Validade Exame Piscina */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Exame Médico (Piscina):</label>
                    {mode === 'EDIT' ? (
                      <input
                        type="text"
                        value={formData.medicalExamValidUntil || ''}
                        onChange={(e) => setFormData({ ...formData, medicalExamValidUntil: e.target.value })}
                        placeholder="Válido até DD/MM/AAAA"
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:border-blue-500 outline-none"
                      />
                    ) : (
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                        {formData.medicalExamValidUntil || 'Não cadastrado'}
                      </div>
                    )}
                  </div>

                  {/* Condições especiais se aplicável */}
                  {(formData.category === 'PLANO_ESPECIAL' || formData.isSpecialExempt || mode === 'EDIT') && (
                    <>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Condição Especial (Laudo):</label>
                        {mode === 'EDIT' ? (
                          <input
                            type="text"
                            value={formData.specialCondition || ''}
                            onChange={(e) => setFormData({ ...formData, specialCondition: e.target.value })}
                            placeholder="PCD, Autista (TEA), Idoso 60+, Síndrome de Down..."
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:border-blue-500 outline-none"
                          />
                        ) : (
                          <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold">
                            {formData.specialCondition || 'Nenhuma'}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Nº do Laudo Médico / CIPTEA:</label>
                        {mode === 'EDIT' ? (
                          <input
                            type="text"
                            value={formData.medicalReportInfo || ''}
                            onChange={(e) => setFormData({ ...formData, medicalReportInfo: e.target.value })}
                            placeholder="Ex: Laudo Nº 1842/2026 - CIPTEA"
                            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-800 focus:border-blue-500 outline-none"
                          />
                        ) : (
                          <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                            {formData.medicalReportInfo || 'Não informado'}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center pt-5">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-800">
                          <input
                            type="checkbox"
                            checked={formData.isSpecialExempt || false}
                            disabled={mode === 'VIEW'}
                            onChange={(e) => setFormData({ ...formData, isSpecialExempt: e.target.checked })}
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                          />
                          <span>Isenção Integral de Mensalidades (100% Gratuito)</span>
                        </label>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ========================================================================= */}
              {/* BLOCO FINAL OBRIGATÓRIO: OBSERVAÇÕES E INFORMAÇÕES INTERNAS               */}
              {/* Com caixas de texto com scroll, formatação avançada e checkbox de impressão */}
              {/* ========================================================================= */}

              {/* 1. CAMPO OBSERVAÇÕES */}
              <div
                className={`bg-white p-4 rounded-xl border border-slate-200 shadow-2xs ${
                  !formData.includeNotesInPrint ? 'print:hidden' : ''
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Observações
                    </h3>
                  </div>

                  {/* Checkbox para controlar se sai na impressão */}
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg border border-slate-300 transition-colors print:hidden">
                    <input
                      type="checkbox"
                      checked={formData.includeNotesInPrint || false}
                      onChange={(e) =>
                        setFormData({ ...formData, includeNotesInPrint: e.target.checked })
                      }
                      className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Incluir campo Observações na Impressão</span>
                  </label>
                </div>

                <p className="text-[11px] text-slate-500 mb-2 print:hidden">
                  Caixa de texto com função scroll e ferramentas de formatação (Negrito, Itálico, Sublinhado, Riscado, Fonte, Cor e Destaque aplicados ao termo selecionado).
                </p>

                {mode === 'EDIT' ? (
                  <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <RichTextEditor
                      value={formData.notesHtml || ''}
                      onChange={(html) => setFormData({ ...formData, notesHtml: html })}
                      placeholder="Digite aqui as observações gerais deste associado..."
                      minHeight="110px"
                    />
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg max-h-36 overflow-y-auto leading-relaxed text-xs text-slate-800">
                    {formData.notesHtml ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: formData.notesHtml }}
                        className="prose prose-xs text-slate-800"
                      />
                    ) : (
                      <span className="text-slate-400 italic">Nenhuma observação registrada.</span>
                    )}
                  </div>
                )}
              </div>

              {/* 2. CAMPO INFORMAÇÕES INTERNAS */}
              <div
                className={`bg-white p-4 rounded-xl border border-slate-200 shadow-2xs ${
                  !formData.includeInternalInfoInPrint ? 'print:hidden' : ''
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Informações Internas
                    </h3>
                  </div>

                  {/* Checkbox para controlar se sai na impressão */}
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg border border-slate-300 transition-colors print:hidden">
                    <input
                      type="checkbox"
                      checked={formData.includeInternalInfoInPrint || false}
                      onChange={(e) =>
                        setFormData({ ...formData, includeInternalInfoInPrint: e.target.checked })
                      }
                      className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Incluir campo Informações Internas na Impressão</span>
                  </label>
                </div>

                <p className="text-[11px] text-slate-500 mb-2 print:hidden">
                  Caixa de texto confidencial com barra de rolagem e ferramentas de formatação para registros internos da administração.
                </p>

                {mode === 'EDIT' ? (
                  <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <RichTextEditor
                      value={formData.internalInfoHtml || ''}
                      onChange={(html) => setFormData({ ...formData, internalInfoHtml: html })}
                      placeholder="Digite aqui as informações internas e administrativas (ex: pendências de documentos, advertências, dados de contato de emergência)..."
                      minHeight="110px"
                    />
                  </div>
                ) : (
                  <div className="p-3 bg-purple-50/40 border border-purple-200 rounded-lg max-h-36 overflow-y-auto leading-relaxed text-xs text-slate-800">
                    {formData.internalInfoHtml ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: formData.internalInfoHtml }}
                        className="prose prose-xs text-slate-800"
                      />
                    ) : (
                      <span className="text-slate-400 italic">Nenhuma informação interna registrada.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 2: DEMONSTRATIVO DE PAGAMENTO (HISTÓRICO) ================= */}
          {activeTab === 'PAGAMENTOS' && (
            <div className="space-y-6">
              {/* Banner do Histórico */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <div className="font-bold text-blue-950 text-sm">
                      Demonstrativo Oficial de Pagamento • Histórico Completo
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Botão Calc / Histórico de Cálculos */}
                  <button
                    type="button"
                    onClick={() => setShowCalcModal(true)}
                    className="h-[36px] px-3.5 py-1 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white transition-all shadow-xs cursor-pointer flex items-center gap-1.5 select-none"
                    title="Cálculos de Pagamento de Acerto do Associado e Memórias de Cálculo"
                  >
                    <Calculator className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold leading-none">Calc</span>
                    {formData.calculationHistory && formData.calculationHistory.length > 0 && (
                      <span className="bg-emerald-600 text-white text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                        {formData.calculationHistory.length}
                      </span>
                    )}
                  </button>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-[11px] font-bold text-blue-900 bg-white px-2 py-1 rounded border border-blue-300 block">
                      {formData.controlNumber}
                    </span>
                    <span className="text-[10px] text-blue-700 block mt-0.5">
                      {formData.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* LAYOUT IDÊNTICO AO VERSO DA CARTEIRINHA (DOIS QUADROS LADO A LADO - MÁXIMA LARGURA) */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* QUADRO 1: ANO 1 */}
                <div className="bg-white border-2 border-slate-800 rounded-lg overflow-hidden shadow-xs flex flex-col">
                  {/* Cabeçalho do Ano 1 */}
                  <div className="bg-slate-800 text-white py-1.5 px-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                    <span>Ano de Exercício</span>
                    {mode === 'EDIT' ? (
                      <input
                        type="text"
                        value={formData.year1 || '2026'}
                        onChange={(e) => setFormData({ ...formData, year1: e.target.value })}
                        className="w-16 px-1.5 py-0.5 bg-slate-900 border border-slate-600 text-white text-center font-mono font-bold rounded"
                      />
                    ) : (
                      <span className="font-mono">{formData.year1 || '2026'}</span>
                    )}
                  </div>

                  {/* Tabela do Grid 1 */}
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-800 text-slate-800 font-bold text-[10.5px]">
                          <th className="py-2 px-2.5 text-center border-r border-slate-300 w-12 shrink-0">Mês</th>
                          <th className="py-2 px-2.5 border-r border-slate-300 min-w-[115px]">Pgto Data</th>
                          <th className="py-2 px-2.5 border-r border-slate-300 min-w-[100px]">Rubrica / Ass.</th>
                          <th className="py-2 px-2.5 border-r border-slate-300 min-w-[150px]">Modalidade & Banco</th>
                          <th className="py-2 px-2.5 min-w-[130px]">Identificador</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {formData.grid1.map((row, idx) => (
                          <tr key={row.month} className="hover:bg-slate-50 transition-colors">
                            {/* Mês */}
                            <td className="py-2 px-2 text-center font-bold text-slate-900 border-r border-slate-200 bg-slate-50/50">
                              {row.month}
                            </td>

                            {/* Pgto Data + Botão de Informações de Pagamento (somente em modo de edição) */}
                            <td className="py-1.5 px-2 border-r border-slate-200">
                              <div className="flex items-center gap-1.5 justify-between">
                                <span className={`font-mono text-xs ${row.datePaid ? 'font-bold text-emerald-800' : 'text-slate-400 italic'}`}>
                                  {row.datePaid || '—'}
                                </span>
                                {mode === 'EDIT' && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPaymentDialog(1, idx)}
                                    className="px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[10px] font-bold border border-blue-200 transition-colors cursor-pointer shrink-0 print:hidden"
                                    title="Clique para abrir e preencher Informações de Pagamento"
                                  >
                                    {row.datePaid ? 'Editar' : '+ Pgto'}
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Rubrica */}
                            <td className="py-1.5 px-2 border-r border-slate-200 font-mono text-[11px] text-slate-700">
                              {row.signature || '—'}
                            </td>

                            {/* Modalidade & Banco */}
                            <td className="py-1.5 px-2 border-r border-slate-200">
                              {row.paymentMethod ? (
                                <div className="space-y-0.5">
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-blue-100 text-blue-900">
                                    {row.paymentMethod}
                                  </span>
                                  {row.payingBank && (
                                    <div className="text-[10px] text-slate-700 font-medium leading-tight">
                                      {row.payingBank}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[10px] italic">Em aberto</span>
                              )}
                            </td>

                            {/* Identificador */}
                            <td className="py-1.5 px-2 text-[10.5px] text-slate-700 font-mono break-all" title={row.referenceId}>
                              {row.referenceId || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* QUADRO 2: ANO 2 */}
                <div className="bg-white border-2 border-slate-800 rounded-lg overflow-hidden shadow-xs flex flex-col">
                  {/* Cabeçalho do Ano 2 */}
                  <div className="bg-slate-800 text-white py-1.5 px-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                    <span>Ano de Exercício</span>
                    {mode === 'EDIT' ? (
                      <input
                        type="text"
                        value={formData.year2 || '2027'}
                        onChange={(e) => setFormData({ ...formData, year2: e.target.value })}
                        className="w-16 px-1.5 py-0.5 bg-slate-900 border border-slate-600 text-white text-center font-mono font-bold rounded"
                      />
                    ) : (
                      <span className="font-mono">{formData.year2 || '2027'}</span>
                    )}
                  </div>

                  {/* Tabela do Grid 2 */}
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-800 text-slate-800 font-bold text-[10.5px]">
                          <th className="py-2 px-2.5 text-center border-r border-slate-300 w-12 shrink-0">Mês</th>
                          <th className="py-2 px-2.5 border-r border-slate-300 min-w-[115px]">Pgto Data</th>
                          <th className="py-2 px-2.5 border-r border-slate-300 min-w-[100px]">Rubrica / Ass.</th>
                          <th className="py-2 px-2.5 border-r border-slate-300 min-w-[150px]">Modalidade & Banco</th>
                          <th className="py-2 px-2.5 min-w-[130px]">Identificador</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {formData.grid2.map((row, idx) => (
                          <tr key={row.month} className="hover:bg-slate-50 transition-colors">
                            {/* Mês */}
                            <td className="py-2 px-2 text-center font-bold text-slate-900 border-r border-slate-200 bg-slate-50/50">
                              {row.month}
                            </td>

                            {/* Pgto Data + Botão de Informações de Pagamento (somente em modo de edição) */}
                            <td className="py-1.5 px-2 border-r border-slate-200">
                              <div className="flex items-center gap-1.5 justify-between">
                                <span className={`font-mono text-xs ${row.datePaid ? 'font-bold text-emerald-800' : 'text-slate-400 italic'}`}>
                                  {row.datePaid || '—'}
                                </span>
                                {mode === 'EDIT' && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPaymentDialog(2, idx)}
                                    className="px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[10px] font-bold border border-blue-200 transition-colors cursor-pointer shrink-0 print:hidden"
                                    title="Clique para abrir e preencher Informações de Pagamento"
                                  >
                                    {row.datePaid ? 'Editar' : '+ Pgto'}
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Rubrica */}
                            <td className="py-1.5 px-2 border-r border-slate-200 font-mono text-[11px] text-slate-700">
                              {row.signature || '—'}
                            </td>

                            {/* Modalidade & Banco */}
                            <td className="py-1.5 px-2 border-r border-slate-200">
                              {row.paymentMethod ? (
                                <div className="space-y-0.5">
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-blue-100 text-blue-900">
                                    {row.paymentMethod}
                                  </span>
                                  {row.payingBank && (
                                    <div className="text-[10px] text-slate-700 font-medium leading-tight">
                                      {row.payingBank}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[10px] italic">Em aberto</span>
                              )}
                            </td>

                            {/* Identificador */}
                            <td className="py-1.5 px-2 text-[10.5px] text-slate-700 font-mono break-all" title={row.referenceId}>
                              {row.referenceId || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER BUTTONS ================= */}
        <div className="bg-slate-100 px-4 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden select-none">
          <div className="text-xs text-slate-500">
            {mode === 'EDIT' ? (
              <span className="text-amber-700 font-medium">
                * As alterações serão gravadas na base oficial de dados do SISCOP.
              </span>
            ) : (
              <span>Ficha pronta para conferência e emissão física.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {mode === 'EDIT' && (
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DIÁLOGO DEDICADO: INFORMAÇÕES DE PAGAMENTO (MODALIDADE, BANCO, IDENTIFICADOR) */}
      {/* ========================================================================= */}
      {editingPayment && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-100">
            {/* Header */}
            <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" />
                <div>
                  <h4 className="font-bold text-sm text-white">
                    Informações de Pagamento • {editingPayment.month} / {editingPayment.year}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Registro de quitação de mensalidade do associado
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Botão Calc idêntico ao da barra superior fixa */}
                <button
                  type="button"
                  onClick={() => setShowCalcModal(true)}
                  className="h-[36px] px-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white transition-all shadow-xs cursor-pointer flex items-center gap-1.5 select-none"
                  title="Cálculos de Pagamento de Acerto do Associado"
                >
                  <Calculator className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold leading-none">Calc</span>
                  {formData.calculationHistory && formData.calculationHistory.length > 0 && (
                    <span className="bg-emerald-600 text-white text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold">
                      {formData.calculationHistory.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="p-1 text-slate-400 hover:text-white rounded"
                  title="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="p-4 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Data do Pagamento & Rubrica */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Data do Pagamento:</label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={editingPayment.datePaid}
                      onChange={(e) =>
                        setEditingPayment({ ...editingPayment, datePaid: e.target.value })
                      }
                      onBlur={(e) => {
                        const formatted = formatPaymentDateOnBlur(e.target.value);
                        if (formatted !== e.target.value) {
                          setEditingPayment({ ...editingPayment, datePaid: formatted });
                        }
                      }}
                      placeholder="DD/MM/AAAA (ex: 15012026)"
                      className="w-full pl-3 pr-9 py-1.5 border border-slate-300 rounded-lg font-mono font-semibold text-slate-900 focus:border-blue-500 outline-none"
                    />
                    {/* Input date nativo oculto para acionar calendário */}
                    <input
                      ref={datePickerRef}
                      type="date"
                      tabIndex={-1}
                      className="sr-only pointer-events-none"
                      onChange={(e) => {
                        if (e.target.value) {
                          // e.target.value está no formato AAAA-MM-DD
                          const parts = e.target.value.split('-');
                          if (parts.length === 3) {
                            const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
                            setEditingPayment({
                              ...editingPayment,
                              datePaid: formatted,
                            });
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (datePickerRef.current) {
                          try {
                            if ('showPicker' in HTMLInputElement.prototype) {
                              datePickerRef.current.showPicker();
                            } else {
                              datePickerRef.current.click();
                            }
                          } catch {
                            datePickerRef.current.click();
                          }
                        }
                      }}
                      className="absolute right-1.5 p-1 text-slate-400 hover:text-blue-600 rounded cursor-pointer transition-colors"
                      title="Escolher data pelo calendário"
                    >
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rubrica / Ass. Atendente:</label>
                  <input
                    type="text"
                    value={editingPayment.signature}
                    onChange={(e) =>
                      setEditingPayment({ ...editingPayment, signature: e.target.value })
                    }
                    placeholder="Nome ou sigla do operador"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* 1. MODALIDADE DE PAGAMENTO (CAIXA DROPDOWN) */}
              <div>
                <label className="font-bold text-slate-800 block mb-1 uppercase tracking-wide text-[11px]">
                  Modalidade de Pagamento:
                </label>
                <select
                  value={editingPayment.paymentMethod}
                  onChange={(e) => setEditingPayment({ ...editingPayment, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white focus:border-blue-500 outline-none"
                >
                  <option value="Pix">Pix</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Lotérica">Lotérica</option>
                </select>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {['Pix', 'Boleto', 'Lotérica'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setEditingPayment({ ...editingPayment, paymentMethod: m })}
                      className={`py-1.5 px-2 rounded-lg font-bold text-xs border text-center transition-all cursor-pointer ${
                        editingPayment.paymentMethod === m
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. BANCO PAGADOR COM LOGOTIPOS / NÚMEROS E BUSCA DE IMAGEM */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800 block uppercase tracking-wide text-[11px]">
                    Banco Pagador:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetBankCodeForCustomLogo(
                        OFFICIAL_BANKS.find((b) => `${b.name} - ${b.code}` === editingPayment.payingBank)?.code || '001'
                      );
                      setShowCustomLogoModal(true);
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Buscar / Inserir Imagem do Logotipo</span>
                  </button>
                </div>

                <div className="relative">
                  <select
                    value={editingPayment.payingBank}
                    onChange={(e) => {
                      const selectedBank = OFFICIAL_BANKS.find(
                        (b) => `${b.name} - ${b.code}` === e.target.value
                      );
                      setEditingPayment({
                        ...editingPayment,
                        payingBank: e.target.value,
                        payingBankIcon: selectedBank ? customBankLogos[selectedBank.code] || '' : '',
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 bg-white focus:border-blue-500 outline-none"
                  >
                    {OFFICIAL_BANKS.map((b) => (
                      <option key={b.code} value={`${b.name} - ${b.code}`}>
                        {b.name} - {b.code}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Exibição do Ícone/Badge do Banco Selecionado */}
                {(() => {
                  const currentBank = OFFICIAL_BANKS.find(
                    (b) => `${b.name} - ${b.code}` === editingPayment.payingBank
                  );
                  return (
                    <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* Logotipo Customizado ou Badge Oficial */}
                        {editingPayment.payingBankIcon ? (
                          <img
                            src={editingPayment.payingBankIcon}
                            alt="Logo Banco"
                            className="w-6 h-6 object-contain rounded border border-slate-300 bg-white"
                            onError={(e) => {
                              (e.target as any).style.display = 'none';
                            }}
                          />
                        ) : (
                          <span
                            className={`w-6 h-6 rounded ${
                              currentBank?.bgColor || 'bg-blue-600'
                            } ${
                              currentBank?.textColor || 'text-white'
                            } font-mono font-black text-[9px] flex items-center justify-center shadow-2xs border border-black/10`}
                          >
                            {currentBank?.badge || 'BCO'}
                          </span>
                        )}
                        <span className="font-bold text-slate-800">{editingPayment.payingBank}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Rede Bancária Nacional</span>
                    </div>
                  );
                })()}
              </div>

              {/* 3. REFERÊNCIA DE IDENTIFICADOR (CAMPO RETANGULAR DE LIVRE ESCRITA) */}
              <div>
                <label className="font-bold text-slate-800 block mb-1 uppercase tracking-wide text-[11px]">
                  Referência de Identificador (Campo Livre de Escrita):
                </label>
                <textarea
                  value={editingPayment.referenceId}
                  onChange={(e) =>
                    setEditingPayment({ ...editingPayment, referenceId: e.target.value })
                  }
                  rows={2}
                  placeholder="Ex: Final do comprovante TX 94821, Terminal 02 Lotérica Centro, Autenticação Mecânica, etc."
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none font-mono"
                />
              </div>

              {/* ================= 4. GRUPO: ESTENDER PAGAMENTO ================= */}
              <fieldset className="border-2 border-slate-300 rounded-xl p-3.5 bg-slate-50/70 relative">
                <legend className="px-2 bg-white rounded border border-slate-300 shadow-2xs">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none font-bold text-xs text-slate-800">
                    <input
                      type="checkbox"
                      checked={extendPayment}
                      onChange={(e) => setExtendPayment(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Estender Pagamento</span>
                  </label>
                </legend>

                <div className="space-y-2.5 mt-0.5">
                  <label className="font-bold text-slate-800 block uppercase tracking-wide text-[11px]">
                    Período:
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                    {/* Dropdown Ano (2024 até 2050) */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Ano:</label>
                      <select
                        disabled={!extendPayment}
                        value={extendYear}
                        onChange={(e) => setExtendYear(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold bg-white text-slate-900 disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500 outline-none cursor-pointer"
                      >
                        {YEARS_2024_2050.map((y) => (
                          <option key={y} value={String(y)}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Dropdown Mês (3 letras: JAN, FEV, ...) */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Mês:</label>
                      <select
                        disabled={!extendPayment}
                        value={extendMonth}
                        onChange={(e) => setExtendMonth(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-900 disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-500 outline-none cursor-pointer"
                      >
                        {MONTHS_3_LETTERS.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Botão Aplicar */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-200 mt-2">
                    <span className="text-[10px] text-slate-500 font-medium">
                      {extendPayment
                        ? `Replicará as informações deste pagamento até ${extendMonth}/${extendYear}`
                        : 'Marque a checkbox para habilitar o período e aplicar'}
                    </span>

                    <button
                      type="button"
                      disabled={!extendPayment}
                      onClick={handleApplyExtendPayment}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Aplicar</span>
                    </button>
                  </div>

                  {extendFeedbackToast && (
                    <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs font-semibold animate-in fade-in flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{extendFeedbackToast}</span>
                    </div>
                  )}
                </div>
              </fieldset>
            </div>

            {/* Footer */}
            <div className="bg-slate-100 p-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handleClearPaymentDialog}
                className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg font-semibold transition-colors cursor-pointer"
              >
                Limpar Pagamento
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSavePaymentDialog}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-xs shadow-xs transition-all cursor-pointer"
                >
                  Confirmar Informações
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL PARA BUSCAR / INSERIR LOGO DE BANCO ================= */}
      {showCustomLogoModal && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-md p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                Inserir Logotipo do Banco
              </h4>
              <button
                onClick={() => setShowCustomLogoModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Cole o link da internet ou URL direta da imagem com o logotipo do banco para que ele apareça ao lado do nome do banco na lista:
            </p>

            <div>
              <label className="font-bold text-slate-700 block mb-1 text-xs">Link da Imagem (URL):</label>
              <input
                type="text"
                value={customLogoInput}
                onChange={(e) => setCustomLogoInput(e.target.value)}
                placeholder="https://exemplo.com/logo-banco.png"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none focus:border-blue-500"
              />
            </div>

            {customLogoInput && (
              <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
                <span className="text-xs text-slate-500 font-semibold">Pré-visualização:</span>
                <img
                  src={customLogoInput}
                  alt="Pré-visualização"
                  className="w-8 h-8 object-contain rounded border border-slate-300 bg-white"
                  onError={(e) => {
                    (e.target as any).src = 'https://placehold.co/32x32?text=Erro';
                  }}
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowCustomLogoModal(false)}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApplyCustomBankLogo}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
              >
                Salvar Logotipo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DE AVISO: ANO NÃO EXISTE NO QUADRO DE EXERCÍCIO ================= */}
      {extendYearWarning && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in zoom-in-95 duration-100">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 p-5 max-w-md w-full space-y-3 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Ano Não Encontrado no Quadro de Exercício
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              O ano escolhido (<strong>{extendYearWarning}</strong>) não existe nos quadros de <strong>ANO DE EXERCÍCIO</strong> configurados nesta Ficha ({formData.year1 || 'Ano 1'} e {formData.year2 || 'Ano 2'}).
            </p>
            <p className="text-[11px] text-slate-500">
              Para estender pagamentos para o ano {extendYearWarning}, altere primeiro o ano correspondente nos quadros da ficha antes de aplicar a extensão.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setExtendYearWarning(null)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
              >
                Entendi / Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DE AVISO / VALIDAÇÃO ================= */}
      {extendValidationWarning && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in zoom-in-95 duration-100">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-300 p-5 max-w-sm w-full space-y-3 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Atenção
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {extendValidationWarning}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setExtendValidationWarning(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL CALCULADORA (CALC) E HISTÓRICO DO ASSOCIADO ================= */}
      {showCalcModal && (
        <AcertoCalculatorModal
          isOpen={showCalcModal}
          onClose={() => setShowCalcModal(false)}
          associateName={formData.name}
          associateId={formData.id}
          savedRecords={formData.calculationHistory || []}
          onSaveCalculationRecord={(rec) => {
            const updated = [rec, ...(formData.calculationHistory || [])];
            setFormData({ ...formData, calculationHistory: updated });
          }}
          onApplyToPayment={(rec) => {
            const updated = [rec, ...(formData.calculationHistory || [])];
            const summaryStr = `Acerto (${rec.startDate} a ${rec.endDate}, ${rec.totalMonths}m) - R$ ${rec.totalGeral.toFixed(2).replace('.', ',')}`;
            setFormData({ ...formData, calculationHistory: updated });
            if (editingPayment) {
              setEditingPayment({
                ...editingPayment,
                referenceId: editingPayment.referenceId ? `${editingPayment.referenceId} | ${summaryStr}` : summaryStr,
              });
            }
            setShowCalcModal(false);
          }}
        />
      )}
    </div>
  );
};
