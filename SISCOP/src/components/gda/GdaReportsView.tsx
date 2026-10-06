import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { CardData, CategoryType } from '../../types';
import { BrasaoPousoAlegre } from '../common/BrasaoPousoAlegre';
import { executePrint } from '../../utils/printHelper';
import {
  Printer,
  Calendar,
  Filter,
  FileText,
  Download,
  Users,
  CreditCard,
  Sparkles,
} from 'lucide-react';

type FilterModalidade = 'DIARIO' | 'SEMANAL' | 'MENSAL' | 'ANUAL';
type FilterCategoria = 'TODOS' | CategoryType;

const MONTH_NAMES_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MONTH_NAMES_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const GdaReportsView: React.FC = () => {
  const { cards, layoutConfig } = useApp();

  // Filters state
  const [modalidade, setModalidade] = useState<FilterModalidade>('MENSAL');
  const [categoria, setCategoria] = useState<FilterCategoria>('TODOS');
  
  // Date selection states
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState<string>(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  );

  // Snapshot generation timestamp
  const [generatedAt] = useState<Date>(() => new Date());

  // Helper to parse card date
  const getCardDate = (card: CardData): Date => {
    if (card.emissionDate) {
      const parts = card.emissionDate.split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        const dt = new Date(y, m, d);
        if (!isNaN(dt.getTime())) return dt;
      }
      const dt = new Date(card.emissionDate);
      if (!isNaN(dt.getTime())) return dt;
    }
    if (card.createdAt) {
      const dt = new Date(card.createdAt);
      if (!isNaN(dt.getTime())) return dt;
    }
    return new Date(2026, 9, 8); // fallback: 08 Out 2026
  };

  // Filter cards based on modalidade, date and categoria
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // 1. Category filter
      if (categoria !== 'TODOS') {
        if (categoria === 'PLANO_FAMILIAR' && card.category !== 'PLANO_FAMILIAR' && card.planType !== 'FAMILIAR') {
          return false;
        }
        if (categoria === 'PLANO_INDIVIDUAL' && card.category !== 'PLANO_INDIVIDUAL' && card.planType !== 'INDIVIDUAL') {
          return false;
        }
        if (categoria === 'PLANO_ESPECIAL' && card.category !== 'PLANO_ESPECIAL') {
          return false;
        }
        if (categoria === 'PREFEITURA' && card.category !== 'PREFEITURA') {
          return false;
        }
        if (categoria === 'BOMBEIROS' && card.category !== 'BOMBEIROS') {
          return false;
        }
      }

      // 2. Date / Modalidade filter
      const cardDate = getCardDate(card);

      if (modalidade === 'DIARIO') {
        if (!selectedDate) return true;
        const [selY, selM, selD] = selectedDate.split('-').map(Number);
        return (
          cardDate.getFullYear() === selY &&
          cardDate.getMonth() === selM - 1 &&
          cardDate.getDate() === selD
        );
      }

      if (modalidade === 'SEMANAL') {
        // Last 7 days from selected date (or within current week)
        const target = selectedDate ? new Date(selectedDate) : new Date();
        const diffDays = Math.abs((target.getTime() - cardDate.getTime()) / (1000 * 3600 * 24));
        return diffDays <= 7 && cardDate.getFullYear() === target.getFullYear();
      }

      if (modalidade === 'MENSAL') {
        return (
          cardDate.getFullYear() === selectedYear &&
          cardDate.getMonth() === selectedMonth
        );
      }

      if (modalidade === 'ANUAL') {
        return cardDate.getFullYear() === selectedYear;
      }

      return true;
    });
  }, [cards, modalidade, categoria, selectedYear, selectedMonth, selectedDate]);

  // Group filtered cards by formatted date (e.g. "08 Out")
  const groupedByDate = useMemo(() => {
    const groups: {
      dateKey: string;
      dateLabel: string;
      dateObj: Date;
      familyCards: { titular: CardData; dependents: CardData[] }[];
      individualCards: CardData[];
      specialCards: CardData[];
      otherCards: CardData[];
    }[] = [];

    // Map to keep track of processed family cards
    const processedFamilyIds = new Set<string>();

    filteredCards.forEach((card) => {
      const d = getCardDate(card);
      const day = String(d.getDate()).padStart(2, '0');
      const monthShort = MONTH_NAMES_SHORT[d.getMonth()] || 'Out';
      const dateLabel = `${day} ${monthShort}`;
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${day}`;

      let group = groups.find((g) => g.dateKey === dateKey);
      if (!group) {
        group = {
          dateKey,
          dateLabel,
          dateObj: d,
          familyCards: [],
          individualCards: [],
          specialCards: [],
          otherCards: [],
        };
        groups.push(group);
      }

      const isFam = card.category === 'PLANO_FAMILIAR' || card.planType === 'FAMILIAR';
      const isEsp = card.category === 'PLANO_ESPECIAL' || card.planType === 'ESPECIAL';
      const isInd = !isFam && !isEsp && (card.category === 'PLANO_INDIVIDUAL' || card.planType === 'INDIVIDUAL');

      if (isFam) {
        // Check if we already grouped this family
        const titularId = card.isTitular ? card.id : card.familyHeadId || card.id;
        if (!processedFamilyIds.has(titularId)) {
          processedFamilyIds.add(titularId);
          const titular = cards.find((c) => c.id === titularId) || card;
          const dependents = cards.filter((c) => c.familyHeadId === titularId);
          group.familyCards.push({ titular, dependents });
        }
      } else if (isInd) {
        group.individualCards.push(card);
      } else if (isEsp) {
        group.specialCards.push(card);
      } else {
        group.otherCards.push(card);
      }
    });

    // Sort groups descending by date
    return groups.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
  }, [filteredCards, cards]);

  // Modalidade label for the title
  const modalidadeTitleLabel = useMemo(() => {
    switch (modalidade) {
      case 'DIARIO':
        return 'DIÁRIO';
      case 'SEMANAL':
        return 'SEMANAL';
      case 'MENSAL':
        return 'MENSAL';
      case 'ANUAL':
        return 'ANUAL';
    }
  }, [modalidade]);

  // Handler for direct browser print
  const handlePrint = () => {
    executePrint({
      orientation: 'portrait',
      bodyClass: 'printing-gda-report',
      pageMargin: '0',
    });
  };

  const formattedGenerationDate = generatedAt.toLocaleDateString('pt-BR');
  const formattedGenerationTime = generatedAt.toLocaleTimeString('pt-BR');

  // Render the report sheet component
  const renderReportSheet = () => {
    return (
      <div className="w-[196mm] min-h-[283mm] bg-white text-black p-8 sm:p-10 border-2 border-black flex flex-col justify-between shadow-2xl relative box-border mx-auto font-sans">
        {/* Top Header */}
        <div>
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            {/* Left: Brasão */}
            <div className="flex items-center gap-3">
              {layoutConfig.customCoatOfArmsUrl ? (
                <img
                  src={layoutConfig.customCoatOfArmsUrl}
                  alt="Brasão Prefeitura"
                  className="w-14 h-14 object-contain"
                />
              ) : (
                <BrasaoPousoAlegre size={54} />
              )}
            </div>

            {/* Center: Total Pages */}
            <div className="text-center">
              <span className="text-xs font-bold tracking-widest uppercase font-mono text-black">
                1 de 1
              </span>
            </div>

            {/* Right: SISCOP */}
            <div className="text-right">
              <div className="font-bold text-base tracking-wider uppercase text-black leading-tight">
                SISCOP
              </div>
              <div className="text-[10px] text-black tracking-normal leading-tight font-medium">
                Sistema de Controle Operacional
              </div>
            </div>
          </div>

          {/* Central Title */}
          <div className="text-center my-6">
            <h1 className="text-base sm:text-lg font-bold uppercase tracking-wide text-black">
              RELATÓRIO DE EMISSÃO DE CARTEIRINHAS - 2026 ({modalidadeTitleLabel})
            </h1>
            {categoria !== 'TODOS' && (
              <p className="text-xs font-semibold text-black mt-1 uppercase">
                Filtro de Categoria: {categoria.replace('_', ' ')}
              </p>
            )}
          </div>

          {/* Report Body / Groups */}
          <div className="space-y-6">
            {groupedByDate.length === 0 ? (
              <div className="py-12 text-center text-sm font-medium text-slate-700 italic border border-dashed border-slate-300 rounded-lg">
                Nenhuma carteirinha emitida encontrada para os filtros selecionados ({modalidadeTitleLabel}).
              </div>
            ) : (
              groupedByDate.map((group) => (
                <div key={group.dateKey} className="space-y-3">
                  {/* Date Header: "08 Out" in font size 26 bold + Continuous Line */}
                  <div className="flex items-center gap-3 pt-2">
                    <span className="text-[26px] font-bold text-black tracking-tight leading-none shrink-0 font-sans">
                      {group.dateLabel}
                    </span>
                    <div className="flex-1 h-[2px] bg-black" />
                  </div>

                  {/* PLANO FAMILIAR */}
                  {group.familyCards.length > 0 && (
                    <div className="pl-1 pt-1 space-y-3">
                      <div className="font-bold text-xs uppercase tracking-wider text-black">
                        PLANO FAMILIAR:
                      </div>

                      <div className="space-y-3">
                        {group.familyCards.map(({ titular, dependents }) => {
                          const depNames = dependents.map((d) => d.name).filter(Boolean);
                          return (
                            <div key={titular.id} className="space-y-0.5">
                              {/* 4882 - Silvio Santos */}
                              <div className="font-bold text-sm text-black tracking-tight font-mono">
                                {titular.controlNumber} - {titular.name}
                              </div>
                              {/* Marlene Matos / João Guilherme / Antônio Francisco */}
                              {depNames.length > 0 && (
                                <div className="text-xs text-black font-medium pl-0.5 leading-snug">
                                  {depNames.join(' / ')}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* PLANO INDIVIDUAL */}
                  {group.individualCards.length > 0 && (
                    <div className="pl-1 pt-2 space-y-2">
                      <div className="font-bold text-xs uppercase tracking-wider text-black">
                        PLANO INDIVIDUAL:
                      </div>

                      <div className="space-y-1.5">
                        {group.individualCards.map((card) => (
                          <div key={card.id} className="font-bold text-sm text-black tracking-tight font-mono">
                            {card.controlNumber} - {card.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PLANO ESPECIAL */}
                  {group.specialCards.length > 0 && (
                    <div className="pl-1 pt-2 space-y-2">
                      <div className="font-bold text-xs uppercase tracking-wider text-black">
                        PLANO ESPECIAL (ISENTO):
                      </div>

                      <div className="space-y-1.5">
                        {group.specialCards.map((card) => (
                          <div key={card.id} className="font-bold text-sm text-black tracking-tight font-mono">
                            {card.controlNumber} - {card.name} {card.specialCondition ? `(${card.specialCondition})` : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* OUTROS CONVÊNIOS (PREFEITURA / BOMBEIROS) */}
                  {group.otherCards.length > 0 && (
                    <div className="pl-1 pt-2 space-y-2">
                      <div className="font-bold text-xs uppercase tracking-wider text-black">
                        CONVÊNIOS (PREFEITURA / BOMBEIROS):
                      </div>

                      <div className="space-y-1.5">
                        {group.otherCards.map((card) => (
                          <div key={card.id} className="font-bold text-sm text-black tracking-tight font-mono">
                            {card.controlNumber} - {card.name} ({card.category})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Footer: Data e Horário ao centro */}
        <div className="pt-6 mt-8 border-t border-black text-center text-xs font-mono text-black">
          Relatório gerado em {formattedGenerationDate} às {formattedGenerationTime}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-112px)] overflow-hidden bg-slate-100">
      {/* ================= CONTROLS & FILTERS BAR ================= */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 shrink-0 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Modalidade Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase px-2">Modalidade:</span>
            {(['DIARIO', 'SEMANAL', 'MENSAL', 'ANUAL'] as FilterModalidade[]).map((mod) => (
              <button
                key={mod}
                type="button"
                onClick={() => setModalidade(mod)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  modalidade === mod
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-white hover:text-slate-900'
                }`}
              >
                {mod === 'DIARIO' && 'Diário'}
                {mod === 'SEMANAL' && 'Semanal'}
                {mod === 'MENSAL' && 'Mensal'}
                {mod === 'ANUAL' && 'Anual'}
              </button>
            ))}
          </div>

          {/* Conditional Date Pickers based on Modalidade */}
          {modalidade === 'DIARIO' && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-300 text-xs">
              <Calendar className="w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
              />
            </div>
          )}

          {modalidade === 'SEMANAL' && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-300 text-xs">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-slate-500">Semana de:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
              />
            </div>
          )}

          {modalidade === 'MENSAL' && (
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-white px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                {MONTH_NAMES_FULL.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-white px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer font-mono"
              >
                {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {modalidade === 'ANUAL' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-white px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer font-mono"
            >
              {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                <option key={yr} value={yr}>
                  Ano {yr}
                </option>
              ))}
            </select>
          )}

          {/* Categoria Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-300 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as FilterCategoria)}
              className="bg-transparent font-semibold text-slate-800 focus:ring-0 outline-none cursor-pointer"
            >
              <option value="TODOS">Todas as Categorias</option>
              <option value="PLANO_FAMILIAR">Somente Plano Familiar</option>
              <option value="PLANO_INDIVIDUAL">Somente Plano Individual</option>
              <option value="PLANO_ESPECIAL">Somente Plano Especial</option>
              <option value="PREFEITURA">Prefeitura (PMPA)</option>
              <option value="BOMBEIROS">Bombeiros (CBMMG)</option>
            </select>
          </div>
        </div>

        {/* Action Button: Print */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Imprimir relatório em folha A4"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Imprimir Relatório (Folha A4)</span>
          </button>
        </div>
      </div>

      {/* ================= REPORT VIEWER CANVAS ================= */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center bg-slate-200/90">
        <div className="transform transition-transform">{renderReportSheet()}</div>
      </div>

      {/* ================= NATIVE PRINT ROOT (RENDERED OUTSIDE #root IN DOCUMENT.BODY) ================= */}
      {createPortal(
        <div id="print-gda-report-root">
          {renderReportSheet()}
        </div>,
        document.body
      )}
    </div>
  );
};
