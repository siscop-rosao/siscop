import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PopProcedure, PopCategory, PopPricingTables } from '../../types';
import { BrasaoPousoAlegre } from '../common/BrasaoPousoAlegre';
import { executePrint } from '../../utils/printHelper';
import {
  ArrowLeft,
  BookOpen,
  Search,
  Plus,
  Printer,
  ChevronDown,
  ChevronUp,
  FileText,
  Shield,
  HelpCircle,
  Clock,
  UserCheck,
  AlertTriangle,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Scale,
  Pin,
  GripVertical,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Table,
  Save,
  RotateCcw,
} from 'lucide-react';

const CATEGORY_LABELS: Record<PopCategory, { label: string; color: string }> = {
  SECRETARIA: { label: 'Secretaria & Atendimento', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  CARTEIRINHAS: { label: 'Carteirinhas & GDA', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  PLANO_ESPECIAL: { label: 'Plano Especial & Isenções', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  PISCINAS: { label: 'Piscinas & Exame Médico', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  CHURRASQUEIRA: { label: 'Quiosques de Churrasqueira', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  CONDUTA: { label: 'Código de Conduta & Convivência', color: 'bg-purple-100 text-purple-800 border-purple-200' },
};

export const PopModule: React.FC = () => {
  const {
    setCurrentView,
    popProcedures,
    addPopProcedure,
    updatePopProcedure,
    deletePopProcedure,
    togglePinPop,
    reorderPopProcedures,
    currentUser,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PopCategory | 'ALL'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(popProcedures[0]?.id || null);

  // Drag & Drop State
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Editable Pricing Tables State for a specific POP
  const [editingPricingPopId, setEditingPricingPopId] = useState<string | null>(null);
  const [pricingEditData, setPricingEditData] = useState<PopPricingTables | null>(null);

  // Modal Create/Edit General POP
  const [showModal, setShowModal] = useState(false);
  const [editingPop, setEditingPop] = useState<PopProcedure | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    category: 'SECRETARIA' as PopCategory,
    objective: '',
    targetAudience: '',
    responsible: '',
    prerequisitesText: '',
    stepsText: '',
    importantNotes: '',
    legalBasis: '',
  });

  const handleOpenCreate = () => {
    setEditingPop(null);
    setFormData({
      code: `POP-${Date.now().toString().slice(-4)}`,
      title: '',
      category: 'SECRETARIA',
      objective: '',
      targetAudience: 'Atendentes da Secretaria e Cidadãos',
      responsible: currentUser?.name || 'Operador',
      prerequisitesText: '',
      stepsText: '',
      importantNotes: '',
      legalBasis: 'Regulamento Interno da Secretaria Municipal de Esportes de Pouso Alegre',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (pop: PopProcedure) => {
    setEditingPop(pop);
    setFormData({
      code: pop.code,
      title: pop.title,
      category: pop.category,
      objective: pop.objective,
      targetAudience: pop.targetAudience,
      responsible: pop.responsible,
      prerequisitesText: pop.prerequisites ? pop.prerequisites.join('\n') : '',
      stepsText: pop.steps.join('\n'),
      importantNotes: pop.importantNotes || '',
      legalBasis: pop.legalBasis || '',
    });
    setShowModal(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.code.trim()) return;

    const prereqs = formData.prerequisitesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const steps = formData.stepsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingPop) {
      updatePopProcedure(editingPop.id, {
        code: formData.code,
        title: formData.title,
        category: formData.category,
        objective: formData.objective,
        targetAudience: formData.targetAudience,
        responsible: formData.responsible,
        prerequisites: prereqs,
        steps: steps.length > 0 ? steps : ['1. Executar conforme diretriz geral da Secretaria.'],
        importantNotes: formData.importantNotes,
        legalBasis: formData.legalBasis,
      });
    } else {
      addPopProcedure({
        code: formData.code,
        title: formData.title,
        category: formData.category,
        objective: formData.objective,
        targetAudience: formData.targetAudience,
        responsible: formData.responsible,
        prerequisites: prereqs,
        steps: steps.length > 0 ? steps : ['1. Executar conforme diretriz geral da Secretaria.'],
        importantNotes: formData.importantNotes,
        legalBasis: formData.legalBasis,
      });
    }

    setShowModal(false);
  };

  const handleDelete = (id: string, code: string) => {
    if (window.confirm(`Tem certeza de que deseja remover o procedimento ${code}?`)) {
      deletePopProcedure(id);
    }
  };

  const handlePrintManual = () => {
    executePrint({
      orientation: 'portrait',
      bodyClass: 'printing-pop-manual',
      pageMargin: '8mm',
    });
  };

  // Drag and Drop Handler
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverId !== id) {
      setDragOverId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const fromIdx = popProcedures.findIndex((p) => p.id === draggedId);
    const toIdx = popProcedures.findIndex((p) => p.id === targetId);

    if (fromIdx !== -1 && toIdx !== -1) {
      const updated = [...popProcedures];
      const [removed] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, removed);
      reorderPopProcedures(updated);
    }

    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const movePopPosition = (id: string, direction: 'up' | 'down') => {
    const idx = popProcedures.findIndex((p) => p.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= popProcedures.length) return;

    const updated = [...popProcedures];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    reorderPopProcedures(updated);
  };

  // Pricing tables edit handlers
  const handleStartEditPricing = (pop: PopProcedure) => {
    if (!pop.pricingTables) return;
    setEditingPricingPopId(pop.id);
    setPricingEditData(JSON.parse(JSON.stringify(pop.pricingTables)));
  };

  const handleSavePricing = (popId: string) => {
    if (!pricingEditData) return;
    updatePopProcedure(popId, { pricingTables: pricingEditData });
    setEditingPricingPopId(null);
    setPricingEditData(null);
  };

  const handleCancelEditPricing = () => {
    setEditingPricingPopId(null);
    setPricingEditData(null);
  };

  // Filtered procedures
  const filtered = popProcedures.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesQuery =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.objective.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.steps.some((step) => step.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-100">
      <div id="pop-interactive-view" className="flex-1 flex flex-col overflow-hidden">
        {/* ================= SUB-HEADER ================= */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('DASHBOARD')}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Voltar ao Painel Geral"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              Procedimentos Operacionais Padrão (POP)
              <span className="bg-amber-100 text-amber-900 text-xs px-2 py-0.5 rounded-full font-bold">
                {popProcedures.length} Normativas
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Instruções, normas, regras de atendimento, condutas e tabelas oficiais da Praça de Esportes
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 font-medium">
            <GripVertical className="w-3.5 h-3.5 text-slate-400" />
            <span>Arraste para posicionar • Use o Pin para fixar</span>
          </div>

          <button
            onClick={handlePrintManual}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors"
            title="Imprimir Manual de Procedimentos para consulta física"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Imprimir Manual POP</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Procedimento</span>
          </button>
        </div>
      </header>

      {/* ================= SEARCH & CATEGORY BAR ================= */}
      <div className="bg-white px-4 sm:px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por código, título, regra ou palavra-chave..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({popProcedures.length})
          </button>

          {(Object.keys(CATEGORY_LABELS) as PopCategory[]).map((cat) => {
            const count = popProcedures.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
                  selectedCategory === cat
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{CATEGORY_LABELS[cat].label}</span>
                <span className="text-[10px] opacity-75 font-mono">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= PROCEDURES LIST (DRAG & DROP + PIN) ================= */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200 max-w-lg mx-auto space-y-3">
            <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-800 text-sm">Nenhum procedimento localizado</h3>
            <p className="text-xs text-slate-500">
              Não encontramos nenhum POP correspondente aos filtros de busca informados.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('ALL');
              }}
              className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-semibold border border-amber-200"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          filtered.map((pop, pIdx) => {
            const isExpanded = expandedId === pop.id;
            const catInfo = CATEGORY_LABELS[pop.category];
            const isPinned = !!pop.isPinned;
            const isDragging = draggedId === pop.id;
            const isOver = dragOverId === pop.id;

            return (
              <div
                key={pop.id}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, pop.id)}
                onDragOver={(e) => handleDragOver(e, pop.id)}
                onDrop={(e) => handleDrop(e, pop.id)}
                onDragEnd={handleDragEnd}
                className={`bg-white rounded-xl border transition-all shadow-xs relative ${
                  isOver ? 'border-amber-500 ring-2 ring-amber-300 scale-[1.01]' : ''
                } ${
                  isPinned
                    ? 'border-red-300 bg-gradient-to-r from-red-50/20 via-white to-white'
                    : isExpanded
                    ? 'border-amber-400 ring-2 ring-amber-100'
                    : 'border-slate-200 hover:border-slate-300'
                } ${isDragging ? 'opacity-50' : 'opacity-100'}`}
              >
                {/* Header Row */}
                <div className="p-4 sm:p-5 flex items-center justify-between gap-3 select-none">
                  {/* LADO ESQUERDO: PIN no canto superior esquerdo + Alça de arrasto + Código */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {/* Botão de PIN:
                        - Quando não acionado: fica em branco, somente com o desenho de contorno do ícone (linha fina preta).
                        - Quando acionado: o Pin adota a cor vermelha.
                    */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePinPop(pop.id);
                      }}
                      title={
                        isPinned
                          ? 'POP Fixado nesta posição (Clique para desfixar)'
                          : 'Fixar este POP nesta posição'
                      }
                      className="p-1 rounded-lg hover:bg-slate-100 transition-all flex items-center justify-center cursor-pointer group"
                    >
                      <Pin
                        className={`w-4 h-4 transition-all duration-200 ${
                          isPinned
                            ? 'text-red-600 fill-red-600 stroke-red-600 drop-shadow-xs scale-110'
                            : 'text-slate-900 fill-white stroke-slate-900 stroke-[1.5] group-hover:scale-110'
                        }`}
                      />
                    </button>

                    {/* Alça de Arrastar (Grip) e botões rápidos de subir/descer */}
                    <div className="flex items-center gap-0.5 text-slate-400">
                      <div
                        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                        title="Segure e arraste para reposicionar este POP"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="hidden sm:flex flex-col">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            movePopPosition(pop.id, 'up');
                          }}
                          disabled={pIdx === 0}
                          title="Mover para cima"
                          className="text-slate-300 hover:text-slate-700 disabled:opacity-20 disabled:hover:text-slate-300"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            movePopPosition(pop.id, 'down');
                          }}
                          disabled={pIdx === filtered.length - 1}
                          title="Mover para baixo"
                          className="text-slate-300 hover:text-slate-700 disabled:opacity-20 disabled:hover:text-slate-300"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <span className="font-mono font-bold text-xs bg-slate-900 text-amber-300 px-2 py-1 rounded shrink-0 shadow-2xs">
                      {pop.code}
                    </span>
                  </div>

                  {/* CENTRO: Título e Categoria */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : pop.id)}
                    className="min-w-0 flex-1 cursor-pointer pl-1"
                  >
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                        {pop.title}
                      </h3>
                      <span
                        className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${catInfo.color}`}
                      >
                        {catInfo.label}
                      </span>
                      {isPinned && (
                        <span className="bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.2 rounded-full flex items-center gap-1">
                          <Pin className="w-2.5 h-2.5 fill-red-600 stroke-red-600" />
                          Fixado
                        </span>
                      )}
                      {pop.pricingTables && (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.2 rounded-full flex items-center gap-1">
                          <DollarSign className="w-2.5 h-2.5" />
                          Tabelas Editáveis
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{pop.objective}</p>
                  </div>

                  {/* LADO DIREITO: Data de Atualização e Chevron */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : pop.id)}
                    className="flex items-center gap-3 shrink-0 cursor-pointer"
                  >
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Atualizado em {pop.updatedAt}</span>
                    </div>

                    <div className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-slate-100 space-y-5 text-xs text-slate-700">
                    {/* Metadados: Responsável e Público */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                          <UserCheck className="w-4 h-4 text-blue-600" />
                          Responsável pela Execução:
                        </span>
                        <p className="text-slate-600 pl-5 font-medium">{pop.responsible}</p>
                      </div>

                      <div>
                        <span className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                          <Shield className="w-4 h-4 text-emerald-600" />
                          Público Alvo / Destinatários:
                        </span>
                        <p className="text-slate-600 pl-5 font-medium">{pop.targetAudience}</p>
                      </div>
                    </div>

                    {/* SEÇÃO ESPECIAL: TABELAS DE VALORES EDITÁVEIS (quando disponível neste POP) */}
                    {pop.pricingTables && (
                      <div className="bg-slate-50 border-2 border-amber-300/80 rounded-xl p-4 sm:p-5 space-y-5 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-amber-600 text-white rounded-lg">
                              <Table className="w-4 h-4" />
                            </span>
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">
                                Tabelas Oficiais de Valores, Inscrição e Mensalidades
                              </h4>
                              <p className="text-[11px] text-slate-500">
                                Valores homologados pela Secretaria Municipal de Esportes • Editáveis pelo operador
                              </p>
                            </div>
                          </div>

                          {/* Botão de Edição das Tabelas */}
                          {editingPricingPopId === pop.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={handleCancelEditPricing}
                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Cancelar</span>
                              </button>
                              <button
                                onClick={() => handleSavePricing(pop.id)}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs transition-colors"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Salvar Alterações da Tabela</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEditPricing(pop)}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Editar Valores da Tabela</span>
                            </button>
                          )}
                        </div>

                        {/* MODO DE EDIÇÃO ATIVO */}
                        {editingPricingPopId === pop.id && pricingEditData ? (
                          <div className="space-y-5 bg-white p-4 rounded-xl border border-amber-300">
                            <div className="bg-amber-50 text-amber-900 p-2.5 rounded-lg border border-amber-200 text-xs font-semibold flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>
                                Modo de Edição Ativo: Altere os valores desejados abaixo e clique em "Salvar Alterações da Tabela".
                              </span>
                            </div>

                            {/* Editar Primeira Tabela */}
                            <div>
                              <h5 className="font-bold text-slate-800 text-xs uppercase mb-2">
                                [ PRIMEIRA TABELA • EVENTOS FAMILIAR e INDIVIDUAL ]
                              </h5>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs border border-slate-300">
                                  <thead className="bg-slate-800 text-white">
                                    <tr>
                                      <th className="p-2 text-left">EVENTOS</th>
                                      <th className="p-2 text-center w-36">FAMILIAR (R$)</th>
                                      <th className="p-2 text-center w-36">INDIVIDUAL (R$)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200 font-medium">
                                    {pricingEditData.eventsTable.map((row, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50">
                                        <td className="p-2 font-bold text-slate-800">{row.event}</td>
                                        <td className="p-2 text-center">
                                          <input
                                            type="text"
                                            value={row.familiar}
                                            onChange={(e) => {
                                              const updated = [...pricingEditData.eventsTable];
                                              updated[idx].familiar = e.target.value;
                                              setPricingEditData({ ...pricingEditData, eventsTable: updated });
                                            }}
                                            className="w-24 text-center px-2 py-1 border border-slate-300 rounded font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                                          />
                                        </td>
                                        <td className="p-2 text-center">
                                          <input
                                            type="text"
                                            value={row.individual}
                                            onChange={(e) => {
                                              const updated = [...pricingEditData.eventsTable];
                                              updated[idx].individual = e.target.value;
                                              setPricingEditData({ ...pricingEditData, eventsTable: updated });
                                            }}
                                            className="w-24 text-center px-2 py-1 border border-slate-300 rounded font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                                          />
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Editar Segunda Tabela */}
                            <div>
                              <h5 className="font-bold text-slate-800 text-xs uppercase mb-2">
                                [ SEGUNDA TABELA - PLANO FAMILIAR (Nº DE FAMÍLIAS x 1º PAGAMENTO) ]
                              </h5>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs border border-slate-300">
                                  <thead className="bg-slate-800 text-white">
                                    <tr>
                                      <th colSpan={2} className="p-2 text-center font-bold tracking-wider uppercase border-b border-slate-700">
                                        PLANO FAMILIAR
                                      </th>
                                    </tr>
                                    <tr className="bg-slate-700">
                                      <th className="p-2 text-center w-1/2">Nº DE FAMÍLIAS</th>
                                      <th className="p-2 text-center w-1/2">VALOR DO 1º PAGAMENTO (R$)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200 font-medium">
                                    {pricingEditData.familyQuantityTable.map((row, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50">
                                        <td className="p-2 text-center font-mono font-bold text-slate-800">
                                          {row.familyCount}
                                        </td>
                                        <td className="p-2 text-center">
                                          <input
                                            type="text"
                                            value={row.firstPaymentValue}
                                            onChange={(e) => {
                                              const updated = [...pricingEditData.familyQuantityTable];
                                              updated[idx].firstPaymentValue = e.target.value;
                                              setPricingEditData({ ...pricingEditData, familyQuantityTable: updated });
                                            }}
                                            className="w-28 text-center px-2 py-1 border border-slate-300 rounded font-mono font-bold text-emerald-700 focus:ring-2 focus:ring-blue-500"
                                          />
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Editar Informativos */}
                            <div>
                              <h5 className="font-bold text-slate-800 text-xs uppercase mb-2">
                                [ VALORES INFORMATIVOS ]
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {pricingEditData.infoNotes.map((info, idx) => (
                                  <div key={idx} className="p-2.5 bg-slate-50 border border-slate-300 rounded-lg">
                                    <label className="text-[11px] font-bold text-slate-700 block mb-1">{info.label}:</label>
                                    <input
                                      type="text"
                                      value={info.value}
                                      onChange={(e) => {
                                        const updated = [...pricingEditData.infoNotes];
                                        updated[idx].value = e.target.value;
                                        setPricingEditData({ ...pricingEditData, infoNotes: updated });
                                      }}
                                      className="w-full text-center px-2 py-1 border border-slate-300 rounded font-mono font-bold text-blue-700"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* MODO DE VISUALIZAÇÃO OFICIAL DAS TABELAS */
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                            {/* [ PRIMEIRA TABELA ] */}
                            <div className="bg-white rounded-xl border border-slate-300 overflow-hidden shadow-2xs">
                              <div className="bg-slate-800 text-white px-4 py-2.5 text-center">
                                <span className="font-bold text-xs uppercase tracking-wide">
                                  [ PRIMEIRA TABELA • EVENTOS FAMILIAR E INDIVIDUAL ]
                                </span>
                              </div>

                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                    <th className="p-2.5 text-left pl-4 w-5/12">EVENTOS</th>
                                    <th className="p-2.5 text-center w-4/12">FAMILIAR</th>
                                    <th className="p-2.5 text-center w-3/12 pr-4">INDIVIDUAL</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                  {pop.pricingTables.eventsTable.map((item, idx) => (
                                    <tr
                                      key={idx}
                                      className={`hover:bg-slate-50 transition-colors ${
                                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                                      }`}
                                    >
                                      <td className="p-2.5 font-bold text-slate-800 pl-4 w-5/12">{item.event}</td>
                                      <td className="p-2.5 text-center font-mono font-bold text-indigo-700 w-4/12">
                                        R$ {item.familiar}
                                      </td>
                                      <td className="p-2.5 text-center font-mono font-bold text-emerald-700 w-3/12 pr-4">
                                        R$ {item.individual}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* [ SEGUNDA TABELA ] */}
                            <div className="bg-white rounded-xl border border-slate-300 overflow-hidden shadow-2xs">
                              <div className="bg-slate-800 text-white px-4 py-2.5 text-center font-bold text-xs uppercase tracking-wide">
                                [ SEGUNDA TABELA • PLANO FAMILIAR ]
                              </div>

                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="bg-indigo-900 text-white font-bold text-center border-b border-indigo-800">
                                    <th colSpan={2} className="py-1.5 uppercase text-[11px] tracking-wider">
                                      PLANO FAMILIAR
                                    </th>
                                  </tr>
                                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                    <th className="p-2.5 text-center w-1/2">Nº DE FAMÍLIAS</th>
                                    <th className="p-2.5 text-center w-1/2">VALOR DO 1º PAGAMENTO</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                  {pop.pricingTables.familyQuantityTable.map((row, idx) => (
                                    <tr
                                      key={idx}
                                      className={`hover:bg-slate-50 transition-colors ${
                                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'
                                      }`}
                                    >
                                      <td className="p-2.5 text-center font-mono font-bold text-slate-800">
                                        {row.familyCount}
                                      </td>
                                      <td className="p-2.5 text-center font-mono font-bold text-emerald-700">
                                        R$ {row.firstPaymentValue}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* [ INFORMATIVOS DE VALORES ] */}
                            <div className="lg:col-span-2 bg-amber-50/80 border border-amber-200 rounded-xl p-3.5">
                              <div className="text-xs font-bold text-amber-950 uppercase tracking-wider mb-2.5">
                                INFORMATIVOS DE VALORES:
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                {/* Sub quadro MENSAL com linha delimitadora de contorno */}
                                <div className="bg-white border-2 border-amber-300 rounded-xl p-3 shadow-2xs">
                                  <div className="text-xs font-bold text-amber-900 uppercase tracking-wider border-b border-amber-200 pb-1 mb-2">
                                    MENSAL
                                  </div>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                                      <span className="font-semibold text-slate-700">Individual</span>
                                      <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                        R$ 10,00
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                      <span className="font-semibold text-slate-700">Familiar</span>
                                      <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                        R$ 20,00
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Sub quadro 1º MÊS com linha delimitadora de contorno */}
                                <div className="bg-white border-2 border-amber-300 rounded-xl p-3 shadow-2xs">
                                  <div className="text-xs font-bold text-amber-900 uppercase tracking-wider border-b border-amber-200 pb-1 mb-2">
                                    1º MÊS
                                  </div>
                                  <div className="space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                                      <span className="font-semibold text-slate-700">Plano Individual</span>
                                      <span className="font-mono font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                        R$ 40,00
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                      <span className="font-semibold text-slate-700">Familiar</span>
                                      <span className="text-xs font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 italic">
                                        (vide tabela acima)
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Objetivo */}
                    <div>
                      <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
                        1. Objetivo do Procedimento
                      </h4>
                      <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-700 leading-relaxed font-medium">
                        {pop.objective}
                      </p>
                    </div>

                    {/* Pré-requisitos & Documentos */}
                    {pop.prerequisites && pop.prerequisites.length > 0 && (
                      <div>
                        <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1.5">
                          2. Documentação e Pré-Requisitos Exigidos
                        </h4>
                        <ul className="space-y-1.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                          {pop.prerequisites.map((req, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="font-medium text-slate-700">{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Passo a Passo Operacional */}
                    <div>
                      <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">
                        3. Instruções e Passo a Passo Operacional
                      </h4>
                      <div className="space-y-2">
                        {pop.steps.map((step, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200 shadow-2xs"
                          >
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="font-medium text-slate-800 leading-relaxed">
                              {step}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Observações Críticas e Alertas */}
                    {pop.importantNotes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-amber-900 block mb-0.5">
                            Atenção / Ponto de Atenção Crítico:
                          </span>
                          <p className="text-amber-800 leading-relaxed font-medium">
                            {pop.importantNotes}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Base Legal */}
                    {pop.legalBasis && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-100">
                        <Scale className="w-3.5 h-3.5 text-slate-400" />
                        <span>Base Legal / Regulamentação: {pop.legalBasis}</span>
                      </div>
                    )}

                    {/* Footer Actions (Edit / Delete) */}
                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">
                        Cadastrado por: {pop.createdBy} • Código Oficial {pop.code}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(pop)}
                          className="flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Editar Informações Gerais</span>
                        </button>

                        <button
                          onClick={() => handleDelete(pop.id, pop.code)}
                          className="flex items-center gap-1 px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Excluir</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ================= MODAL NOVO / EDITAR POP ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 my-8">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">
                  {editingPop ? 'Editar Procedimento Operacional (POP)' : 'Novo Procedimento Operacional (POP)'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Código do POP *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Título do Procedimento *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Normas de Emissão de 2ª Via"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as PopCategory })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    {(Object.keys(CATEGORY_LABELS) as PopCategory[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Responsável pela Execução</label>
                  <input
                    type="text"
                    value={formData.responsible}
                    onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                    placeholder="Ex: Atendente da Secretaria"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Público Alvo</label>
                  <input
                    type="text"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    placeholder="Ex: Cidadãos / Frequentadores"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">1. Objetivo do Procedimento *</label>
                <textarea
                  required
                  rows={2}
                  value={formData.objective}
                  onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                  placeholder="Descreva a finalidade desta regra..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  2. Documentos e Pré-Requisitos (um por linha)
                </label>
                <textarea
                  rows={2}
                  value={formData.prerequisitesText}
                  onChange={(e) => setFormData({ ...formData, prerequisitesText: e.target.value })}
                  placeholder="Documento com foto&#10;Comprovante de residência"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  3. Passo a Passo Operacional * (um passo por linha)
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.stepsText}
                  onChange={(e) => setFormData({ ...formData, stepsText: e.target.value })}
                  placeholder="1. Solicitar os documentos ao requerente&#10;2. Consultar o histórico no GID&#10;3. Cadastrar dados e emitir carteirinha"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Ponto de Atenção / Observações Críticas (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={formData.importantNotes}
                  onChange={(e) => setFormData({ ...formData, importantNotes: e.target.value })}
                  placeholder="Avisos sobre penalidades, proibições..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Base Legal / Normativa (Opcional)</label>
                <input
                  type="text"
                  value={formData.legalBasis}
                  onChange={(e) => setFormData({ ...formData, legalBasis: e.target.value })}
                  placeholder="Ex: Lei Municipal nº 1234/2024"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Salvar Procedimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

      {/* ================= MANUAL POP OFICIAL IMPRIMÍVEL (EXIBIDO NA IMPRESSÃO) ================= */}
      <div id="pop-printable-manual" className="hidden print:block p-6 sm:p-10 bg-white text-black font-sans">
        {/* Cabeçalho Oficial do Manual */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-center gap-4">
            <BrasaoPousoAlegre size={60} />
            <div>
              <h1 className="font-bold text-base text-slate-900 uppercase">
                Prefeitura Municipal de Pouso Alegre - MG
              </h1>
              <h2 className="font-semibold text-xs text-slate-700 uppercase">
                Secretaria Municipal de Esportes e Lazer • Praça de Esportes Pref. Alvarim Vieira Rios
              </h2>
              <div className="font-black text-xs text-amber-800 tracking-wide mt-1">
                MANUAL DE PROCEDIMENTOS OPERACIONAIS PADRÃO (POP) • SISCOP
              </div>
            </div>
          </div>
          <div className="text-right text-xs font-mono">
            <div className="font-bold text-slate-900">Emissão Oficial</div>
            <div className="text-[10px] text-slate-600">{new Date().toLocaleDateString('pt-BR')}</div>
            <div className="text-[10px] text-slate-600">{popProcedures.length} Procedimentos Normatizados</div>
          </div>
        </div>

        {/* Sumário Resumido */}
        <div className="mb-8 p-4 bg-slate-50 border border-slate-300 rounded-lg">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-2 border-b border-slate-200 pb-1">
            Índice de Normativas Operacionais
          </h3>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            {popProcedures.map((proc, idx) => (
              <div key={proc.id} className="flex items-center justify-between py-0.5 border-b border-dashed border-slate-200">
                <span className="font-bold font-mono text-slate-800">{proc.code}</span>
                <span className="text-slate-700 truncate pl-2">{proc.title}</span>
                <span className="text-[10px] text-slate-500 font-mono pl-1">#{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fichas Detalhadas de cada POP */}
        <div className="space-y-8">
          {popProcedures.map((proc) => (
            <div key={proc.id} className="p-4 border-2 border-slate-800 rounded-lg break-inside-avoid">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3 bg-slate-100 p-2 -m-4 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm bg-black text-white px-2 py-0.5 rounded">
                    {proc.code}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 uppercase">
                    {proc.title}
                  </h4>
                </div>
                <div className="text-xs font-semibold text-slate-700 uppercase">
                  {CATEGORY_LABELS[proc.category]?.label || proc.category}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mb-3 border-b border-slate-200 pb-2">
                <div>
                  <span className="font-bold text-slate-700">Responsável:</span>{' '}
                  <span className="text-slate-900 font-semibold">{proc.responsible}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Base Legal / Portaria:</span>{' '}
                  <span className="text-slate-900">{proc.legalBasis || 'Regimento Geral da PMPA'}</span>
                </div>
              </div>

              <div className="text-xs mb-3">
                <strong className="block text-slate-800 uppercase tracking-wide text-[11px] mb-0.5">
                  Objetivo:
                </strong>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-2 rounded border border-slate-200">
                  {proc.objective}
                </p>
              </div>

              {proc.prerequisites && proc.prerequisites.length > 0 && (
                <div className="text-xs mb-3">
                  <strong className="block text-slate-800 uppercase tracking-wide text-[11px] mb-0.5">
                    Pré-requisitos e Documentação:
                  </strong>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 pl-1">
                    {proc.prerequisites.map((pre, pIdx) => (
                      <li key={pIdx}>{pre}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="text-xs mb-3">
                <strong className="block text-slate-800 uppercase tracking-wide text-[11px] mb-1">
                  Passo a Passo de Execução:
                </strong>
                <div className="space-y-1">
                  {proc.steps.map((step, sIdx) => (
                    <div key={sIdx} className="p-1.5 bg-slate-50 border-l-2 border-slate-700 text-slate-800 text-[11px] leading-snug">
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              {proc.importantNotes && (
                <div className="text-xs bg-amber-50 border border-amber-200 p-2 rounded text-amber-900 text-[11px]">
                  <strong>Atenção / Cuidados Críticos:</strong> {proc.importantNotes}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Termo de Homologação e Assinaturas */}
        <div className="mt-12 pt-8 border-t-2 border-slate-800 break-inside-avoid">
          <div className="text-center font-bold text-xs uppercase tracking-wider text-slate-900 mb-8">
            Termo de Homologação e Responsabilidade Técnica
          </div>
          <div className="grid grid-cols-2 gap-12 text-center text-xs">
            <div>
              <div className="border-b border-slate-800 pb-1 mb-1 font-bold">
                Secretaria Municipal de Esportes e Lazer
              </div>
              <div className="text-[10px] text-slate-600">Diretoria Geral • Pouso Alegre - MG</div>
            </div>
            <div>
              <div className="border-b border-slate-800 pb-1 mb-1 font-bold">
                Responsável Técnico Operacional
              </div>
              <div className="text-[10px] text-slate-600">Gestão e Fiscalização SISCOP</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
