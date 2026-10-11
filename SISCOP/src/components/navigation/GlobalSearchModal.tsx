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

  // Real-time indexing engine across all platform contents (100% à prova de falhas com proteção contra campos nulos)
  const results = useMemo<SearchResultItem[]>(() => {
    try {
      const q = query.trim().toLowerCase();
      if (!q) return [];

      const items: SearchResultItem[] = [];

      // 1. Index Cards (Associados / GID / GDA)
      if (Array.isArray(cards)) {
        cards.forEach((card, idx) => {
          if (!card) return;
          const matchFields: { field: string; val: string }[] = [
            { field: 'Nome', val: String(card.name || '') },
            { field: 'Nº Controle', val: String(card.controlNumber || '') },
            { field: 'CPF/RG', val: String(card.rgOrCpf || '') },
            { field: 'Telefone', val: String(card.phone || '') },
            { field: 'Endereço', val: String(card.address || '') },
            { field: 'Número', val: String(card.addressNumber || '') },
            { field: 'Complemento', val: String(card.addressComplement || '') },
            { field: 'Bairro', val: String(card.neighborhood || '') },
            { field: 'CEP', val: String(card.cep || '') },
            { field: 'Planos Vinculados', val: Array.isArray(card.linkedPlanNumbers) ? card.linkedPlanNumbers.join(', ') : '' },
            { field: 'Família', val: String(card.familyName || '') },
            { field: 'Condição Especial', val: String(card.specialCondition || '') },
            { field: 'Laudo', val: String(card.medicalReportInfo || '') },
            { field: 'Procuração (Outorgado)', val: String(card.procuracao?.nomeOutorgado || '') },
            { field: 'CPF Outorgado', val: String(card.procuracao?.cpfOutorgado || '') },
            { field: 'Observações', val: typeof card.notesHtml === 'string' ? card.notesHtml.replace(/<[^>]*>?/gm, '') : '' },
            { field: 'Informações Internas', val: typeof card.internalInfoHtml === 'string' ? card.internalInfoHtml.replace(/<[^>]*>?/gm, '') : '' },
          ];

          // Check payment records in grid
          if (Array.isArray(card.grid1)) {
            card.grid1.forEach((p) => {
              if (!p) return;
              if (p.datePaid) matchFields.push({ field: `Pgto ${p.month || ''}`, val: String(p.datePaid) });
              if (p.paymentMethod) matchFields.push({ field: `Modalidade ${p.month || ''}`, val: String(p.paymentMethod) });
              if (p.payingBank) matchFields.push({ field: `Banco ${p.month || ''}`, val: String(p.payingBank) });
              if (p.referenceId) matchFields.push({ field: `Identificador ${p.month || ''}`, val: String(p.referenceId) });
            });
          }
          if (Array.isArray(card.grid2)) {
            card.grid2.forEach((p) => {
              if (!p) return;
              if (p.datePaid) matchFields.push({ field: `Pgto ${p.month || ''}`, val: String(p.datePaid) });
              if (p.paymentMethod) matchFields.push({ field: `Modalidade ${p.month || ''}`, val: String(p.paymentMethod) });
              if (p.payingBank) matchFields.push({ field: `Banco ${p.month || ''}`, val: String(p.payingBank) });
              if (p.referenceId) matchFields.push({ field: `Identificador ${p.month || ''}`, val: String(p.referenceId) });
            });
          }

          const matchedField = matchFields.find((f) => f.val.toLowerCase().includes(q));

          if (matchedField) {
            let score = 1;
            const cardName = String(card.name || '').toLowerCase();
            const cardControl = String(card.controlNumber || '').toLowerCase();
            const cardCpf = String(card.rgOrCpf || '').toLowerCase();
            if (cardName.includes(q)) score += 10;
            if (cardControl.includes(q)) score += 12;
            if (cardCpf.includes(q)) score += 8;

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
              id: `card-${card.id || idx}`,
              type: 'CARD',
              typeLabel: 'Associado / Carteirinha',
              badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
              icon: <Users className="w-4 h-4 text-blue-600" />,
              title: card.name || 'Sem Nome Cadastrado',
              subtitle: `${card.controlNumber || 'S/N'} • ${categoryName} • Status: ${card.status || 'ATIVO'}`,
              path: ['Módulo GID', categoryName, card.isTitular ? 'Titular' : 'Dependente'],
              snippet: matchedField.field !== 'Nome' ? `${matchedField.field}: "${matchedField.val}"` : undefined,
              matchScore: score,
              action: () => {
                setCurrentView('GID');
                setGidActiveTab('USUARIOS');
                setGidSubTab(card.category || 'PLANO_INDIVIDUAL');
                openFichaModal(card, 'VIEW');
                onClose();
              },
            });
          }
        });
      }

      // 2. Index Barbecue Reservations (Churrasqueira)
      if (Array.isArray(reservations)) {
        reservations.forEach((res, idx) => {
          if (!res) return;
          const matchFields: { field: string; val: string }[] = [
            { field: 'Responsável', val: String(res.responsibleName || '') },
            { field: 'Telefone', val: String(res.responsiblePhone || '') },
            { field: 'Plano', val: String(res.responsiblePlanNumber || '') },
            { field: 'Observações', val: String(res.observations || '') },
            { field: 'Quiosque', val: `Quiosque ${res.kioskNumber || ''}` },
            { field: 'Data', val: String(res.date || '') },
            { field: 'Convidados', val: Array.isArray(res.participantsList) ? res.participantsList.join(', ') : '' },
          ];

          const matchedField = matchFields.find((f) => f.val.toLowerCase().includes(q));

          if (matchedField) {
            let score = 2;
            const respName = String(res.responsibleName || '').toLowerCase();
            const resDate = String(res.date || '');
            if (respName.includes(q)) score += 8;
            if (resDate.includes(q)) score += 5;

            items.push({
              id: `res-${res.id || idx}`,
              type: 'RESERVATION',
              typeLabel: 'Churrasqueira / Quiosque',
              badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
              icon: <Flame className="w-4 h-4 text-amber-600" />,
              title: `Quiosque ${res.kioskNumber || 'N/D'} - ${res.responsibleName || 'Responsável'}`,
              subtitle: `Data: ${res.date || ''} • Horário: ${res.timeSlot || ''} • Status: ${res.status || ''}`,
              path: ['Módulo GID', 'Churrasqueira (Quiosques)', `Quiosque ${res.kioskNumber || ''}`],
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
      }

      // 3. Index POP Procedures & Pricing Tables
      if (Array.isArray(popProcedures)) {
        popProcedures.forEach((pop, idx) => {
          if (!pop) return;
          const matchFields: { field: string; val: string }[] = [
            { field: 'Código POP', val: String(pop.code || '') },
            { field: 'Título', val: String(pop.title || '') },
            { field: 'Objetivo', val: String(pop.objective || '') },
            { field: 'Base Legal', val: String(pop.legalBasis || '') },
            { field: 'Notas Importantes', val: String(pop.importantNotes || '') },
            { field: 'Passos Operacionais', val: Array.isArray(pop.steps) ? pop.steps.join(' ') : '' },
            { field: 'Pré-requisitos', val: Array.isArray(pop.prerequisites) ? pop.prerequisites.join(' ') : '' },
          ];

          // Index values inside pricing tables if present
          if (pop.pricingTables) {
            if (Array.isArray(pop.pricingTables.eventsTable)) {
              pop.pricingTables.eventsTable.forEach((row) => {
                if (row) matchFields.push({ field: `Tabela ${row.event || ''}`, val: `${row.event || ''} Familiar R$ ${row.familiar || ''} Individual R$ ${row.individual || ''}` });
              });
            }
            if (Array.isArray(pop.pricingTables.familyQuantityTable)) {
              pop.pricingTables.familyQuantityTable.forEach((row) => {
                if (row) matchFields.push({ field: `Tabela Família ${row.familyCount || ''}`, val: `R$ ${row.firstPaymentValue || ''}` });
              });
            }
            if (Array.isArray(pop.pricingTables.infoNotes)) {
              pop.pricingTables.infoNotes.forEach((note) => {
                if (note) matchFields.push({ field: `Informativo ${note.label || ''}`, val: `R$ ${note.value || ''}` });
              });
            }
          }

          const matchedField = matchFields.find((f) => f.val.toLowerCase().includes(q));

          if (matchedField) {
            let score = 3;
            const popTitle = String(pop.title || '').toLowerCase();
            const popCode = String(pop.code || '').toLowerCase();
            if (popTitle.includes(q)) score += 9;
            if (popCode.includes(q)) score += 11;

            items.push({
              id: `pop-${pop.id || idx}`,
              type: 'POP',
              typeLabel: 'Norma / POP',
              badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
              icon: <FileText className="w-4 h-4 text-emerald-600" />,
              title: `${pop.code || 'POP'} - ${pop.title || 'Norma'}`,
              subtitle: `${pop.category || 'POP'} • ${String(pop.objective || '').slice(0, 90)}...`,
              path: ['Módulo POP', 'Procedimentos Operacionais', pop.code || ''],
              snippet: `${matchedField.field}: "${String(matchedField.val || '').slice(0, 110)}"`,
              matchScore: score,
              action: () => {
                setCurrentView('POP');
                onClose();
              },
            });
          }
        });
      }

      // 4. Index Users / Security
      if (Array.isArray(users)) {
        users.forEach((u, idx) => {
          if (!u) return;
          const matchFields = [
            { field: 'Nome de Usuário', val: String(u.name || '') },
            { field: 'Login / Usuário', val: String(u.username || '') },
            { field: 'Cargo / Função', val: String(u.role || '') },
          ];

          const matchedField = matchFields.find((f) => f.val.toLowerCase().includes(q));
          if (matchedField) {
            items.push({
              id: `user-${u.id || idx}`,
              type: 'USER',
              typeLabel: 'Sistema / Usuário',
              badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
              icon: <Shield className="w-4 h-4 text-purple-600" />,
              title: u.name || 'Usuário',
              subtitle: `Login: @${u.username || ''} • Cargo: ${u.role || ''}`,
              path: ['Sistema', 'Usuários e Permissões', u.name || 'Usuário'],
              snippet: `${matchedField.field}: "${matchedField.val}"`,
              matchScore: 4,
              action: () => {
                setCurrentView('USERS_ADMIN');
                onClose();
              },
            });
          }
        });
      }

      // Sort by match score descending
      return items.sort((a, b) => b.matchScore - a.matchScore);
    } catch (err) {
      console.error('[SISCOP] Erro seguro ao indexar busca:', err);
      return [];
    }
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
                  key={`${item.id}-${idx}`}
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
                        {(item.path || []).filter(Boolean).map((p, pIdx) => (
                          <React.Fragment key={pIdx}>
                            <span>{String(p)}</span>
                            {pIdx < (item.path?.length || 0) - 1 && (
                              <ChevronRight className="w-3 h-3 text-slate-300" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Title & Badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{item.title || 'Sem título'}</span>
                        <span
                          className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-full border ${item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'}`}
                        >
                          {item.typeLabel || 'Registro'}
                        </span>
                      </div>

                      {/* Subtitle */}
                      <div className="text-xs text-slate-500 mt-0.5">{item.subtitle || ''}</div>

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
