import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Printer,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Phone,
  MapPin,
  ExternalLink,
  Shield,
  FileText,
  UserCheck,
  Filter,
  Layers,
  ArrowRight
} from 'lucide-react';
import { CardData, CategoryType } from '../../types';
import { useApp } from '../../context/AppContext';
import { executePrint } from '../../utils/printHelper';
import { BrasaoPousoAlegre } from '../common/BrasaoPousoAlegre';
import { hasVinculo, getNumericSortKey } from '../../utils/formatters';

interface VinculosReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: CategoryType;
  initialAssociate?: CardData | null;
  onOpenCard?: (card: CardData, mode: 'VIEW' | 'EDIT') => void;
}

export const VinculosReportModal: React.FC<VinculosReportModalProps> = ({
  isOpen,
  onClose,
  category,
  initialAssociate,
  onOpenCard,
}) => {
  const {
    cards,
    currentUser,
    platformSettings,
    setCurrentView,
    setGidActiveTab,
    setGidSubTab,
    openFichaModal,
  } = useApp();

  // Categoria ativa do relatório (padrão: a categoria onde foi acionado)
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'TODAS'>(
    category || 'PLANO_INDIVIDUAL'
  );

  // Sincroniza se a categoria recebida via prop mudar
  useEffect(() => {
    if (category) {
      setSelectedCategory(category);
    }
  }, [category]);

  const [searchTerm, setSearchTerm] = useState('');
  const [reportViewMode, setReportViewMode] = useState<'LIST' | 'DETAIL'>('LIST');

  // Função auxiliar para normalizar número de plano para busca flexível
  const normalizePlanNumber = (val: string): string => {
    return val.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  };

  const getCategoryLabel = (cat: string): string => {
    switch (cat) {
      case 'PLANO_INDIVIDUAL':
        return 'Plano Individual';
      case 'PLANO_FAMILIAR':
        return 'Plano Familiar';
      case 'PLANO_ESPECIAL':
        return 'Plano Especial (Isento / PCD)';
      case 'PREFEITURA':
        return 'Prefeitura Municipal';
      case 'BOMBEIROS':
        return 'Corpo de Bombeiros';
      case 'TODAS':
        return 'Todas as Categorias';
      default:
        return cat;
    }
  };

  // OBSERVAÇÃO 01 & 02: O Relatório de Vínculos demonstra SOMENTE os associados que têm a bolinha laranja (hasVinculo),
  // dentro da respectiva categoria onde o relatório foi acionado.
  // OBSERVAÇÃO 04: Ordenado do MAIOR para o MENOR número de plano (getNumericSortKey).
  const associatesWithVinculo = useMemo(() => {
    return cards
      .filter((c) => {
        const matchCategory = selectedCategory === 'TODAS' || c.category === selectedCategory;
        const matchesHasVinculo = hasVinculo(c);
        if (!matchCategory || !matchesHasVinculo) return false;

        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase().trim();
        return (
          String(c.name || '').toLowerCase().includes(term) ||
          String(c.controlNumber || '').toLowerCase().includes(term) ||
          (c.rgOrCpf && String(c.rgOrCpf).toLowerCase().includes(term)) ||
          (c.linkedPlanNumbers && c.linkedPlanNumbers.some((p) => String(p).toLowerCase().includes(term)))
        );
      })
      .sort((a, b) => getNumericSortKey(b) - getNumericSortKey(a));
  }, [cards, selectedCategory, searchTerm]);

  // ID do associado selecionado para visão detalhada
  const [selectedAssociateId, setSelectedAssociateId] = useState<string>(
    initialAssociate?.id || associatesWithVinculo[0]?.id || ''
  );

  // Sincroniza se a lista mudar ou se vier um initialAssociate
  useEffect(() => {
    if (initialAssociate && hasVinculo(initialAssociate)) {
      setSelectedAssociateId(initialAssociate.id);
    } else if (associatesWithVinculo.length > 0) {
      const exists = associatesWithVinculo.some((c) => c.id === selectedAssociateId);
      if (!exists) {
        setSelectedAssociateId(associatesWithVinculo[0].id);
      }
    }
  }, [initialAssociate, associatesWithVinculo, selectedAssociateId]);

  const targetAssociate = useMemo(() => {
    return associatesWithVinculo.find((c) => c.id === selectedAssociateId) || associatesWithVinculo[0] || null;
  }, [associatesWithVinculo, selectedAssociateId]);

  // Busca e correlaciona os vínculos para cada associado
  const getAssociateLinksInfo = (assoc: CardData) => {
    const list = assoc.linkedPlanNumbers || [];
    return list
      .map((planNum, index) => {
        const cleanNum = (planNum || '').trim();
        if (!cleanNum) return null;
        const norm = normalizePlanNumber(cleanNum);

        const matches = cards.filter((c) => {
          if (c.id === assoc.id) return false;
          const cCtrl = String(c.controlNumber || '');
          const cNorm = normalizePlanNumber(cCtrl);
          return (
            cNorm === norm ||
            cNorm.includes(norm) ||
            norm.includes(cNorm) ||
            cCtrl.toLowerCase().includes(cleanNum.toLowerCase())
          );
        });

        return {
          slot: index + 1,
          planNumber: cleanNum,
          status: matches.length > 0 ? ('FOUND' as const) : ('NOT_FOUND' as const),
          foundCards: matches,
        };
      })
      .filter(Boolean) as {
      slot: number;
      planNumber: string;
      status: 'FOUND' | 'NOT_FOUND';
      foundCards: CardData[];
    }[];
  };

  // Mapeamento dos vínculos do associado em foco
  const targetDeclaredLinks = useMemo(() => {
    if (!targetAssociate) return [];
    return getAssociateLinksInfo(targetAssociate);
  }, [targetAssociate, cards]);

  // Busca vínculos reversos (outros que citaram este plano)
  const targetReverseLinks = useMemo(() => {
    if (!targetAssociate) return [];
    const myNorm = normalizePlanNumber(targetAssociate.controlNumber || '');
    if (!myNorm) return [];

    return cards.filter((c) => {
      if (c.id === targetAssociate.id) return false;
      const otherLinks = c.linkedPlanNumbers || [];
      return otherLinks.some((otherNum) => {
        const otherNorm = normalizePlanNumber(otherNum);
        return otherNorm && (myNorm === otherNorm || myNorm.includes(otherNorm) || otherNorm.includes(myNorm));
      });
    });
  }, [targetAssociate, cards]);

  const handlePrint = () => {
    executePrint({
      orientation: 'portrait',
      bodyClass: 'printing-vinculos-report',
      pageMargin: '6mm',
    });
  };

  const handleInspectCard = (c: CardData) => {
    setCurrentView('GID');
    setGidActiveTab('USUARIOS');
    setGidSubTab(c.category);
    openFichaModal(c, 'VIEW');
    onClose();
  };

  if (!isOpen) return null;

  const now = new Date();
  const emissionTimestamp = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-700/60 w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* ================= HEADER DO MODAL (NÃO IMPRESSO) ================= */}
        <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <span className="w-5 h-5 rounded-full bg-orange-500 text-black font-black text-[11px] flex items-center justify-center">
                V
              </span>
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <span>Relatório de Vínculos de Planos</span>
                <span className="px-2 py-0.5 rounded text-[11px] bg-orange-500/20 text-orange-300 border border-orange-500/30 font-medium">
                  {getCategoryLabel(selectedCategory)}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Demonstrativo exclusivo dos associados com vínculo registrado e planos interligados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setReportViewMode('LIST')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  reportViewMode === 'LIST'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Listagem da Categoria ({associatesWithVinculo.length})
              </button>
              <button
                type="button"
                onClick={() => setReportViewMode('DETAIL')}
                disabled={!targetAssociate}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  reportViewMode === 'DETAIL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                } ${!targetAssociate ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Dossiê Individual
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Imprimir Relatório Oficial em Folha A4"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Relatório (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= BARRA DE FILTROS E CATEGORIAS (NÃO IMPRESSA) ================= */}
        <div className="bg-slate-100 p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-bold text-slate-700">Categoria:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as CategoryType | 'TODAS')}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="PLANO_INDIVIDUAL">👤 Plano Individual</option>
                <option value="PLANO_FAMILIAR">👨‍👩‍👦 Plano Familiar</option>
                <option value="PLANO_ESPECIAL">♿ Plano Especial (Isento / PCD)</option>
                <option value="PREFEITURA">🏛️ Prefeitura Municipal</option>
                <option value="BOMBEIROS">🚒 Corpo de Bombeiros</option>
                <option value="TODAS">🌐 Todas as Categorias</option>
              </select>
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por nome, número ou plano..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <span className="w-4 h-4 rounded-full bg-orange-500 text-black font-black text-[9px] flex items-center justify-center">
              V
            </span>
            <span>
              Total com Vínculo:{' '}
              <strong className="text-slate-900 font-bold">{associatesWithVinculo.length} associado(s)</strong>
            </span>
          </div>
        </div>

        {/* ================= CORPO DO RELATÓRIO (IMPRESSO E VISUALIZADO) ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 print:bg-white print:p-0 print:overflow-visible">
          <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 print:max-w-none text-slate-900 text-xs">
            {/* CABEÇALHO OFICIAL INSTITUCIONAL */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {platformSettings?.navbarLogoUrl ? (
                  <img
                    src={platformSettings.navbarLogoUrl}
                    alt="Brasão Pouso Alegre"
                    className="w-14 h-14 object-contain"
                  />
                ) : (
                  <BrasaoPousoAlegre size={52} />
                )}
                <div>
                  <h1 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 leading-tight">
                    Prefeitura Municipal de Pouso Alegre • MG
                  </h1>
                  <h2 className="text-[11px] font-bold text-slate-700 leading-tight">
                    Secretaria Municipal de Esportes e Lazer • Praça de Esportes
                  </h2>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    SISCOP • Sistema Integrado de Segurança e Controle Operacional
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-900 border border-orange-300 rounded font-black text-[10px] uppercase tracking-wide">
                  Relatório de Vínculos
                </span>
                <div className="text-[9.5px] text-slate-500 font-mono mt-1">
                  Emissão: {emissionTimestamp}
                </div>
                <div className="text-[9.5px] text-slate-500">
                  Operador: {currentUser?.name || 'Carlos Alberto'}
                </div>
              </div>
            </div>

            {/* TÍTULO DO DOCUMENTO */}
            <div className="text-center bg-slate-900 text-white py-2 px-4 rounded-lg mb-5 flex items-center justify-between shadow-xs">
              <span className="font-black uppercase tracking-wider text-xs sm:text-sm">
                Relatório de Vínculos de Planos • {getCategoryLabel(selectedCategory)}
              </span>
              <span className="text-[10px] font-mono bg-orange-500 text-black px-2 py-0.5 rounded font-black">
                {associatesWithVinculo.length} Associado(s) com Vínculo [V]
              </span>
            </div>

            {/* AVISO QUANDO NÃO HÁ NENHUM ASSOCIADO COM VÍNCULO NA CATEGORIA */}
            {associatesWithVinculo.length === 0 ? (
              <div className="py-12 px-6 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 mx-auto flex items-center justify-center mb-3">
                  <span className="font-black text-xl">V</span>
                </div>
                <h3 className="font-bold text-slate-800 text-sm mb-1">
                  Nenhum vínculo de plano cadastrado nesta categoria
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  O Relatório de Vínculos demonstra exclusivamente associados que possuem a bolinha laranja [V], ou seja, que tenham algum número de plano preenchido no campo{' '}
                  <strong className="text-slate-700">&quot;Vinculação Identificativa (Vínculos Familiares / Parentescos na Praça de Esportes)&quot;</strong>.
                </p>
              </div>
            ) : reportViewMode === 'LIST' ? (
              /* ================= MODO 1: LISTAGEM GERAL DA CATEGORIA COM PLANOS VINCULADOS ================= */
              <div className="space-y-4">
                <div className="text-[11px] text-slate-600 mb-2 font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  Abaixo constam todos os associados da categoria{' '}
                  <strong className="text-slate-900 font-bold">{getCategoryLabel(selectedCategory)}</strong> que
                  possuem identificador de vínculo [V], ordenados em ordem decrescente pelo número do plano, acompanhados de seus respectivos planos declarados e associados vinculados.
                </div>

                <div className="space-y-3">
                  {associatesWithVinculo.map((assoc, idx) => {
                    const links = getAssociateLinksInfo(assoc);
                    return (
                      <div
                        key={assoc.id}
                        className="border border-slate-300 rounded-xl p-3.5 bg-white hover:bg-slate-50/50 transition-colors shadow-2xs"
                      >
                        {/* Linha do Associado Titular do Vínculo */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-400 text-[10px]">#{idx + 1}</span>

                            {/* Ícone [V] Laranja com V preto */}
                            <span
                              className="w-5 h-5 rounded-full bg-orange-500 text-black font-black text-[10px] flex items-center justify-center shrink-0 shadow-2xs select-none"
                              title="Possui Vínculo com Plano Existente"
                            >
                              V
                            </span>

                            <span className="font-mono font-bold text-slate-900 text-xs px-2 py-0.5 rounded bg-slate-100 border border-slate-300">
                              Nº {assoc.controlNumber}
                            </span>

                            <span className="font-black text-slate-900 text-xs sm:text-sm">
                              {assoc.name}
                            </span>

                            <span className="text-[10px] text-slate-500 font-medium">
                              ({getCategoryLabel(assoc.category)})
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10.5px] text-slate-600 font-mono">
                              CPF/RG: {assoc.rgOrCpf || 'Não informado'}
                            </span>
                            <span
                              className={`text-[9.5px] font-bold px-2 py-0.5 rounded ${
                                assoc.status === 'ATIVO'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {assoc.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedAssociateId(assoc.id);
                                setReportViewMode('DETAIL');
                              }}
                              className="print:hidden text-[10.5px] font-bold text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded hover:bg-blue-50 cursor-pointer"
                            >
                              Ver Dossiê
                            </button>
                          </div>
                        </div>

                        {/* Dados adicionais do associado */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10.5px] text-slate-600 mb-2.5 px-1">
                          <div>
                            <span className="text-slate-400">Telefone:</span>{' '}
                            <strong className="text-slate-800">{assoc.phone || 'S/N'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Arquivo Físico:</span>{' '}
                            <strong className="text-slate-800 font-mono">
                              {assoc.physicalArchiveLocation || 'N/D'}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Endereço:</span>{' '}
                            <span className="text-slate-800 truncate block">
                              {assoc.address || 'Não cadastrado'}
                            </span>
                          </div>
                        </div>

                        {/* Vínculos com Planos Declarados */}
                        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[10.5px] uppercase mb-1.5">
                            <Shield className="w-3.5 h-3.5 text-orange-600" />
                            <span>Vínculo com Plano(s) Existente(s) Registrado(s):</span>
                          </div>

                          {links.length === 0 ? (
                            <span className="text-slate-400 italic text-[10px]">
                              Nenhum plano específico detalhado.
                            </span>
                          ) : (
                            <div className="space-y-1.5">
                              {links.map((link) => (
                                <div
                                  key={link.slot}
                                  className={`p-2 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 ${
                                    link.status === 'FOUND'
                                      ? 'bg-blue-50/70 border-blue-200'
                                      : 'bg-amber-50/70 border-amber-200'
                                  }`}
                                >
                                  <div className="flex items-start sm:items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold text-[9px] flex items-center justify-center shrink-0">
                                      #{link.slot}
                                    </span>
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold text-slate-900 font-mono text-[11px]">
                                          Plano Declarado: {link.planNumber}
                                        </span>
                                        {link.status === 'FOUND' ? (
                                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-1">
                                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                            Localizado no Banco ({link.foundCards.length} membros)
                                          </span>
                                        ) : (
                                          <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-1">
                                            <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                            Plano Informado (Aguardando digitalização no arquivo)
                                          </span>
                                        )}
                                      </div>

                                      {/* Detalhes dos associados encontrados no banco para esse plano */}
                                      {link.foundCards.length > 0 && (
                                        <div className="mt-1 text-[10.5px] text-slate-700 space-y-0.5">
                                          {link.foundCards.map((fc) => (
                                            <div key={fc.id} className="flex items-center gap-2 flex-wrap">
                                              <span className="font-bold text-slate-900">• {fc.name}</span>
                                              <span className="text-slate-500 font-mono">({fc.controlNumber})</span>
                                              <span className="text-[9.5px] text-blue-800 bg-blue-100/90 px-1.5 py-0.2 rounded font-semibold">
                                                {getCategoryLabel(fc.category)} • {fc.isTitular ? 'Titular' : 'Dependente'}
                                              </span>
                                              <span className="text-slate-500">Tel: {fc.phone || 'S/N'}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {link.foundCards[0] && (
                                    <button
                                      type="button"
                                      onClick={() => handleInspectCard(link.foundCards[0])}
                                      className="print:hidden text-[10.5px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 self-end sm:self-center shrink-0 cursor-pointer"
                                      title="Abrir este plano no GID"
                                    >
                                      <span>Ver no GID</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ================= MODO 2: DOSSIÊ INDIVIDUAL COMPLETO DO ASSOCIADO ================= */
              targetAssociate && (
                <div className="space-y-4">
                  {/* Seletor rápido de associado na barra superior do dossiê */}
                  <div className="p-2.5 bg-slate-100 rounded-xl flex items-center justify-between gap-3 print:hidden">
                    <span className="font-bold text-slate-700 text-xs">Associado em Exame:</span>
                    <select
                      value={selectedAssociateId}
                      onChange={(e) => setSelectedAssociateId(e.target.value)}
                      className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 max-w-[360px]"
                    >
                      {associatesWithVinculo.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.controlNumber} - {c.name} ({getCategoryLabel(c.category)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 1. ASSOCIADO CONSULTADO */}
                  <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50/70">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-orange-500 text-black font-black text-[10px] flex items-center justify-center shrink-0 shadow-2xs select-none">
                          V
                        </span>
                        <span className="font-black text-slate-900 uppercase text-[11px] flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          1. Associado de Origem (Consulta Principal)
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10.5px] bg-blue-100 text-blue-900 border border-blue-200">
                        Nº {targetAssociate.controlNumber}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">Nome Completo:</span>
                        <strong className="text-slate-900 text-xs">{targetAssociate.name}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Categoria do Plano:</span>
                        <strong className="text-slate-900">
                          {getCategoryLabel(targetAssociate.category)} ({targetAssociate.isTitular ? 'Titular' : 'Dependente'})
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">CPF / Documento:</span>
                        <strong className="text-slate-900 font-mono">
                          {targetAssociate.rgOrCpf || 'Não informado'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Telefone:</span>
                        <strong className="text-slate-900">{targetAssociate.phone || 'Não informado'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Arquivo Físico:</span>
                        <strong className="text-slate-900 font-mono font-bold">
                          {targetAssociate.physicalArchiveLocation || 'N/D'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Status Cadastral:</span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            targetAssociate.status === 'ATIVO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {targetAssociate.status}
                        </span>
                      </div>
                      <div className="sm:col-span-3">
                        <span className="text-slate-500 block">Endereço Residencial Cadastrado:</span>
                        <span className="text-slate-800 font-medium">
                          {targetAssociate.address || 'Não cadastrado'}
                          {targetAssociate.addressNumber ? `, Nº ${targetAssociate.addressNumber}` : ''}
                          {targetAssociate.addressComplement ? ` - ${targetAssociate.addressComplement}` : ''}
                          {targetAssociate.neighborhood ? ` - Bairro: ${targetAssociate.neighborhood}` : ''}
                          {targetAssociate.cep ? ` - CEP: ${targetAssociate.cep}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. VINCULAÇÃO IDENTIFICATIVA (OS PLANOS INDICADOS) */}
                  <div className="border border-slate-300 rounded-xl p-3.5 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
                      <span className="font-black text-slate-900 uppercase text-[11px] flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-orange-600" />
                        2. Vinculação Identificativa (Planos Indicados na Praça de Esportes)
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Total indicados: {targetDeclaredLinks.length}/5
                      </span>
                    </div>

                    <div className="space-y-2">
                      {targetDeclaredLinks.map((item) => (
                        <div
                          key={item.slot}
                          className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                            item.status === 'FOUND'
                              ? 'bg-blue-50/70 border-blue-200'
                              : 'bg-amber-50/70 border-amber-200'
                          }`}
                        >
                          <div className="flex items-start sm:items-center gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                              #{item.slot}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 font-mono text-xs">
                                  Plano Informado: {item.planNumber}
                                </span>
                                {item.status === 'FOUND' ? (
                                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    Plano Localizado no Banco ({item.foundCards.length} membros)
                                  </span>
                                ) : (
                                  <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[9.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    Plano Informado (Aguardando digitalização no arquivo)
                                  </span>
                                )}
                              </div>

                              {item.foundCards.length > 0 && (
                                <div className="mt-1 text-[10.5px] text-slate-700 space-y-0.5">
                                  {item.foundCards.map((fc) => (
                                    <div key={fc.id} className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold text-slate-900">• {fc.name}</span>
                                      <span className="text-slate-500 font-mono">({fc.controlNumber})</span>
                                      <span className="text-[10px] text-blue-700 bg-blue-100/80 px-1.5 py-0.2 rounded font-medium">
                                        {getCategoryLabel(fc.category)} • {fc.isTitular ? 'Titular' : 'Dependente'}
                                      </span>
                                      <span className="text-slate-500">Tel: {fc.phone || 'S/N'}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {item.foundCards[0] && (
                            <button
                              type="button"
                              onClick={() => handleInspectCard(item.foundCards[0])}
                              className="print:hidden text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 self-end sm:self-center shrink-0 cursor-pointer"
                            >
                              <span>Ver no GID</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. VÍNCULOS CRUZADOS REVERSOS */}
                  {targetReverseLinks.length > 0 && (
                    <div className="border border-purple-200 rounded-xl p-3.5 bg-purple-50/60">
                      <div className="flex items-center justify-between border-b border-purple-200 pb-2 mb-2.5">
                        <span className="font-black text-purple-900 uppercase text-[11px] flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-purple-600" />
                          3. Vínculos Cruzados Encontrados na Base ({targetReverseLinks.length})
                        </span>
                        <span className="text-[10px] text-purple-700">
                          Outros associados que declararam o plano deste associado
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[10.5px]">
                        {targetReverseLinks.map((rev) => (
                          <div
                            key={rev.id}
                            className="p-2 bg-white rounded-lg border border-purple-200 flex items-center justify-between"
                          >
                            <div>
                              <strong className="text-slate-900">{rev.name}</strong>
                              <span className="text-slate-500 font-mono text-[10px] ml-2">
                                (Nº {rev.controlNumber} • {getCategoryLabel(rev.category)})
                              </span>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Endereço: {rev.address || 'N/D'} • Tel: {rev.phone || 'S/N'}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleInspectCard(rev)}
                              className="print:hidden text-[10.5px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              <span>Abrir</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            )}

            {/* ASSINATURAS E VALIDAÇÃO OFICIAL */}
            <div className="pt-6 mt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-[10.5px] text-slate-700">
              <div>
                <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-900">
                  {currentUser?.name || 'Operador Responsável'}
                </div>
                <div className="text-[9.5px] text-slate-500">Operador Emissor • Secretaria Praça de Esportes</div>
              </div>
              <div>
                <div className="border-t border-slate-400 pt-1.5 font-bold text-slate-900">
                  Diretoria Praça de Esportes
                </div>
                <div className="text-[9.5px] text-slate-500">Coordenação Geral e Segurança de Acesso</div>
              </div>
            </div>

            {/* RODAPÉ DO DOCUMENTO */}
            <div className="mt-6 pt-3 border-t border-slate-200 text-center text-[9.5px] text-slate-400 font-mono">
              Documento gerado eletronicamente pelo SISCOP • Praça de Esportes de Pouso Alegre • Autenticidade verificável nos registros internos da Prefeitura Municipal.
            </div>
          </div>
        </div>

        {/* ================= FOOTER DO MODAL (NÃO IMPRESSO) ================= */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0 print:hidden">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span>
              Demonstrando apenas cadastros com a bolinha laranja [V] da categoria {getCategoryLabel(selectedCategory)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Fechar
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Relatório</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
