import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CardData } from '../../types';
import {
  Users,
  User,
  ArrowRight,
  ExternalLink,
  Hash,
  Search,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';

export const GdaLatestRecordsView: React.FC = () => {
  const {
    cards,
    setCurrentView,
    setGidActiveTab,
    setGidSubTab,
    setGidSearchTerm,
  } = useApp();

  const [filterSearch, setFilterSearch] = useState('');

  // Extrai o número do plano com 4 dígitos (ex: 4550, 4882, ou 0104)
  const getDisplayPlanNumber = (controlNumber: string): string => {
    if (!controlNumber) return '----';
    const trimmed = controlNumber.trim();
    // Se já for composto apenas por números (ex: 4550, 4882)
    if (/^\d{4}$/.test(trimmed)) return trimmed;
    if (/^\d+$/.test(trimmed)) return trimmed.padStart(4, '0');

    // Se for string formatada (ex: IND-2026-0104, FAM-2026-0042-01)
    const matches = trimmed.match(/\d+/g);
    if (matches && matches.length > 0) {
      const nonYear = matches.filter((m) => m !== '2026' && m !== '2025' && m !== '2027');
      if (nonYear.length > 0) {
        return nonYear[nonYear.length - 1].padStart(4, '0').slice(-4);
      }
      return matches[matches.length - 1].padStart(4, '0').slice(-4);
    }
    return trimmed;
  };

  // Chave numérica para ordenação decrescente (o maior/mais recente no topo)
  const getNumericSortKey = (card: CardData): number => {
    const disp = getDisplayPlanNumber(card.controlNumber);
    const parsed = parseInt(disp, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;

    const allDigits = (card.controlNumber || '').replace(/\D/g, '');
    const fallbackParsed = parseInt(allDigits, 10);
    return isNaN(fallbackParsed) ? 0 : fallbackParsed;
  };

  // 1. Filtrar e ordenar PLANOS FAMILIARES (Agrupados por Titular)
  const familyPlans = useMemo(() => {
    // No plano familiar, consideramos cada família pelo seu Titular
    const titularCards = cards.filter(
      (c) =>
        (c.category === 'PLANO_FAMILIAR' || c.planType === 'FAMILIAR') &&
        (c.isTitular || !c.familyHeadId)
    );

    // Ordenação: O número mais recente ou maior sempre ocupa a primeira linha da coluna
    return titularCards.sort((a, b) => {
      const numA = getNumericSortKey(a);
      const numB = getNumericSortKey(b);
      if (numB !== numA) return numB - numA;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [cards]);

  // 2. Filtrar e ordenar PLANOS INDIVIDUAIS
  const individualPlans = useMemo(() => {
    const individualCards = cards.filter(
      (c) =>
        (c.category === 'PLANO_INDIVIDUAL' || c.planType === 'INDIVIDUAL') &&
        c.category !== 'PLANO_FAMILIAR'
    );

    // Ordenação: O número mais recente ou maior sempre ocupa a primeira linha da coluna
    return individualCards.sort((a, b) => {
      const numA = getNumericSortKey(a);
      const numB = getNumericSortKey(b);
      if (numB !== numA) return numB - numA;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [cards]);

  // Filtragem de busca se digitada
  const filteredFamilyPlans = useMemo(() => {
    if (!filterSearch.trim()) return familyPlans;
    const term = filterSearch.toLowerCase();
    return familyPlans.filter((c) => {
      const num = getDisplayPlanNumber(c.controlNumber);
      return (
        num.includes(term) ||
        c.controlNumber.toLowerCase().includes(term) ||
        c.name.toLowerCase().includes(term)
      );
    });
  }, [familyPlans, filterSearch]);

  const filteredIndividualPlans = useMemo(() => {
    if (!filterSearch.trim()) return individualPlans;
    const term = filterSearch.toLowerCase();
    return individualPlans.filter((c) => {
      const num = getDisplayPlanNumber(c.controlNumber);
      return (
        num.includes(term) ||
        c.controlNumber.toLowerCase().includes(term) ||
        c.name.toLowerCase().includes(term)
      );
    });
  }, [individualPlans, filterSearch]);

  // Ao clicar no número do plano: remete ao Módulo GID abrindo o respectivo plano
  const handleOpenInGid = (card: CardData, isFam: boolean) => {
    setGidActiveTab('USUARIOS');
    setGidSubTab(isFam ? 'PLANO_FAMILIAR' : 'PLANO_INDIVIDUAL');
    setGidSearchTerm(card.controlNumber);
    setCurrentView('GID');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-112px)] overflow-hidden bg-slate-100">
      {/* Top Banner & Quick Search */}
      <div className="bg-white border-b border-slate-200 px-6 py-3.5 shrink-0 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Hash className="w-5 h-5 text-blue-600" />
            <span>Últimos Números de Planos Cadastrados</span>
            <span className="text-[11px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full font-mono">
              Ordem Decrescente
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            O número mais recente ou maior sempre ocupa a primeira linha. Clique em qualquer número para abrir a ficha no Módulo GID.
          </p>
        </div>

        {/* Quick Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar por número ou nome..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl w-60 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
            />
          </div>
          {filterSearch && (
            <button
              onClick={() => setFilterSearch('')}
              className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Main Two Columns Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* ================= COLUNA DA ESQUERDA: PLANO FAMILIAR ================= */}
          <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-sm overflow-hidden flex flex-col">
            {/* Header da Coluna */}
            <div className="bg-gradient-to-r from-indigo-700 to-blue-700 text-white p-4.5 px-6 flex items-center justify-between border-b border-indigo-600">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-wide uppercase">
                    PLANO FAMILIAR
                  </h3>
                  <p className="text-xs text-indigo-100 font-medium">
                    Titulares e grupos familiares
                  </p>
                </div>
              </div>

              <div className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-mono font-bold">
                {filteredFamilyPlans.length} {filteredFamilyPlans.length === 1 ? 'família' : 'famílias'}
              </div>
            </div>

            {/* Linhas da Coluna */}
            <div className="p-4 sm:p-5 space-y-3 max-h-[calc(100vh-230px)] overflow-y-auto">
              {filteredFamilyPlans.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs italic">
                  Nenhum plano familiar cadastrado ou encontrado.
                </div>
              ) : (
                filteredFamilyPlans.map((card, index) => {
                  const planNumber = getDisplayPlanNumber(card.controlNumber);
                  const dependents = cards.filter((c) => c.familyHeadId === card.id);
                  const isTopRecent = index === 0;

                  return (
                    <div
                      key={card.id}
                      onClick={() => handleOpenInGid(card, true)}
                      className={`group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 ${
                        isTopRecent
                          ? 'bg-gradient-to-r from-indigo-50/80 to-blue-50/80 border-indigo-300 hover:border-indigo-400 hover:shadow-md'
                          : 'bg-slate-50/70 border-slate-200 hover:bg-indigo-50/50 hover:border-indigo-200 hover:shadow-xs'
                      }`}
                      title="Clique para abrir este plano no Módulo GID"
                    >
                      {/* Left Side: Número em Fonte Tamanho 30 Negrito */}
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Indicador de Mais Recente se for o primeiro */}
                        {isTopRecent && (
                          <div className="hidden sm:flex flex-col items-center justify-center text-[10px] font-black uppercase text-indigo-700 bg-indigo-100 px-2 py-1 rounded-md border border-indigo-200 shrink-0">
                            <span>Mais</span>
                            <span>Recente</span>
                          </div>
                        )}

                        <div className="min-w-0">
                          {/* Número do plano com fonte tamanho 30 negrito */}
                          <div className="text-[30px] font-black font-mono tracking-tight text-indigo-950 leading-none group-hover:text-blue-700 transition-colors">
                            {planNumber}
                          </div>

                          {/* Nome do Titular e Dependente */}
                          <div className="mt-1.5 text-xs text-slate-700 font-bold truncate">
                            {card.name} <span className="font-normal text-slate-500">(Titular)</span>
                          </div>

                          {dependents.length > 0 && (
                            <div className="text-[11px] text-slate-500 truncate mt-0.5">
                              {dependents.length} {dependents.length === 1 ? 'dependente' : 'dependentes'}:{' '}
                              <span className="font-medium text-slate-600">
                                {dependents.map((d) => d.name.split(' ')[0]).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Side: Ação de Navegação para GID */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-white group-hover:bg-indigo-600 group-hover:text-white px-2.5 py-1.5 rounded-lg border border-indigo-200 transition-all shadow-2xs">
                          <span>Abrir no GID</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                        <div className="sm:hidden p-2 rounded-lg bg-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ================= COLUNA DA DIREITA: PLANO INDIVIDUAL ================= */}
          <div className="bg-white rounded-2xl border-2 border-emerald-200 shadow-sm overflow-hidden flex flex-col">
            {/* Header da Coluna */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white p-4.5 px-6 flex items-center justify-between border-b border-emerald-600">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-wide uppercase">
                    PLANO INDIVIDUAL
                  </h3>
                  <p className="text-xs text-emerald-100 font-medium">
                    Associados individuais cadastrados
                  </p>
                </div>
              </div>

              <div className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-mono font-bold">
                {filteredIndividualPlans.length} {filteredIndividualPlans.length === 1 ? 'associado' : 'associados'}
              </div>
            </div>

            {/* Linhas da Coluna */}
            <div className="p-4 sm:p-5 space-y-3 max-h-[calc(100vh-230px)] overflow-y-auto">
              {filteredIndividualPlans.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs italic">
                  Nenhum plano individual cadastrado ou encontrado.
                </div>
              ) : (
                filteredIndividualPlans.map((card, index) => {
                  const planNumber = getDisplayPlanNumber(card.controlNumber);
                  const isTopRecent = index === 0;

                  return (
                    <div
                      key={card.id}
                      onClick={() => handleOpenInGid(card, false)}
                      className={`group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 ${
                        isTopRecent
                          ? 'bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border-emerald-300 hover:border-emerald-400 hover:shadow-md'
                          : 'bg-slate-50/70 border-slate-200 hover:bg-emerald-50/50 hover:border-emerald-200 hover:shadow-xs'
                      }`}
                      title="Clique para abrir este plano no Módulo GID"
                    >
                      {/* Left Side: Número em Fonte Tamanho 30 Negrito */}
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Indicador de Mais Recente se for o primeiro */}
                        {isTopRecent && (
                          <div className="hidden sm:flex flex-col items-center justify-center text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-1 rounded-md border border-emerald-200 shrink-0">
                            <span>Mais</span>
                            <span>Recente</span>
                          </div>
                        )}

                        <div className="min-w-0">
                          {/* Número do plano com fonte tamanho 30 negrito */}
                          <div className="text-[30px] font-black font-mono tracking-tight text-emerald-950 leading-none group-hover:text-emerald-700 transition-colors">
                            {planNumber}
                          </div>

                          {/* Nome do Associado */}
                          <div className="mt-1.5 text-xs text-slate-800 font-bold truncate">
                            {card.name}
                          </div>

                          <div className="text-[11px] text-slate-500 truncate mt-0.5">
                            Cadastro:{' '}
                            <span className="font-mono text-slate-600">
                              {card.emissionDate || '2026'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Ação de Navegação para GID */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-white group-hover:bg-emerald-600 group-hover:text-white px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-all shadow-2xs">
                          <span>Abrir no GID</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                        <div className="sm:hidden p-2 rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
