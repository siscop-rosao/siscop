import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  X,
  Users,
  Flame,
  FileText,
  CreditCard,
  Shield,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Hash,
  Phone,
  Calendar,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { CardData, BarbecueReservation, PopProcedure, User } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCard?: (card: CardData, mode: 'VIEW' | 'EDIT') => void;
}

interface SearchResultItem {
  id: string;
  type: 'CARD' | 'RESERVATION' | 'POP' | 'USER' | 'LOG';
  typeLabel: string;
  badgeColor: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  path: string[];
  snippet?: string;
  matchScore: number;
  action: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onOpenCard,
}) => {
  const {
    cards,
    reservations,
    popProcedures,
    users,
    logs,
    setCurrentView,
    setGidActiveTab,
    setGidSubTab,
    openCardInGda,
    openFichaModal,
  } = useApp();

  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CARDS' | 'RESERVATIONS' | 'POP' | 'SYSTEM'>('ALL');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Real-time indexing engine across all platform contents
  const results = useMemo<SearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const items: SearchResultItem[] = [];

    // 1. Index Cards (Associados / GID / GDA)
    cards.forEach((card) => {
      const matchFields: { field: string; val: string }[] = [
        { field: 'Nome', val: card.name || '' },
        { field: 'Nº Controle', val: card.controlNumber || '' },
        { field: 'CPF/RG', val: card.rgOrCpf || '' },
        { field: 'Telefone', val: card.phone || '' },
        { field: 'Endereço', val: card.address || '' },
        { field: 'Família', val: card.familyName || '' },
        { field: 'Condição Especial', val: card.specialCondition || '' },
        { field: 'Laudo', val: card.medicalReportInfo || '' },
        { field: 'Observações', val: card.notesHtml?.replace(/<[^>]*>?/gm, '') || '' },
        { field: 'Informações Internas', val: card.internalInfoHtml?.replace(/<[^>]*>?/gm, '') || '' },
      ];

      // Check payment records in grid
      card.grid1?.forEach((p) => {
        if (p.datePaid) matchFields.push({ field: `Pgto ${p.month}`, val: p.datePaid });
        if (p.paymentMethod) matchFields.push({ field: `Modalidade ${p.month}`, val: p.paymentMethod });
        if (p.payingBank) matchFields.push({ field: `Banco ${p.month}`, val: p.payingBank });
        if (p.referenceId) matchFields.push({ field: `Identificador ${p.month}`, val: p.referenceId });
      });
      card.grid2?.forEach((p) => {
        if (p.datePaid) matchFields.push({ field: `Pgto ${p.month}`, val: p.datePaid });
        if (p.paymentMethod) matchFields.push({ field: `Modalidade ${p.month}`, val: p.paymentMethod });
        if (p.payingBank) matchFields.push({ field: `Banco ${p.month}`, val: p.payingBank });
        if (p.referenceId) matchFields.push({ field: `Identificador ${p.month}`, val: p.referenceId });
      });

      const matchedField = matchFields.find((f) => f.val.toLowerCase().includes(q));

      if (matchedField) {
        let score = 1;
        if (card.name.toLowerCase().includes(q)) score += 10;
        if (card.controlNumber.toLowerCase().includes(q)) score += 12;
        if (card.rgOrCpf?.toLowerCase().includes(q)) score += 8;

        const categoryName =
          card.category === 'PLANO_FAMILIAR'
            ? 'Plano Familiar'
            : card.category === 'PLANO_ESPECIAL'
            ? 'Plano Especial (Isento)'
            : card.category === 'PREFEITURA'
            ? 'Servidor da Prefeitura'
            : card.category === 'BOMBEIROS'
            ? 'Corpo de Bombeiros'
            : 'Plano Individual';

        items.push({
          id: `card-${card.id}`,
          type: 'CARD',
          typeLabel: 'Associado / Carteirinha',
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <Users className="w-4 h-4 text-blue-600" />,
          title: card.name,
          subtitle: `${card.controlNumber} • ${categoryName} • Status: ${card.status}`,
          path: ['Módulo GID', categoryName, card.isTitular ? 'Titular' : 'Dependente'],
          snippet: matchedField.field !== 'Nome' ? `${matchedField.field}: "${matchedField.val}"` : undefined,
          matchScore: score,
          action: () => {
            setCurrentView('GID');
            setGidActiveTab('USUARIOS');
            setGidSubTab(card.category);
            openFichaModal(card, 'VIEW');
            onClose();
          },
        });
      }
    });

    // 2. Index Barbecue Reservations (Churrasqueira)
    reservations.forEach((res) => {
      const matchFields: { field: string; val: string }[] = [
        { field: 'Responsável', val: res.responsibleName || '' },
        { field: 'Telefone', val: res.responsiblePhone || '' },
        { field: 'Plano', val: res.responsiblePlanNumber || '' },
        { field: 'Observações', val: res.observations || '' },
        { field: 'Quiosque', val: `Quiosque ${res.kioskNumber}` },
        { field: 'Data', val: res.date || '' },
        { field: 'Convidados', val: res.participantsList?.join(', ') || '' },
      ];

      const matchedField = matchFields.find((f) => f.val.toLowerCase().includes(q));

      if (matchedField) {
        let score = 2;
        if (res.responsibleName.toLowerCase().includes(q)) score += 8;
        if (res.date.includes(q)) score += 5;

        items.push({
          id: `res-${res.id}`,
          type: 'RESERVATION',
          typeLabel: 'Churrasqueira / Quiosque',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: <Flame className="w-4 h-4 text-amber-600" />,
          title: `Quiosque ${res.kioskNumber} - ${res.responsibleName}`,
          subtitle: `Data: ${res.date} • Horário: ${res.timeSlot} • Status: ${res.status}`,
          path: ['Módulo GID', 'Churrasqueira (Quiosques)', `Quiosque ${res.kioskNumber}`],
          snippet: `${matchedField.field}: "${matchedField.val}"`,
          matchScore: score,
          action: () => {
            setCurrentView('GID');
            setGidActiveTab('CHURRASQUEIRA');
            onClose();
          },
        });
      }
    });

    // 3. Index POP Procedures & Pricing Tables
    popProcedures.forEach((pop) => {
      const matchFields: { field: string; val: string }[] = [
        { field: 'Código POP', val: pop.code || '' },
        { field: 'Título', val: pop.title || '' },
        { field: 'Objetivo', val: pop.objective || '' },
        { field: 'Base Legal', val: pop.legalBasis || '' },
        { field: 'Notas Importantes', val: pop.importantNotes || '' },
        { field: 'Passos Operacionais', val: pop.steps?.join(' ') || '' },
        { field: 'Pré-requisitos', val: pop.prerequisites?.join(' ') || '' },
      ];

      // Index values inside pricing tables if present
      if (pop.pricingTables) {
        pop.pricingTables.eventsTable?.forEach((row) => {
          matchFields.push({ field: `Tabela ${row.event}`, val: `${row.event} Familiar R$ ${row.familiar} Individual R$ ${row.individual}` });
        });
        pop.pricingTables.familyQuantityTable?.forEach((row) => {
          matchFields.push({ field: `Tabela Família ${row.familyCount}`, val: `R$ ${row.firstPaymentValue}` });
        });
        pop.pricingTables.infoNotes?.forEach((note) => {
          matchFields.push({ field: `Informativo ${note.label}`, val: `R$ ${note.value}` });
        });
      }

      const matchedField = matchFields.find((f) => f.val.toLowerCase().includes(q));

      if (matchedField) {
        let score = 3;
        if (pop.title.toLowerCase().includes(q)) score += 9;
        if (pop.code.toLowerCase().includes(q)) score += 11;

        items.push({
          id: `pop-${pop.id}`,
          type: 'POP',
          typeLabel: 'Norma / POP',
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: <FileText className="w-4 h-4 text-emerald-600" />,
          title: `${pop.code} - ${pop.title}`,
          subtitle: `${pop.category} • ${pop.objective.slice(0, 90)}...`,
          path: ['Módulo POP', 'Procedimentos Operacionais', pop.code],
          snippet: `${matchedField.field}: "${matchedField.val.slice(0, 110)}"`,
          matchScore: score,
          action: () => {
            setCurrentView('POP');
            onClose();
          },
        });
      }
    });

    // 4. Index Users / Security
    users.forEach((u) => {
      const matchFields = [
        { field: 'Nome de Usuário', val: u.name },
        { field: 'Login / Usuário', val: u.username },
        { field: 'Cargo / Função', val: u.role },
      ];

      const matchedField = matchFields.find((f) => f.val.toLowerCase().includes(q));
      if (matchedField) {
        items.push({
          id: `user-${u.id}`,
          type: 'USER',
          typeLabel: 'Sistema / Usuário',
          badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <Shield className="w-4 h-4 text-purple-600" />,
          title: u.name,
          subtitle: `Login: @${u.username} • Cargo: ${u.role}`,
          path: ['Sistema', 'Usuários e Permissões', u.name],
          snippet: `${matchedField.field}: "${matchedField.val}"`,
          matchScore: 4,
          action: () => {
            setCurrentView('USERS_ADMIN');
            onClose();
          },
        });
      }
    });

    // Sort by match score descending
    return items.sort((a, b) => b.matchScore - a.matchScore);
  }, [query, cards, reservations, popProcedures, users, setCurrentView, setGidActiveTab, setGidSubTab, onOpenCard, onClose]);

  // Filtered by selected category pill
  const filteredResults = useMemo(() => {
    if (selectedFilter === 'ALL') return results;
    if (selectedFilter === 'CARDS') return results.filter((r) => r.type === 'CARD');
    if (selectedFilter === 'RESERVATIONS') return results.filter((r) => r.type === 'RESERVATION');
    if (selectedFilter === 'POP') return results.filter((r) => r.type === 'POP');
    if (selectedFilter === 'SYSTEM') return results.filter((r) => r.type === 'USER' || r.type === 'LOG');
    return results;
  }, [results, selectedFilter]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        filteredResults[selectedIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-700/60 w-full max-w-3xl overflow-hidden flex flex-col max-h-[82vh] animate-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* ================= SEARCH INPUT HEADER ================= */}
        <div className="p-3.5 sm:p-4 bg-slate-900 border-b border-slate-800 text-white flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <Search className="w-5 h-5" />
          </div>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Indexação em Tempo Real: digite nome, CPF, controle, telefone, valor R$, regra..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm sm:text-base text-white placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all font-medium"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                title="Limpar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= FILTER PILLS & STATUS ================= */}
        <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 select-none">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-semibold mr-1">Filtrar:</span>
            {[
              { id: 'ALL', label: `Todos (${results.length})` },
              { id: 'CARDS', label: `Associados (${results.filter((r) => r.type === 'CARD').length})` },
              { id: 'RESERVATIONS', label: `Quiosques (${results.filter((r) => r.type === 'RESERVATION').length})` },
              { id: 'POP', label: `Normas/POP (${results.filter((r) => r.type === 'POP').length})` },
              { id: 'SYSTEM', label: `Sistema (${results.filter((r) => r.type === 'USER').length})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setSelectedFilter(f.id as any);
                  setSelectedIndex(0);
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  selectedFilter === f.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
            Use <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-300">↑</kbd>{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-300">↓</kbd> para navegar e{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-300">Enter</kbd> para abrir
          </div>
        </div>

        {/* ================= RESULTS LIST ================= */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 divide-y divide-slate-100 space-y-2">
          {!query.trim() ? (
            <div className="text-center py-12 px-4 text-slate-400 space-y-2">
              <Search className="w-10 h-10 text-slate-300 mx-auto stroke-1" />
              <div className="font-semibold text-slate-600 text-sm">
                Busca Global com Indexação Instantânea
              </div>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Digite qualquer termo, expressão, número de controle, CPF, telefone, valor em R$, regulamento ou anotação para vasculhar 100% da plataforma.
              </p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-12 px-4 text-slate-400 space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto font-bold text-lg">
                ?
              </div>
              <div className="font-semibold text-slate-700 text-sm">
                Nenhum resultado encontrado para &quot;{query}&quot;
              </div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Verifique se o termo foi digitado corretamente ou tente buscar por partes de nomes, números ou valores.
              </p>
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 sm:p-3.5 rounded-xl cursor-pointer transition-all border flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-300 shadow-sm translate-x-0.5'
                      : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 shrink-0 mt-0.5">
                      {item.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Breadcrumbs Path */}
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium mb-0.5 flex-wrap">
                        {item.path.map((p, pIdx) => (
                          <React.Fragment key={pIdx}>
                            <span>{p}</span>
                            {pIdx < item.path.length - 1 && (
                              <ChevronRight className="w-3 h-3 text-slate-300" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Title & Badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                        <span
                          className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-full border ${item.badgeColor}`}
                        >
                          {item.typeLabel}
                        </span>
                      </div>

                      {/* Subtitle */}
                      <div className="text-xs text-slate-500 mt-0.5">{item.subtitle}</div>

                      {/* Matched Snippet */}
                      {item.snippet && (
                        <div className="mt-1.5 text-[11px] bg-amber-50 text-amber-900 px-2 py-1 rounded border border-amber-200/80 inline-block max-w-full truncate font-mono">
                          <span className="font-semibold text-amber-950">Correspondência: </span>
                          {item.snippet}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-blue-600 text-xs font-semibold shrink-0 pt-2">
                    <span className="hidden sm:inline">Acessar</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="bg-slate-100 px-4 py-2.5 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              {filteredResults.length} registro(s) indexado(s) em tempo real
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Clique no resultado para ir diretamente ao destino
          </span>
        </div>
      </div>
    </div>
  );
};
