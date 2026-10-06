import React, { useState } from 'react';
import { BarbecueReservation } from '../../types';
import { Calendar, ChevronLeft, ChevronRight, Info, Flame, CheckCircle, Clock, XCircle } from 'lucide-react';

interface AnnualCalendarProps {
  reservations: BarbecueReservation[];
  onSelectDate?: (dateStr: string) => void;
  onSelectReservation?: (reservation: BarbecueReservation) => void;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const AnnualChurrasqueiraCalendar: React.FC<AnnualCalendarProps> = ({
  reservations,
  onSelectDate,
  onSelectReservation,
}) => {
  const [currentYear, setCurrentYear] = useState<number>(() => {
    // Default to year 2026 or current system year
    return 2026;
  });

  const [selectedDayInfo, setSelectedDayInfo] = useState<{
    dateStr: string;
    dayNum: number;
    monthName: string;
    reservations: BarbecueReservation[];
  } | null>(null);

  // Index reservations by date string: "YYYY-MM-DD"
  const reservationsByDate = reservations.reduce((acc, res) => {
    if (!acc[res.date]) {
      acc[res.date] = [];
    }
    acc[res.date].push(res);
    return acc;
  }, {} as Record<string, BarbecueReservation[]>);

  // Helper to determine day styling and status
  const getDayStatus = (dateStr: string) => {
    const list = reservationsByDate[dateStr];
    if (!list || list.length === 0) return null;

    // Prioritize CONFIRMADA, then PENDENTE, then CANCELADA
    const hasConfirmed = list.some((r) => r.status === 'CONFIRMADA');
    if (hasConfirmed) return 'CONFIRMADA';

    const hasPending = list.some((r) => r.status === 'PENDENTE');
    if (hasPending) return 'PENDENTE';

    const hasCancelled = list.some((r) => r.status === 'CANCELADA');
    if (hasCancelled) return 'CANCELADA';

    return 'CONCLUIDA';
  };

  // Check if today
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;

  // Handle clicking on a calendar day
  const handleDayClick = (year: number, monthIndex: number, day: number) => {
    const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayRes = reservationsByDate[dateStr] || [];

    setSelectedDayInfo({
      dateStr,
      dayNum: day,
      monthName: MONTH_NAMES[monthIndex],
      reservations: dayRes,
    });

    if (onSelectDate && dayRes.length === 0) {
      onSelectDate(dateStr);
    }
  };

  // Render month grid
  const renderMonth = (monthIndex: number) => {
    const firstDayIndex = new Date(currentYear, monthIndex, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();

    const blanks = Array.from({ length: firstDayIndex }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    // Count reservations in this month
    const monthPrefix = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    const monthReservationsCount = Object.keys(reservationsByDate).filter((k) =>
      k.startsWith(monthPrefix)
    ).length;

    return (
      <div
        key={monthIndex}
        className="bg-white rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-all p-3 flex flex-col justify-between"
      >
        {/* Month Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
              {MONTH_NAMES[monthIndex]}
            </h4>
          </div>
          {monthReservationsCount > 0 && (
            <span className="text-[10px] bg-amber-100 text-amber-900 font-semibold px-1.5 py-0.5 rounded-full" title={`${monthReservationsCount} dia(s) com reserva`}>
              {monthReservationsCount} {monthReservationsCount === 1 ? 'reserva' : 'reservas'}
            </span>
          )}
        </div>

        {/* Days of week header (D S T Q Q S S) */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {WEEK_DAYS.map((wd, i) => (
            <span
              key={i}
              className={`text-[9.5px] font-bold ${
                i === 0 || i === 6 ? 'text-amber-700' : 'text-slate-400'
              }`}
            >
              {wd}
            </span>
          ))}
        </div>

        {/* Month days grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs flex-1">
          {/* Empty slots before day 1 */}
          {blanks.map((b) => (
            <div key={`blank-${b}`} className="w-full aspect-square" />
          ))}

          {/* Actual days */}
          {days.map((day) => {
            const dateStr = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(
              day
            ).padStart(2, '0')}`;
            const status = getDayStatus(dateStr);
            const isToday = dateStr === todayStr;
            const resList = reservationsByDate[dateStr] || [];

            // Color classes based on reservation status
            let statusClasses = 'text-slate-700 hover:bg-slate-100 border border-transparent';
            let titleText = `${day} de ${MONTH_NAMES[monthIndex]} de ${currentYear}`;

            if (status === 'CONFIRMADA') {
              statusClasses =
                'bg-emerald-600 text-white font-bold shadow-xs hover:bg-emerald-700 border-emerald-700 ring-1 ring-emerald-300';
              titleText += ` • Reserva Confirmada (${resList.map((r) => `Quiosque ${r.kioskNumber}`).join(', ')})`;
            } else if (status === 'PENDENTE') {
              statusClasses =
                'bg-amber-400 text-slate-900 font-bold shadow-xs hover:bg-amber-500 border-amber-500 ring-1 ring-amber-300';
              titleText += ` • Reserva Pendente (${resList.map((r) => `Quiosque ${r.kioskNumber}`).join(', ')})`;
            } else if (status === 'CANCELADA') {
              statusClasses =
                'bg-rose-500 text-white font-bold shadow-xs hover:bg-rose-600 border-rose-600 line-through';
              titleText += ` • Reserva Cancelada`;
            } else if (status === 'CONCLUIDA') {
              statusClasses = 'bg-slate-600 text-white font-semibold';
            }

            return (
              <button
                key={day}
                type="button"
                onClick={() => handleDayClick(currentYear, monthIndex, day)}
                title={titleText}
                className={`w-full aspect-square rounded flex flex-col items-center justify-center relative transition-all text-[11px] select-none ${statusClasses} ${
                  isToday ? 'ring-2 ring-blue-500 font-black' : ''
                }`}
              >
                <span>{day}</span>
                {/* Multi-reservation indicator dot */}
                {resList.length > 1 && (
                  <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-white border border-slate-900" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 rounded-2xl border-2 border-slate-200 p-5 shadow-xs space-y-4">
      {/* ================= CALENDAR TOP BAR ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Calendário Anual das Churrasqueiras</span>
              <span className="bg-amber-100 text-amber-900 text-xs px-2 py-0.5 rounded-full font-bold">
                Ano {currentYear}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Visão anual completa (12 meses) com destaque das datas reservadas por status
            </p>
          </div>
        </div>

        {/* Year Navigation & Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-300 rounded-lg p-1 shadow-2xs">
            <button
              onClick={() => setCurrentYear((prev) => prev - 1)}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
              title="Ano anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-slate-800 text-xs px-3 font-mono">
              {currentYear}
            </span>
            <button
              onClick={() => setCurrentYear((prev) => prev + 1)}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
              title="Próximo ano"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setCurrentYear(2026)}
            className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
          >
            Ano Atual (2026)
          </button>
        </div>
      </div>

      {/* ================= STATUS COLOR LEGEND ================= */}
      <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-600 border border-emerald-700 shadow-2xs shrink-0" />
            <span className="font-medium text-slate-700">Confirmada</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-amber-400 border border-amber-500 shadow-2xs shrink-0" />
            <span className="font-medium text-slate-700">Pendente</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-rose-500 border border-rose-600 shadow-2xs shrink-0" />
            <span className="font-medium text-slate-700">Cancelada</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-white border-2 border-blue-500 shadow-2xs shrink-0" />
            <span className="font-medium text-slate-700">Dia de Hoje</span>
          </div>
        </div>

        <span className="text-[11px] text-slate-400 italic">
          Clique em qualquer dia para ver os detalhes da reserva ou agendar
        </span>
      </div>

      {/* ================= 3 ROWS OF 4 MONTHS (12 MONTHS TOTAL) ================= */}
      {/* 
        Linha 1: Janeiro - Fevereiro - Março - Abril
        Linha 2: Maio - Junho - Julho - Agosto
        Linha 3: Setembro - Outubro - Novembro - Dezembro
      */}
      <div className="space-y-4">
        {/* LINHA 1: Janeiro, Fevereiro, Março, Abril */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderMonth(0)} {/* Janeiro */}
          {renderMonth(1)} {/* Fevereiro */}
          {renderMonth(2)} {/* Março */}
          {renderMonth(3)} {/* Abril */}
        </div>

        {/* LINHA 2: Maio, Junho, Julho, Agosto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderMonth(4)} {/* Maio */}
          {renderMonth(5)} {/* Junho */}
          {renderMonth(6)} {/* Julho */}
          {renderMonth(7)} {/* Agosto */}
        </div>

        {/* LINHA 3: Setembro, Outubro, Novembro, Dezembro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderMonth(8)}  {/* Setembro */}
          {renderMonth(9)}  {/* Outubro */}
          {renderMonth(10)} {/* Novembro */}
          {renderMonth(11)} {/* Dezembro */}
        </div>
      </div>

      {/* ================= MODAL / POPUP DE DETALHES DO DIA CLICADO ================= */}
      {selectedDayInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <div>
                  <h4 className="text-sm font-bold">
                    {selectedDayInfo.dayNum} de {selectedDayInfo.monthName} de {currentYear}
                  </h4>
                  <p className="text-[10.5px] text-slate-300">
                    Ocupação dos Quiosques de Churrasqueira
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDayInfo(null)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-3">
              {selectedDayInfo.reservations.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-slate-800 text-sm">Data Livre para Agendamento</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Todos os 6 quiosques de churrasqueira estão disponíveis neste dia.
                  </p>

                  {onSelectDate && (
                    <button
                      onClick={() => {
                        const d = selectedDayInfo.dateStr;
                        setSelectedDayInfo(null);
                        onSelectDate(d);
                      }}
                      className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-1.5"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Agendar Reserva para Este Dia</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-700 block">
                    Reservas Registradas neste Dia ({selectedDayInfo.reservations.length}):
                  </span>

                  {selectedDayInfo.reservations.map((res) => (
                    <div
                      key={res.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 hover:border-amber-400 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                          Quiosque {res.kioskNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            res.status === 'CONFIRMADA'
                              ? 'bg-emerald-100 text-emerald-800'
                              : res.status === 'PENDENTE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {res.status}
                        </span>
                      </div>

                      <div className="font-semibold text-slate-900 text-sm">
                        {res.responsibleName}
                      </div>

                      <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {res.timeSlot === 'MANHA_TARDE'
                            ? 'Manhã / Tarde (09h às 17h)'
                            : res.timeSlot === 'INTEGRAL'
                            ? 'Dia Todo (Integral)'
                            : 'Noite'}
                        </span>
                        {res.responsiblePhone && <span>• {res.responsiblePhone}</span>}
                      </div>

                      {res.observations && (
                        <div className="bg-amber-50/80 p-2 rounded text-[10.5px] text-amber-900 border border-amber-200/70 italic">
                          <strong>Obs:</strong> {res.observations}
                        </div>
                      )}

                      {res.participantsList.length > 0 && (
                        <div className="text-[10.5px] text-slate-500">
                          <strong>Convidados ({res.participantsList.length}):</strong>{' '}
                          {res.participantsList.slice(0, 3).join(', ')}
                          {res.participantsList.length > 3 ? ` e mais ${res.participantsList.length - 3}...` : ''}
                        </div>
                      )}

                      {onSelectReservation && (
                        <div className="pt-1 text-right">
                          <button
                            onClick={() => {
                              setSelectedDayInfo(null);
                              onSelectReservation(res);
                            }}
                            className="text-amber-700 hover:text-amber-900 font-bold text-[11px] underline"
                          >
                            Editar Reserva →
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedDayInfo(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
