import React, { useState, useRef } from 'react';
import { CalculationRecord } from '../../types';
import { executePrint } from '../../utils/printHelper';
import {
  Calculator,
  Calendar,
  FileText,
  Printer,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle2,
  History,
  ArrowRight,
  BookmarkPlus,
  Clock,
  User
} from 'lucide-react';

interface AcertoCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  associateName?: string;
  associateId?: string;
  savedRecords?: CalculationRecord[];
  onSaveCalculationRecord?: (record: CalculationRecord) => void;
  onApplyToPayment?: (record: CalculationRecord) => void;
  showHistoryTab?: boolean;
}

// Utilitário para formatar digitação contínua (ex: "15012026" -> "15/01/2026")
export const formatContinuousDate = (raw: string): string => {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.length === 8) {
    const day = digits.substring(0, 2);
    const month = digits.substring(2, 4);
    const year = digits.substring(4, 8);
    return `${day}/${month}/${year}`;
  } else if (digits.length === 6) {
    const day = digits.substring(0, 2);
    const month = digits.substring(2, 4);
    const year = `20${digits.substring(4, 6)}`;
    return `${day}/${month}/${year}`;
  }
  
  // Se já tiver barras ou formato parcial
  if (raw.includes('/')) {
    const parts = raw.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      let y = parts[2];
      if (y.length === 2) y = `20${y}`;
      if (y.length === 4) return `${d}/${m}/${y}`;
    }
  }

  return raw;
};

// Converte YYYY-MM-DD do input de calendário nativo para DD/MM/YYYY
export const isoToBrazilianDate = (isoDate: string): string => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
};

// Converte DD/MM/YYYY para YYYY-MM-DD para o date picker nativo
export const brazilianToIsoDate = (brDate: string): string => {
  const parts = brDate.split('/');
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return '';
};

// Calcula a diferença em meses inclusiva (ex: Jan até Out = 10 meses)
export const calculateMonthsInclusive = (startDateStr: string, endDateStr: string): number => {
  const sParts = startDateStr.trim().split('/');
  const eParts = endDateStr.trim().split('/');

  if (sParts.length !== 3 || eParts.length !== 3) return 0;

  const sMonth = parseInt(sParts[1], 10);
  const sYear = parseInt(sParts[2], 10);

  const eMonth = parseInt(eParts[1], 10);
  const eYear = parseInt(eParts[2], 10);

  if (isNaN(sMonth) || isNaN(sYear) || isNaN(eMonth) || isNaN(eYear)) return 0;
  if (sMonth < 1 || sMonth > 12 || eMonth < 1 || eMonth > 12) return 0;

  const diff = (eYear - sYear) * 12 + (eMonth - sMonth) + 1;
  return diff > 0 ? diff : 0;
};

export const AcertoCalculatorModal: React.FC<AcertoCalculatorModalProps> = ({
  isOpen,
  onClose,
  associateName,
  associateId,
  savedRecords = [],
  onSaveCalculationRecord,
  onApplyToPayment,
  showHistoryTab = true,
}) => {
  // Aba ativa: CALCULADORA ou HISTORICO (sempre CALCULADORA se showHistoryTab for false)
  const [activeTab, setActiveTab] = useState<'CALCULADORA' | 'HISTORICO'>('CALCULADORA');

  // Intervalo Período
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Valor Mensalidade checkboxes
  const [checkedMensalidade10, setCheckedMensalidade10] = useState(false);
  const [checkedMensalidade20, setCheckedMensalidade20] = useState(false);

  // Inscrição checkboxes
  const [checkedInscIndividual, setCheckedInscIndividual] = useState(false);
  const [checkedInscFamiliar, setCheckedInscFamiliar] = useState(false);

  // Carteirinha (1ª Via)
  const [checkedCarteirinha, setCheckedCarteirinha] = useState(false);
  const [qtyCarteirinha, setQtyCarteirinha] = useState<number>(1);

  // 2ª Carteirinha
  const [checkedSegundaCarteirinha, setCheckedSegundaCarteirinha] = useState(false);
  const [qtySegundaCarteirinha, setQtySegundaCarteirinha] = useState<number>(1);

  // Estado do Resultado e Modais Secundários
  const [showResult, setShowResult] = useState(false);
  const [showMemoriaModal, setShowMemoriaModal] = useState(false);
  const [showCloseWarning, setShowCloseWarning] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Registro histórico selecionado para visualização detalhada
  const [selectedHistoricalRecord, setSelectedHistoricalRecord] = useState<CalculationRecord | null>(null);

  // Refs para date pickers nativos ocultos
  const startDatePickerRef = useRef<HTMLInputElement>(null);
  const endDatePickerRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Cálculos dinâmicos
  const totalMonths = calculateMonthsInclusive(startDate, endDate);

  // 1. Mensalidade (só entra o que estiver marcado)
  const monthlyRateSelected = 
    (checkedMensalidade10 ? 10 : 0) + 
    (checkedMensalidade20 ? 20 : 0);
  const subtotalMensalidades = totalMonths * monthlyRateSelected;

  // 2. Inscrição (só entra o que estiver marcado)
  const subtotalInscricao = 
    (checkedInscIndividual ? 25 : 0) + 
    (checkedInscFamiliar ? 65 : 0);

  // 3. Carteirinha (só entra o que estiver marcado)
  const subtotalCarteirinha = checkedCarteirinha ? 5 * qtyCarteirinha : 0;

  // 4. 2ª Carteirinha (só entra o que estiver marcado)
  const subtotalSegundaCarteirinha = checkedSegundaCarteirinha ? 15 * qtySegundaCarteirinha : 0;

  // Total Geral
  const totalGeral = subtotalMensalidades + subtotalInscricao + subtotalCarteirinha + subtotalSegundaCarteirinha;

  // Formatação de moeda BRL
  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Construir objeto do registro atual
  const buildCurrentRecord = (): CalculationRecord => {
    const summaryItems: string[] = [];
    if (monthlyRateSelected > 0) summaryItems.push(`Mensalidade ${totalMonths}x R$ ${monthlyRateSelected},00`);
    if (checkedInscIndividual) summaryItems.push('Inscrição Individual');
    if (checkedInscFamiliar) summaryItems.push('Inscrição Familiar');
    if (checkedCarteirinha) summaryItems.push(`1ª Carteirinha (${qtyCarteirinha}x)`);
    if (checkedSegundaCarteirinha) summaryItems.push(`2ª Carteirinha (${qtySegundaCarteirinha}x)`);

    return {
      id: `calc-${Date.now()}`,
      timestamp: new Date().toISOString(),
      associateId,
      associateName,
      startDate: startDate || 'Não informada',
      endDate: endDate || 'Não informada',
      totalMonths,
      monthlyRateSelected,
      subtotalMensalidades,
      subtotalInscricao,
      subtotalCarteirinha,
      qtyCarteirinha,
      subtotalSegundaCarteirinha,
      qtySegundaCarteirinha,
      totalGeral,
      summary: summaryItems.join(', ') || 'Nenhum item marcado',
    };
  };

  // Salvar no histórico
  const handleSaveToHistory = () => {
    const record = buildCurrentRecord();
    if (onSaveCalculationRecord) {
      onSaveCalculationRecord(record);
      setToastMessage('Cálculo gravado com sucesso no Histórico do Associado!');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Aplicar no pagamento
  const handleApplyPayment = () => {
    const record = buildCurrentRecord();
    if (onApplyToPayment) {
      onApplyToPayment(record);
    }
  };

  // Limpar todos os campos
  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setCheckedMensalidade10(false);
    setCheckedMensalidade20(false);
    setCheckedInscIndividual(false);
    setCheckedInscFamiliar(false);
    setCheckedCarteirinha(false);
    setQtyCarteirinha(1);
    setCheckedSegundaCarteirinha(false);
    setQtySegundaCarteirinha(1);
    setShowResult(false);
  };

  // Tentar fechar com alerta
  const handleRequestClose = () => {
    setShowCloseWarning(true);
  };

  const handleConfirmClose = () => {
    setShowCloseWarning(false);
    handleClear();
    onClose();
  };

  // Registro a ser exibido na Memória de Cálculo (o histórico selecionado ou o cálculo atual em andamento)
  const currentOrSelectedRecord = selectedHistoricalRecord || buildCurrentRecord();

  return (
    <div className="calculator-main-modal fixed inset-0 z-70 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* ================= CABEÇALHO DO MODAL ================= */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/90 text-white flex items-center justify-center shadow-xs">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Cálculos de Pagamento de Acerto do Associado
                </h2>
              </div>
              <p className="text-[11px] text-slate-400">
                {associateName ? (
                  <span className="text-emerald-300 font-semibold flex items-center gap-1">
                    <User className="w-3 h-3 inline" /> Associado: {associateName}
                  </span>
                ) : (
                  'Apuração de débitos, mensalidades, taxas de inscrição e carteirinhas'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleRequestClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Fechar Calculadora"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas: Calculadora / Histórico do Associado (Eliminada quando showHistoryTab === false) */}
        {showHistoryTab ? (
          <div className="bg-slate-800/95 px-5 py-1.5 flex items-center justify-between border-b border-slate-700 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('CALCULADORA')}
                className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'CALCULADORA'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Calculadora</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('HISTORICO')}
                className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'HISTORICO'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Histórico de Acertos ({savedRecords.length})</span>
              </button>
            </div>

            {toastMessage && (
              <span className="text-[11px] text-emerald-400 font-semibold animate-pulse flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {toastMessage}
              </span>
            )}
          </div>
        ) : toastMessage ? (
          <div className="bg-slate-800 px-5 py-1.5 flex items-center justify-end border-b border-slate-700 text-xs">
            <span className="text-[11px] text-emerald-400 font-semibold animate-pulse flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {toastMessage}
            </span>
          </div>
        ) : null}

        {/* ================= CORPO DO FORMULÁRIO COM SCROLL ================= */}
        {activeTab === 'CALCULADORA' || !showHistoryTab ? (
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* 1. GRUPO: INTERVALO PERÍODO (Linha envoltória delimitando) */}
            <fieldset className="border-2 border-slate-300 rounded-xl p-3.5 bg-slate-50/50 relative">
              <legend className="text-xs font-bold text-slate-800 px-2 uppercase tracking-wider bg-white rounded border border-slate-300 shadow-2xs">
                Intervalo Período
              </legend>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                {/* Subcampo 1: Data Inicial */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data Inicial:
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      onBlur={() => setStartDate((prev) => formatContinuousDate(prev))}
                      placeholder="Ex: 15012026"
                      className="w-full pl-3 pr-9 py-2 text-xs font-mono font-bold text-black text-slate-950 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          startDatePickerRef.current?.showPicker();
                        } catch {
                          startDatePickerRef.current?.click();
                        }
                      }}
                      className="absolute right-2 text-slate-400 hover:text-blue-600 p-1 transition-colors"
                      title="Selecionar Data Inicial no Calendário"
                    >
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </button>
                    <input
                      ref={startDatePickerRef}
                      type="date"
                      value={brazilianToIsoDate(startDate)}
                      onChange={(e) => setStartDate(isoToBrazilianDate(e.target.value))}
                      className="sr-only"
                      tabIndex={-1}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Digite contínuo ou use o calendário
                  </span>
                </div>

                {/* Subcampo 2: Data Final */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data Final:
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      onBlur={() => setEndDate((prev) => formatContinuousDate(prev))}
                      placeholder="Ex: 15102026"
                      className="w-full pl-3 pr-9 py-2 text-xs font-mono font-bold text-black text-slate-950 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          endDatePickerRef.current?.showPicker();
                        } catch {
                          endDatePickerRef.current?.click();
                        }
                      }}
                      className="absolute right-2 text-slate-400 hover:text-blue-600 p-1 transition-colors"
                      title="Selecionar Data Final no Calendário"
                    >
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </button>
                    <input
                      ref={endDatePickerRef}
                      type="date"
                      value={brazilianToIsoDate(endDate)}
                      onChange={(e) => setEndDate(isoToBrazilianDate(e.target.value))}
                      className="sr-only"
                      tabIndex={-1}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Digite contínuo ou use o calendário
                  </span>
                </div>
              </div>

              {/* Demonstrativo em tempo real do intervalo apurado em meses */}
              <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Contagem de Meses Inclusiva:</span>
                <span className="font-mono font-bold text-blue-900 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded text-xs">
                  {totalMonths} {totalMonths === 1 ? 'mês' : 'meses'}
                </span>
              </div>
            </fieldset>

            {/* 2. CAMPO: VALOR MENSALIDADE */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Valor Mensalidade:
                </label>
                <span className="text-[10px] text-slate-500 font-medium">
                  (Multiplicado por {totalMonths} meses)
                </span>
              </div>

              <div className="flex items-center gap-6 pt-1">
                {/* Checkbox R$ 10,00 */}
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checkedMensalidade10}
                    onChange={(e) => setCheckedMensalidade10(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    R$ 10,00
                  </span>
                </label>

                {/* Checkbox R$ 20,00 */}
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checkedMensalidade20}
                    onChange={(e) => setCheckedMensalidade20(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    R$ 20,00
                  </span>
                </label>

                {monthlyRateSelected > 0 && totalMonths > 0 && (
                  <span className="ml-auto text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Subtotal: {formatBRL(subtotalMensalidades)}
                  </span>
                )}
              </div>
            </div>

            {/* 3. CAMPO: INSCRIÇÃO */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                Inscrição:
              </label>

              <div className="flex items-center gap-6 pt-1">
                {/* Checkbox Individual R$ 25,00 */}
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checkedInscIndividual}
                    onChange={(e) => setCheckedInscIndividual(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Individual (R$ 25,00)
                  </span>
                </label>

                {/* Checkbox Familiar R$ 65,00 */}
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={checkedInscFamiliar}
                    onChange={(e) => setCheckedInscFamiliar(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    Familiar (R$ 65,00)
                  </span>
                </label>

                {subtotalInscricao > 0 && (
                  <span className="ml-auto text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    Subtotal: {formatBRL(subtotalInscricao)}
                  </span>
                )}
              </div>
            </div>

            {/* 4. CAMPO: CARTEIRINHA */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Carteirinha:
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer select-none ml-2">
                  <input
                    type="checkbox"
                    checked={checkedCarteirinha}
                    onChange={(e) => setCheckedCarteirinha(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    R$ 5,00
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Qtd:</span>
                <select
                  value={qtyCarteirinha}
                  onChange={(e) => setQtyCarteirinha(Number(e.target.value))}
                  className="px-2.5 py-1 text-xs font-bold font-mono text-black text-slate-950 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num} className="text-black text-slate-950 font-bold">
                      {num}x
                    </option>
                  ))}
                </select>
                {checkedCarteirinha && (
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {formatBRL(subtotalCarteirinha)}
                  </span>
                )}
              </div>
            </div>

            {/* 5. CAMPO: 2ª CARTEIRINHA */}
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  2ª Carteirinha:
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer select-none ml-2">
                  <input
                    type="checkbox"
                    checked={checkedSegundaCarteirinha}
                    onChange={(e) => setCheckedSegundaCarteirinha(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    R$ 15,00
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Qtd:</span>
                <select
                  value={qtySegundaCarteirinha}
                  onChange={(e) => setQtySegundaCarteirinha(Number(e.target.value))}
                  className="px-2.5 py-1 text-xs font-bold font-mono text-black text-slate-950 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num} className="text-black text-slate-950 font-bold">
                      {num}x
                    </option>
                  ))}
                </select>
                {checkedSegundaCarteirinha && (
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {formatBRL(subtotalSegundaCarteirinha)}
                  </span>
                )}
              </div>
            </div>

            {/* ÁREA DE EXIBIÇÃO DO RESULTADO (FONTE TAMANHO 24, EM NEGRITO) */}
            {showResult && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400 rounded-xl p-4 text-center shadow-xs animate-in zoom-in-95 duration-150">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Valor Total do Acerto Calculado
                </div>
                <div className="text-[24px] font-bold text-emerald-950 font-mono tracking-tight leading-none mt-1">
                  {formatBRL(totalGeral)}
                </div>
                <p className="text-[11px] text-emerald-700 font-medium mt-1.5">
                  {totalMonths} meses apurados • Somente opções marcadas consideradas
                </p>

                {/* Ações Rápidas no Resultado */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-3 pt-2 border-t border-emerald-200">
                  {onSaveCalculationRecord && (
                    <button
                      type="button"
                      onClick={handleSaveToHistory}
                      className="px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-300 transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Gravar no Histórico do Associado</span>
                    </button>
                  )}

                  {onApplyToPayment && (
                    <button
                      type="button"
                      onClick={handleApplyPayment}
                      className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Aplicar neste Pagamento</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Aviso informativo de regra */}
            <div className="text-[10px] text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200 text-center font-medium">
              ATENÇÃO! SÓ ENTRARÃO NOS CÁLCULOS AS CHECKBOX QUE ESTIVEREM MARCADAS!
            </div>
          </div>
        ) : (
          /* ================= ABA: HISTÓRICO DE ACERTOS DO ASSOCIADO ================= */
          <div className="p-5 space-y-3 overflow-y-auto flex-1">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Histórico de Cálculos e Eventos de Pagamento
                </h3>
                <p className="text-[11px] text-slate-500">
                  Registros cronológicos das memórias de cálculo deste associado
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                {savedRecords.length} {savedRecords.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>

            {savedRecords.length === 0 ? (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <History className="w-10 h-10 mx-auto opacity-40 text-slate-400" />
                <p className="text-xs font-semibold text-slate-600">
                  Nenhum histórico de cálculo gravado ainda para este associado.
                </p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Faça os cálculos na aba <strong>Calculadora</strong> e clique em <em>Gravar no Histórico</em> ou <em>Aplicar neste Pagamento</em> para consultar as memórias de cálculo a qualquer momento.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {savedRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-colors shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>
                          {new Date(rec.timestamp).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(rec.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <span className="text-sm font-bold font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                        {formatBRL(rec.totalGeral)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700">
                      <div>
                        <strong>Período:</strong> {rec.startDate} até {rec.endDate} ({rec.totalMonths} {rec.totalMonths === 1 ? 'mês' : 'meses'})
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        <strong>Composição:</strong> {rec.summary}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedHistoricalRecord(rec);
                          setShowMemoriaModal(true);
                        }}
                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Ver Memória de Cálculo</span>
                      </button>

                      {onApplyToPayment && (
                        <button
                          type="button"
                          onClick={() => {
                            onApplyToPayment(rec);
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowRight className="w-3 h-3" />
                          <span>Aplicar no Pagamento</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= BARRA DE AÇÕES INFERIOR ================= */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {/* Botão Resultado */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('CALCULADORA');
                setShowResult(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              <span>Resultado</span>
            </button>

            {/* Botão Memória de Cálculo */}
            <button
              type="button"
              onClick={() => {
                setSelectedHistoricalRecord(null);
                setShowMemoriaModal(true);
              }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Memória de Cálculo</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão Limpar Campos */}
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Limpar Campos</span>
            </button>

            {/* Botão Fechar */}
            <button
              type="button"
              onClick={handleRequestClose}
              className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODAL SECUNDÁRIO: MEMÓRIA DE CÁLCULO ================= */}
      {showMemoriaModal && (
        <div className="memoria-modal-overlay fixed inset-0 z-80 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="memoria-modal-card bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header da Memória */}
            <div className="bg-blue-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-blue-950 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-300" />
                <h3 className="text-sm font-bold tracking-tight">
                  Memória de Cálculo • Demonstrativo Passo a Passo
                </h3>
              </div>
              <button
                onClick={() => setShowMemoriaModal(false)}
                className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-blue-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo Imprimível da Memória */}
            <div id="memoria-de-calculo-print-area" className="p-6 overflow-y-auto flex-1 space-y-4 font-sans text-xs">
              <div className="border-b border-slate-300 pb-3 text-center">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Prefeitura Municipal de Pouso Alegre - MG
                </h2>
                <h3 className="text-xs font-semibold text-slate-700">
                  Praça de Esportes Pref. Alvarim Vieira Rios • SISCOP
                </h3>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  Demonstrativo de Apuração de Valores de Acerto • Emissão:{' '}
                  {new Date(currentOrSelectedRecord.timestamp).toLocaleDateString('pt-BR')} às{' '}
                  {new Date(currentOrSelectedRecord.timestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {associateName && (
                  <div className="mt-2 text-center">
                    <span className="inline-block bg-slate-100 text-slate-900 font-bold px-3 py-1 rounded-md text-xs border border-slate-300">
                      Associado: {associateName}
                    </span>
                  </div>
                )}
              </div>

              {/* Passo 1: Intervalo */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="font-bold text-slate-900 text-xs flex items-center justify-between mb-1.5">
                  <span>1. INTERVALO DE PERÍODO (MESES)</span>
                  <span className="font-mono text-blue-900 bg-blue-100 px-2 py-0.5 rounded text-[11px]">
                    {currentOrSelectedRecord.totalMonths}{' '}
                    {currentOrSelectedRecord.totalMonths === 1 ? 'mês' : 'meses'}
                  </span>
                </div>
                <div className="text-slate-700 space-y-1 font-mono text-[11px]">
                  <div>
                    • Data Inicial: <strong className="text-slate-900">{currentOrSelectedRecord.startDate}</strong>
                  </div>
                  <div>
                    • Data Final: <strong className="text-slate-900">{currentOrSelectedRecord.endDate}</strong>
                  </div>
                  <div className="text-slate-500 text-[10px] font-sans">
                    * Contagem inclusiva do primeiro mês até o último mês apurado.
                  </div>
                </div>
              </div>

              {/* Passo 2: Mensalidades */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="font-bold text-slate-900 text-xs flex items-center justify-between mb-1.5">
                  <span>2. VALOR DA MENSALIDADE</span>
                  <span className="font-mono text-slate-900">
                    {formatBRL(currentOrSelectedRecord.subtotalMensalidades)}
                  </span>
                </div>
                <div className="space-y-1 text-slate-700 font-mono text-[11px]">
                  <div>
                    • Taxa Mensal: {formatBRL(currentOrSelectedRecord.monthlyRateSelected)} x {currentOrSelectedRecord.totalMonths} meses ={' '}
                    <strong className="text-slate-900">{formatBRL(currentOrSelectedRecord.subtotalMensalidades)}</strong>
                  </div>
                </div>
              </div>

              {/* Passo 3: Inscrição */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="font-bold text-slate-900 text-xs flex items-center justify-between mb-1.5">
                  <span>3. TAXA DE INSCRIÇÃO</span>
                  <span className="font-mono text-slate-900">
                    {formatBRL(currentOrSelectedRecord.subtotalInscricao)}
                  </span>
                </div>
                <div className="space-y-1 text-slate-700 font-mono text-[11px]">
                  <div>
                    • Valor apurado de inscrição:{' '}
                    <strong className="text-slate-900">{formatBRL(currentOrSelectedRecord.subtotalInscricao)}</strong>
                  </div>
                </div>
              </div>

              {/* Passo 4: Carteirinha */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="font-bold text-slate-900 text-xs flex items-center justify-between mb-1.5">
                  <span>4. CARTEIRINHA (1ª VIA)</span>
                  <span className="font-mono text-slate-900">
                    {formatBRL(currentOrSelectedRecord.subtotalCarteirinha)}
                  </span>
                </div>
                <div className="text-slate-700 font-mono text-[11px]">
                  {currentOrSelectedRecord.subtotalCarteirinha > 0 ? (
                    <span className="text-emerald-700 font-bold">
                      {currentOrSelectedRecord.qtyCarteirinha || 1}x R$ 5,00 ={' '}
                      {formatBRL(currentOrSelectedRecord.subtotalCarteirinha)}
                    </span>
                  ) : (
                    <span className="text-slate-400">R$ 0,00</span>
                  )}
                </div>
              </div>

              {/* Passo 5: 2ª Carteirinha */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="font-bold text-slate-900 text-xs flex items-center justify-between mb-1.5">
                  <span>5. 2ª CARTEIRINHA</span>
                  <span className="font-mono text-slate-900">
                    {formatBRL(currentOrSelectedRecord.subtotalSegundaCarteirinha)}
                  </span>
                </div>
                <div className="text-slate-700 font-mono text-[11px]">
                  {currentOrSelectedRecord.subtotalSegundaCarteirinha > 0 ? (
                    <span className="text-emerald-700 font-bold">
                      {currentOrSelectedRecord.qtySegundaCarteirinha || 1}x R$ 15,00 ={' '}
                      {formatBRL(currentOrSelectedRecord.subtotalSegundaCarteirinha)}
                    </span>
                  ) : (
                    <span className="text-slate-400">R$ 0,00</span>
                  )}
                </div>
              </div>

              {/* Resumo Final Total */}
              <div className="border-t-2 border-slate-800 pt-3 flex items-baseline justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    VALOR TOTAL FINAL APURADO:
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Soma de todos os subtotais devidamente selecionados
                  </div>
                </div>
                <div className="text-xl font-bold font-mono text-slate-950">
                  {formatBRL(currentOrSelectedRecord.totalGeral)}
                </div>
              </div>
            </div>

            {/* Botões da Janela de Memória de Cálculo: Fechar e Imprimir */}
            <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between gap-2 shrink-0">
              <div>
                {!selectedHistoricalRecord && onSaveCalculationRecord && (
                  <button
                    type="button"
                    onClick={handleSaveToHistory}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Gravar no Histórico</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    executePrint({
                      orientation: 'portrait',
                      bodyClass: 'printing-memoria-calculo',
                      pageMargin: '8mm',
                    });
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowMemoriaModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ALERTA DE CONFIRMAÇÃO PARA FECHAR ================= */}
      {showCloseWarning && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in zoom-in-95 duration-100">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 p-5 max-w-sm w-full text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              Atenção: todos os cálculos serão perdidos!
            </h4>
            <p className="text-xs text-slate-600">
              Deseja realmente fechar a janela da calculadora de acerto? Todas as datas, seleções e valores calculados serão limpos.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCloseWarning(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Sim, Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
