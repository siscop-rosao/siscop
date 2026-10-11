import React, { useState, useMemo } from 'react';
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
  UserCheck
} from 'lucide-react';
import { CardData } from '../../types';
import { useApp } from '../../context/AppContext';
import { executePrint } from '../../utils/printHelper';
import { BrasaoPousoAlegre } from '../common/BrasaoPousoAlegre';

interface VinculosReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAssociate?: CardData | null;
  onOpenCard?: (card: CardData, mode: 'VIEW' | 'EDIT') => void;
}

export const VinculosReportModal: React.FC<VinculosReportModalProps> = ({
  isOpen,
  onClose,
  initialAssociate,
  onOpenCard,
}) => {
  const { cards, currentUser, platformSettings, setCurrentView, setGidActiveTab, setGidSubTab, openFichaModal } = useApp();

  const [selectedAssociateId, setSelectedAssociateId] = useState<string>(
    initialAssociate ? initialAssociate.id : (cards[0]?.id || '')
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Sincroniza caso abra com outro associado
  React.useEffect(() => {
    if (initialAssociate) {
      setSelectedAssociateId(initialAssociate.id);
    }
  }, [initialAssociate]);

  // Associado selecionado para consulta
  const targetAssociate = useMemo(() => {
    return cards.find((c) => c.id === selectedAssociateId) || initialAssociate || cards[0] || null;
  }, [cards, selectedAssociateId, initialAssociate]);

  // Lista de associados filtrados para o dropdown de busca
  const filteredAssociates = useMemo(() => {
    if (!searchTerm.trim()) return cards.slice(0, 20);
    const term = searchTerm.toLowerCase().trim();
    return cards.filter(
      (c) =>
        String(c.name || '').toLowerCase().includes(term) ||
        String(c.controlNumber || '').toLowerCase().includes(term) ||
        (c.rgOrCpf && String(c.rgOrCpf).toLowerCase().includes(term)) ||
        (c.phone && String(c.phone).includes(term))
    );
  }, [cards, searchTerm]);

  // Função auxiliar para normalizar número de plano para busca flexível
  const normalizePlanNumber = (val: string): string => {
    return val.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  };

  // Mapeamento dos vínculos declarados no cadastro (até 5 planos)
  const declaredLinks = useMemo(() => {
    if (!targetAssociate) return [];
    const list = targetAssociate.linkedPlanNumbers || [];
    return list.map((planNum, index) => {
      const cleanNum = planNum.trim();
      if (!cleanNum) {
        return { slot: index + 1, planNumber: '', status: 'EMPTY' as const, foundCards: [] };
      }

      const norm = normalizePlanNumber(cleanNum);

      // Busca cartões cujo número de controle seja igual ou contenha o número informado
      const matches = cards.filter((c) => {
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
    });
  }, [targetAssociate, cards]);

  // Busca Vínculos Reversos: outros associados que declararam o plano deste associado
  const reverseLinks = useMemo(() => {
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

  // Busca membros da mesma família se for plano familiar
  const familyMembers = useMemo(() => {
    if (!targetAssociate) return [];
    if (targetAssociate.isTitular) {
      return cards.filter((c) => c.familyHeadId === targetAssociate.id);
    } else if (targetAssociate.familyHeadId) {
      const titular = cards.find((c) => c.id === targetAssociate.familyHeadId);
      const siblings = cards.filter((c) => c.familyHeadId === targetAssociate.familyHeadId && c.id !== targetAssociate.id);
      return titular ? [titular, ...siblings] : siblings;
    }
    return [];
  }, [targetAssociate, cards]);

  // Estatísticas consolidadas do círculo de vínculos
  const stats = useMemo(() => {
    const uniqueCardsMap = new Map<string, CardData>();

    if (targetAssociate) {
      uniqueCardsMap.set(targetAssociate.id, targetAssociate);
    }

    familyMembers.forEach((m) => uniqueCardsMap.set(m.id, m));
    declaredLinks.forEach((dl) => {
      dl.foundCards.forEach((c) => uniqueCardsMap.set(c.id, c));
    });
    reverseLinks.forEach((c) => uniqueCardsMap.set(c.id, c));

    const totalAssociatesInCircle = uniqueCardsMap.size;
    const allInCircle = Array.from(uniqueCardsMap.values());
    const plansCount = new Set(allInCircle.map((c) => {
      const parts = String(c.controlNumber || '').split('-');
      return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : String(c.controlNumber || '');
    })).size || declaredLinks.filter(d => d.planNumber).length + 1;

    return {
      totalAssociatesInCircle,
      plansCount,
      activeCount: allInCircle.filter((c) => c.status === 'ATIVO').length,
    };
  }, [targetAssociate, familyMembers, declaredLinks, reverseLinks]);

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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-700/60 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* ================= HEADER DO MODAL (NÃO IMPRESSO) ================= */}
        <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">Relatório: Vínculos Existentes</h2>
              <p className="text-[11px] text-slate-400">
                Agrupamento, mapeamento de convivência e parentescos cadastrais
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Imprimir Relatório em Folha A4"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Relatório (A4)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Fechar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================= BARRA DE SELEÇÃO DE ASSOCIADO (NÃO IMPRESSA) ================= */}
        <div className="bg-slate-100 p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <span className="font-bold text-slate-700 whitespace-nowrap">Selecionar Associado:</span>
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por nome, CPF ou controle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={selectedAssociateId}
              onChange={(e) => setSelectedAssociateId(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 max-w-[240px]"
            >
              {filteredAssociates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.controlNumber} - {c.name} ({c.category})
                </option>
              ))}
            </select>
          </div>

          <div className="text-[11px] text-slate-500">
            Total no banco: <strong className="text-slate-800">{cards.length} associados</strong>
          </div>
        </div>

        {/* ================= CORPO DO RELATÓRIO (IMPRESSO E VISUALIZADO) ================= */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 print:bg-white print:p-0 print:overflow-visible">
          <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 print:max-w-none text-slate-900 text-xs">
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
                <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 rounded font-black text-[10px] uppercase tracking-wide">
                  Relatório Oficial
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
            <div className="text-center bg-slate-900 text-white py-2 px-4 rounded-lg mb-5 font-black uppercase tracking-wider text-xs sm:text-sm shadow-xs">
              Relatório de Vínculos Existentes e Círculos Familiares
            </div>

            {/* 1. ASSOCIADO CONSULTADO */}
            {targetAssociate ? (
              <div className="border border-slate-300 rounded-xl p-3.5 mb-4 bg-slate-50/70">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
                  <span className="font-black text-slate-900 uppercase text-[11px] flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    1. Associado de Origem (Consulta Principal)
                  </span>
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
                      {targetAssociate.category} ({targetAssociate.isTitular ? 'Titular' : 'Dependente'})
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">CPF / Documento:</span>
                    <strong className="text-slate-900 font-mono">{targetAssociate.rgOrCpf || 'Não informado'}</strong>
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
            ) : (
              <div className="p-4 text-center text-slate-500">Nenhum associado selecionado.</div>
            )}

            {/* 2. VINCULAÇÃO IDENTIFICATIVA (OS 5 ESPAÇOS CADASTRADOS) */}
            <div className="border border-slate-300 rounded-xl p-3.5 mb-4 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
                <span className="font-black text-slate-900 uppercase text-[11px] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  2. Vinculação Identificativa (Espaços de Planos Indicados)
                </span>
                <span className="text-[10px] text-slate-500">
                  Total de espaços declarados: {declaredLinks.filter((d) => d.planNumber).length}/5
                </span>
              </div>

              {declaredLinks.filter((d) => d.planNumber).length === 0 ? (
                <div className="p-3 text-center bg-slate-50 rounded-lg text-slate-500 text-[11px] italic">
                  Nenhum número de plano existente foi declarado no campo &quot;Vinculação Identificativa&quot; deste associado.
                </div>
              ) : (
                <div className="space-y-2">
                  {declaredLinks
                    .filter((d) => d.planNumber)
                    .map((item) => (
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
                                  Plano Não Localizado Diretamente
                                </span>
                              )}
                            </div>

                            {/* Detalhes dos associados encontrados para esse plano */}
                            {item.foundCards.length > 0 && (
                              <div className="mt-1 text-[10.5px] text-slate-700 space-y-0.5">
                                {item.foundCards.map((fc) => (
                                  <div key={fc.id} className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-slate-900">• {fc.name}</span>
                                    <span className="text-slate-500 font-mono">({fc.controlNumber})</span>
                                    <span className="text-[10px] text-blue-700 bg-blue-100/80 px-1.5 py-0.2 rounded font-medium">
                                      {fc.category} • {fc.isTitular ? 'Titular' : 'Dependente'}
                                    </span>
                                    <span className="text-slate-500">Tel: {fc.phone || 'S/N'}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Botão para inspecionar ficha (apenas na tela) */}
                        {item.foundCards[0] && (
                          <button
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
              )}
            </div>

            {/* 3. VÍNCULOS DE MESMO PLANO FAMILIAR (SE HOUVER) */}
            {familyMembers.length > 0 && (
              <div className="border border-slate-300 rounded-xl p-3.5 mb-4 bg-slate-50/70">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
                  <span className="font-black text-slate-900 uppercase text-[11px] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    3. Membros Familiares no Mesmo Plano ({familyMembers.length})
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {targetAssociate?.familyName || 'Núcleo Familiar'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px]">
                  {familyMembers.map((fam) => (
                    <div key={fam.id} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                      <div>
                        <strong className="text-slate-900 block">{fam.name}</strong>
                        <span className="text-slate-500 font-mono text-[10px]">
                          {fam.controlNumber} • {fam.isTitular ? 'Titular' : 'Dependente'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {fam.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. VÍNCULOS REVERSOS (OUTROS ASSOCIADOS QUE INDICARAM ESTE PLANO) */}
            {reverseLinks.length > 0 && (
              <div className="border border-slate-300 rounded-xl p-3.5 mb-4 bg-purple-50/60 border-purple-200">
                <div className="flex items-center justify-between border-b border-purple-200 pb-2 mb-2.5">
                  <span className="font-black text-purple-900 uppercase text-[11px] flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-600" />
                    4. Vínculos Cruzados Encontrados na Base ({reverseLinks.length})
                  </span>
                  <span className="text-[10px] text-purple-700">
                    Associados que declararam o plano deste titular
                  </span>
                </div>

                <div className="space-y-1.5 text-[10.5px]">
                  {reverseLinks.map((rev) => (
                    <div key={rev.id} className="p-2 bg-white rounded-lg border border-purple-200 flex items-center justify-between">
                      <div>
                        <strong className="text-slate-900">{rev.name}</strong>
                        <span className="text-slate-500 font-mono text-[10px] ml-2">
                          (Nº {rev.controlNumber} • {rev.category})
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Endereço: {rev.address || 'N/D'} • Tel: {rev.phone || 'S/N'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleInspectCard(rev)}
                        className="print:hidden text-[10.5px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 shrink-0"
                      >
                        <span>Abrir</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. RESUMO ESTATÍSTICO DO CÍRCULO DE CONVIVÊNCIA */}
            <div className="border-2 border-slate-900 rounded-xl p-3.5 mb-6 bg-slate-900 text-white">
              <div className="font-black uppercase tracking-wider text-[11px] mb-2 flex items-center justify-between">
                <span>5. Síntese do Círculo de Convivência & Frequência</span>
                <span className="text-[10px] text-blue-300 font-mono">Controle de Segurança SISCOP</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Planos Interligados</div>
                  <div className="text-base sm:text-lg font-black text-blue-400">{stats.plansCount}</div>
                </div>
                <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Associados no Círculo</div>
                  <div className="text-base sm:text-lg font-black text-emerald-400">
                    {stats.totalAssociatesInCircle}
                  </div>
                </div>
                <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Situação Regular</div>
                  <div className="text-base sm:text-lg font-black text-white">
                    {stats.activeCount} Ativos
                  </div>
                </div>
              </div>
            </div>

            {/* ASSINATURAS E VALIDAÇÃO OFICIAL */}
            <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-[10.5px] text-slate-700">
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
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Mapeamento em tempo real pronto para impressão e arquivo</span>
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
