import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CardData, CategoryType, BarbecueReservation } from '../../types';
import { RichTextEditor } from '../common/RichTextEditor';
import { AnnualChurrasqueiraCalendar } from './AnnualChurrasqueiraCalendar';
import { FichaCadastralModal } from './FichaCadastralModal';
import { VinculosReportModal } from './VinculosReportModal';
import { formatBirthDate, formatPhoneNumber, formatCpfNumber, formatCepNumber, hasVinculo, getNumericSortKey } from '../../utils/formatters';
import {
  Users,
  Flame,
  Search,
  Plus,
  Edit,
  Trash2,
  Printer,
  Calendar,
  Phone,
  FileText,
  UserPlus,
  ArrowLeft,
  Clock,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  ChevronDown,
  ChevronUp,
  Link2,
  ArrowRight,
} from 'lucide-react';

export const GidModule: React.FC = () => {
  const {
    currentUser,
    cards,
    addCard,
    updateCard,
    deleteCard,
    addFamilyMember,
    openCardInGda,
    gidActiveTab,
    setGidActiveTab,
    gidSubTab,
    setGidSubTab,
    reservations,
    addReservation,
    updateReservation,
    deleteReservation,
    setCurrentView,
    openFichaModal,
    gidSearchTerm,
    setGidSearchTerm,
  } = useApp();

  // Search filter
  const [searchTerm, setSearchTerm] = useState(gidSearchTerm || '');

  useEffect(() => {
    if (gidSearchTerm !== undefined) {
      setSearchTerm(gidSearchTerm);
    }
  }, [gidSearchTerm]);

  // Selected card for notepad modal / drawer
  const [editingCardNotes, setEditingCardNotes] = useState<CardData | null>(null);
  const [currentNoteHtml, setCurrentNoteHtml] = useState<string>('');
  const [noteSavedIndicator, setNoteSavedIndicator] = useState(false);

  // Ficha Cadastral Handler
  const handleOpenFicha = (card: CardData, mode: 'VIEW' | 'EDIT') => {
    openFichaModal(card, mode);
  };

  // New member modal
  const [showNewMemberModal, setShowNewMemberModal] = useState(false);
  const [docType, setDocType] = useState<'CPF' | 'RG' | 'LAUDO'>('CPF');
  const procuracaoDateInputRef = useRef<HTMLInputElement>(null);

  const [newMemberData, setNewMemberData] = useState({
    name: '',
    birthDate: '',
    phone: '',
    rgOrCpf: '',
    address: '',
    addressNumber: '',
    addressComplement: '',
    neighborhood: '',
    cep: '',
    category: gidSubTab as CategoryType,
    isTitular: true,
    specialCondition: '',
    linkedPlanNumbers: ['', '', '', '', ''],
    procuracao: {
      hasProcuracao: false,
      dataProcuracao: '',
      nomeOutorgado: '',
      cpfOutorgado: '',
      autorizacoes: {
        retiradaCarteirinha: false,
        retiradaBoletos: false,
        cancelamentoPlano: false,
      },
    },
    notesHtml: '',
  });

  // Relatório de Vínculos Existentes modal
  const [showVinculosModal, setShowVinculosModal] = useState(false);
  const [vinculosTargetAssociate, setVinculosTargetAssociate] = useState<CardData | null>(null);

  // Resultados da busca de vínculo nos 5 espaços
  const [linkedPlanSearchResults, setLinkedPlanSearchResults] = useState<
    Record<number, { text: string; success: boolean; foundCard?: CardData } | null>
  >({});

  const handleSearchLinkedPlan = (index: number, planNum: string) => {
    const clean = planNum.trim();
    if (!clean) {
      setLinkedPlanSearchResults((prev) => ({
        ...prev,
        [index]: { text: 'Informe um número de plano para pesquisar.', success: false },
      }));
      return;
    }

    const norm = clean.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const found = cards.find((c) => {
      const cCtrl = String(c?.controlNumber || '');
      const cNorm = cCtrl.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      return (
        (norm && cNorm === norm) ||
        (norm && cNorm.includes(norm)) ||
        (norm && norm.includes(cNorm)) ||
        cCtrl.toLowerCase().includes(clean.toLowerCase())
      );
    });

    if (found) {
      setLinkedPlanSearchResults((prev) => ({
        ...prev,
        [index]: {
          text: `✓ Localizado: ${found.name} (${found.controlNumber} • ${found.category})`,
          success: true,
          foundCard: found,
        },
      }));
    } else {
      setLinkedPlanSearchResults((prev) => ({
        ...prev,
        [index]: {
          text: `Plano "${clean}" não encontrado no banco de dados.`,
          success: false,
        },
      }));
    }
  };

  // Keep modal category in sync when tab changes and ensure Plano Familiar families are retracted by default
  useEffect(() => {
    setNewMemberData((prev) => ({ ...prev, category: gidSubTab as CategoryType }));
    if (gidSubTab === 'PLANO_FAMILIAR') {
      setExpandedFamilyIds({});
    }
  }, [gidSubTab]);

  // Add dependent modal
  const [showAddDependentModal, setShowAddDependentModal] = useState(false);
  const [targetTitular, setTargetTitular] = useState<CardData | null>(null);
  const [addDependentToast, setAddDependentToast] = useState<string | null>(null);
  const [deleteFeedbackToast, setDeleteFeedbackToast] = useState<string | null>(null);

  const handleDeleteCard = (card: CardData) => {
    deleteCard(card.id);
    setDeleteFeedbackToast(`Cadastro "${card.name}" (Nº ${card.controlNumber}) excluído permanentemente.`);
    setTimeout(() => setDeleteFeedbackToast(null), 4000);
  };
  const [dependentFormData, setDependentFormData] = useState({
    name: '',
    birthDate: '',
    rgOrCpf: '',
    phone: '',
    notesHtml: '',
    kinship: '',
    docJud: false,
  });
  const [depDocType, setDepDocType] = useState<'CPF' | 'RG'>('CPF');
  const depDateInputRef = useRef<HTMLInputElement>(null);

  // Controle de expansão/retração dos membros dependentes por titular do plano familiar (por padrão RETRAÍDAS)
  const [expandedFamilyIds, setExpandedFamilyIds] = useState<Record<string, boolean>>({});

  const toggleFamilyExpand = (titularId: string) => {
    setExpandedFamilyIds((prev) => ({
      ...prev,
      [titularId]: !prev[titularId],
    }));
  };

  // Barbecue modal
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState<BarbecueReservation | null>(null);
  const [resFormData, setResFormData] = useState<{
    kioskNumber: number;
    date: string;
    timeSlot: 'MANHA_TARDE' | 'INTEGRAL' | 'NOITE';
    responsibleName: string;
    responsiblePhone: string;
    responsiblePlanNumber: string;
    responsibleCategory: CategoryType;
    participantsInput: string;
    observations: string;
    status: 'CONFIRMADA' | 'PENDENTE' | 'CANCELADA' | 'CONCLUIDA';
  }>({
    kioskNumber: 1,
    date: new Date().toISOString().split('T')[0],
    timeSlot: 'MANHA_TARDE',
    responsibleName: '',
    responsiblePhone: '',
    responsiblePlanNumber: '',
    responsibleCategory: 'PLANO_INDIVIDUAL',
    participantsInput: '',
    observations: '',
    status: 'CONFIRMADA',
  });

  // Filter cards by subTab and search (sempre ordenados do maior para o menor número de plano)
  const filteredCards = useMemo(() => {
    const list = cards.filter((c) => {
      if (c.category !== gidSubTab) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(term) ||
        c.controlNumber.toLowerCase().includes(term) ||
        (c.phone && c.phone.includes(term)) ||
        (c.specialCondition && c.specialCondition.toLowerCase().includes(term)) ||
        (c.notesHtml && c.notesHtml.toLowerCase().includes(term))
      );
    });

    return list.sort((a, b) => {
      const numA = getNumericSortKey(a);
      const numB = getNumericSortKey(b);
      if (numB !== numA) return numB - numA;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [cards, gidSubTab, searchTerm]);

  // In Family Plan, group by titular (sempre ordenados do maior para o menor número de plano)
  const titularsInSubTab = useMemo(() => {
    let list: CardData[] = [];
    if (gidSubTab !== 'PLANO_FAMILIAR') {
      list = filteredCards.filter((c) => c.isTitular);
    } else {
      const allFamCards = cards.filter((c) => c.category === 'PLANO_FAMILIAR');
      const allTitulars = allFamCards.filter((c) => c.isTitular);

      if (!searchTerm) {
        list = allTitulars;
      } else {
        const term = searchTerm.toLowerCase();
        list = allTitulars.filter((titular) => {
          // 1. O próprio titular combina com a busca
          const titularMatches =
            titular.name.toLowerCase().includes(term) ||
            titular.controlNumber.toLowerCase().includes(term) ||
            (titular.phone && titular.phone.includes(term)) ||
            (titular.notesHtml && titular.notesHtml.toLowerCase().includes(term));

          if (titularMatches) return true;

          // 2. Ou algum de seus dependentes combina com a busca
          const hasMatchingDependent = allFamCards.some(
            (c) =>
              c.familyHeadId === titular.id &&
              c.id !== titular.id &&
              (c.name.toLowerCase().includes(term) ||
                c.controlNumber.toLowerCase().includes(term) ||
                (c.notesHtml && c.notesHtml.toLowerCase().includes(term)))
          );

          return hasMatchingDependent;
        });
      }
    }

    return list.sort((a, b) => {
      const numA = getNumericSortKey(a);
      const numB = getNumericSortKey(b);
      if (numB !== numA) return numB - numA;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [cards, gidSubTab, searchTerm, filteredCards]);

  // Open Notes editor for a card
  const handleOpenNotes = (card: CardData) => {
    setEditingCardNotes(card);
    setCurrentNoteHtml(card.notesHtml || '');
  };

  const handleSaveNotes = () => {
    if (editingCardNotes) {
      updateCard(editingCardNotes.id, { notesHtml: currentNoteHtml });
      setNoteSavedIndicator(true);
      setTimeout(() => setNoteSavedIndicator(false), 2000);
    }
  };

  // Create new member submit
  const handleCreateMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberData.name.trim()) return;

    const isSpecial = newMemberData.category === 'PLANO_ESPECIAL';
    const hasProc =
      newMemberData.procuracao.hasProcuracao ||
      Boolean(newMemberData.procuracao.nomeOutorgado?.trim()) ||
      Boolean(newMemberData.procuracao.dataProcuracao);

    addCard({
      name: newMemberData.name,
      birthDate: newMemberData.birthDate,
      phone: newMemberData.phone,
      rgOrCpf: newMemberData.rgOrCpf,
      address: newMemberData.address,
      addressNumber: newMemberData.addressNumber,
      addressComplement: newMemberData.addressComplement,
      neighborhood: newMemberData.neighborhood,
      cep: newMemberData.cep,
      linkedPlanNumbers: newMemberData.linkedPlanNumbers.map((p) => p.trim()).filter(Boolean),
      procuracao: hasProc
        ? {
            hasProcuracao: true,
            dataProcuracao: newMemberData.procuracao.dataProcuracao,
            nomeOutorgado: newMemberData.procuracao.nomeOutorgado?.trim(),
            cpfOutorgado: newMemberData.procuracao.cpfOutorgado?.trim(),
            autorizacoes: newMemberData.procuracao.autorizacoes,
          }
        : undefined,
      category: newMemberData.category,
      planType: isSpecial
        ? 'ESPECIAL'
        : newMemberData.category === 'PLANO_FAMILIAR'
        ? 'FAMILIAR'
        : 'INDIVIDUAL',
      isTitular: true,
      isSpecialExempt: isSpecial,
      specialCondition: isSpecial ? newMemberData.specialCondition || 'PCD / Necessidade Especial' : undefined,
      notesHtml: newMemberData.notesHtml.trim()
        ? newMemberData.notesHtml
        : `<div><strong>Registro criado em:</strong> ${new Date().toLocaleDateString('pt-BR')}</div>${
            isSpecial
              ? `<p><strong>Condição / Benefício:</strong> ${newMemberData.specialCondition || 'Plano Especial Isento'} - Isenção integral de mensalidade.</p>`
              : ''
          }`,
    });

    setShowNewMemberModal(false);
    setNewMemberData({
      name: '',
      birthDate: '',
      phone: '',
      rgOrCpf: '',
      address: '',
      addressNumber: '',
      addressComplement: '',
      neighborhood: '',
      cep: '',
      category: gidSubTab as CategoryType,
      isTitular: true,
      specialCondition: '',
      linkedPlanNumbers: ['', '', '', '', ''],
      procuracao: {
        hasProcuracao: false,
        dataProcuracao: '',
        nomeOutorgado: '',
        cpfOutorgado: '',
        autorizacoes: {
          retiradaCarteirinha: false,
          retiradaBoletos: false,
          cancelamentoPlano: false,
        },
      },
      notesHtml: '',
    });
    setLinkedPlanSearchResults({});
    setDocType('CPF');
  };

  // Add dependent submit
  const handleAddDependentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetTitular) {
      alert('Selecione uma família antes de adicionar o dependente.');
      return;
    }
    const nameClean = (dependentFormData.name || '').trim();
    if (!nameClean) {
      alert('Por favor, informe o Nome Completo do dependente.');
      return;
    }

    try {
      const formattedDoc =
        depDocType === 'CPF' && dependentFormData.rgOrCpf
          ? formatCpfNumber(dependentFormData.rgOrCpf)
          : dependentFormData.rgOrCpf;

      const created = addFamilyMember(targetTitular.id, {
        name: nameClean,
        birthDate: dependentFormData.birthDate,
        rgOrCpf: formattedDoc,
        phone: dependentFormData.phone || targetTitular.phone,
        notesHtml: dependentFormData.notesHtml,
        kinship: dependentFormData.kinship || undefined,
        docJud: !!dependentFormData.docJud,
        physicalArchiveLocation: targetTitular.physicalArchiveLocation || '',
      });

      // Auto-expand esta família para que o dependente recém-criado seja exibido imediatamente
      setExpandedFamilyIds((prev) => ({
        ...prev,
        [targetTitular.id]: true,
      }));

      setShowAddDependentModal(false);
      setAddDependentToast(
        `Dependente "${created.name}" gravado com sucesso no Plano Familiar (Nº ${created.controlNumber})!`
      );
      setTimeout(() => setAddDependentToast(null), 4000);

      setTargetTitular(null);
      setDependentFormData({
        name: '',
        birthDate: '',
        rgOrCpf: '',
        phone: '',
        notesHtml: '',
        kinship: '',
        docJud: false,
      });
      setDepDocType('CPF');
    } catch (err: any) {
      console.error('Falha ao adicionar dependente:', err);
      alert('Não foi possível gravar o dependente: ' + (err?.message || 'Erro desconhecido.'));
    }
  };

  // Open reservation modal
  const handleOpenNewReservation = () => {
    setEditingReservation(null);
    setResFormData({
      kioskNumber: 1,
      date: new Date().toISOString().split('T')[0],
      timeSlot: 'MANHA_TARDE',
      responsibleName: '',
      responsiblePhone: '',
      responsiblePlanNumber: '',
      responsibleCategory: 'PLANO_INDIVIDUAL',
      participantsInput: '',
      observations: '',
      status: 'CONFIRMADA',
    });
    setShowReservationModal(true);
  };

  const handleOpenReservationForDate = (dateStr: string) => {
    setEditingReservation(null);
    setResFormData({
      kioskNumber: 1,
      date: dateStr,
      timeSlot: 'MANHA_TARDE',
      responsibleName: '',
      responsiblePhone: '',
      responsiblePlanNumber: '',
      responsibleCategory: 'PLANO_INDIVIDUAL',
      participantsInput: '',
      observations: '',
      status: 'CONFIRMADA',
    });
    setShowReservationModal(true);
  };

  const handleEditReservation = (res: BarbecueReservation) => {
    setEditingReservation(res);
    setResFormData({
      kioskNumber: res.kioskNumber,
      date: res.date,
      timeSlot: res.timeSlot,
      responsibleName: res.responsibleName,
      responsiblePhone: res.responsiblePhone,
      responsiblePlanNumber: res.responsiblePlanNumber || '',
      responsibleCategory: res.responsibleCategory,
      participantsInput: res.participantsList.join('\n'),
      observations: res.observations,
      status: res.status,
    });
    setShowReservationModal(true);
  };

  const handleSaveReservationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resFormData.responsibleName.trim()) return;

    const participants = resFormData.participantsInput
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);

    if (editingReservation) {
      updateReservation(editingReservation.id, {
        kioskNumber: resFormData.kioskNumber,
        date: resFormData.date,
        timeSlot: resFormData.timeSlot,
        responsibleName: resFormData.responsibleName,
        responsiblePhone: resFormData.responsiblePhone,
        responsiblePlanNumber: resFormData.responsiblePlanNumber,
        responsibleCategory: resFormData.responsibleCategory,
        participantsList: participants,
        observations: resFormData.observations,
        status: resFormData.status,
      });
    } else {
      addReservation({
        kioskNumber: resFormData.kioskNumber,
        date: resFormData.date,
        timeSlot: resFormData.timeSlot,
        responsibleName: resFormData.responsibleName,
        responsiblePhone: resFormData.responsiblePhone,
        responsiblePlanNumber: resFormData.responsiblePlanNumber,
        responsibleCategory: resFormData.responsibleCategory,
        participantsList: participants,
        observations: resFormData.observations,
        status: resFormData.status,
      });
    }

    setShowReservationModal(false);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-100">
      {/* ================= GID HEADER ================= */}
      <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('DASHBOARD')}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Voltar ao Painel Geral"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-600 text-white font-bold text-xs px-2 py-0.5 rounded shadow-2xs">
                GID
              </span>
              <h1 className="text-base font-bold text-slate-900">
                Gerenciamento de Informações Diversas
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Controle de usuários por planos com bloco de notas formatado e reservas de churrasqueiras
            </p>
          </div>
        </div>

        {/* PRIMARY TABS: Usuários vs Churrasqueira */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setGidActiveTab('USUARIOS')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              gidActiveTab === 'USUARIOS'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuários / Frequentadores</span>
          </button>

          <button
            onClick={() => setGidActiveTab('CHURRASQUEIRA')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              gidActiveTab === 'CHURRASQUEIRA'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Churrasqueira (Quiosques)</span>
          </button>
        </div>
      </header>

      {/* ================= ABA USUÁRIOS ================= */}
      {gidActiveTab === 'USUARIOS' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* SUB-ABAS: Prefeitura, Bombeiros, Plano Individual, Plano Familiar, Plano Especial */}
          <div className="bg-white border-b border-slate-200 px-6 pt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setGidSubTab('PREFEITURA')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  gidSubTab === 'PREFEITURA'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Prefeitura (PMPA)</span>
                <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                  {cards.filter((c) => c.category === 'PREFEITURA').length}
                </span>
              </button>

              <button
                onClick={() => setGidSubTab('BOMBEIROS')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  gidSubTab === 'BOMBEIROS'
                    ? 'border-rose-600 text-rose-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Bombeiros (CBMMG)</span>
                <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                  {cards.filter((c) => c.category === 'BOMBEIROS').length}
                </span>
              </button>

              <button
                onClick={() => setGidSubTab('PLANO_INDIVIDUAL')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  gidSubTab === 'PLANO_INDIVIDUAL'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Plano Individual</span>
                <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                  {cards.filter((c) => c.category === 'PLANO_INDIVIDUAL').length}
                </span>
              </button>

              {/* Plano Familiar */}
              <button
                onClick={() => setGidSubTab('PLANO_FAMILIAR')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  gidSubTab === 'PLANO_FAMILIAR'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Plano Familiar</span>
                <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                  {cards.filter((c) => c.category === 'PLANO_FAMILIAR').length}
                </span>
              </button>

              {/* NOVA ABA: PLANO ESPECIAL (Fica ao lado do Plano Familiar) */}
              <button
                onClick={() => setGidSubTab('PLANO_ESPECIAL')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  gidSubTab === 'PLANO_ESPECIAL'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Plano Especial</span>
                </div>
                <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                  {cards.filter((c) => c.category === 'PLANO_ESPECIAL').length}
                </span>
              </button>
            </div>

            {/* Sub-bar Actions: Search + New Member */}
            <div className="pb-3 flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome, número de controle ou notas..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setGidSearchTerm(e.target.value);
                  }}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg w-64 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {gidSubTab === 'PLANO_FAMILIAR' && titularsInSubTab.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const allOpen = titularsInSubTab.every((t) => expandedFamilyIds[t.id] !== false);
                    const nextState: Record<string, boolean> = {};
                    titularsInSubTab.forEach((t) => {
                      nextState[t.id] = !allOpen;
                    });
                    setExpandedFamilyIds(nextState);
                  }}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Expandir ou recolher todos os dependentes de todas as famílias"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {titularsInSubTab.every((t) => expandedFamilyIds[t.id] !== false)
                      ? 'Recolher Todas as Famílias'
                      : 'Expandir Todas as Famílias'}
                  </span>
                </button>
              )}

              <button
                onClick={() => {
                  const firstWithVinculo =
                    filteredCards.find((c) => hasVinculo(c)) ||
                    cards.find((c) => c.category === gidSubTab && hasVinculo(c)) ||
                    null;
                  setVinculosTargetAssociate(firstWithVinculo);
                  setShowVinculosModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="Emitir Relatório de Vínculos Existentes da Categoria Selecionada"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Relatório de Vínculos</span>
              </button>

              <button
                onClick={() => {
                  setNewMemberData({
                    name: '',
                    birthDate: '',
                    phone: '',
                    rgOrCpf: '',
                    address: '',
                    addressNumber: '',
                    addressComplement: '',
                    neighborhood: '',
                    cep: '',
                    category: gidSubTab as CategoryType,
                    isTitular: true,
                    specialCondition: '',
                    linkedPlanNumbers: ['', '', '', '', ''],
                    procuracao: {
                      hasProcuracao: false,
                      dataProcuracao: '',
                      nomeOutorgado: '',
                      cpfOutorgado: '',
                      autorizacoes: {
                        retiradaCarteirinha: false,
                        retiradaBoletos: false,
                        cancelamentoPlano: false,
                      },
                    },
                    notesHtml: '',
                  });
                  setLinkedPlanSearchResults({});
                  setShowNewMemberModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Novo Cadastro</span>
              </button>
            </div>
          </div>

          {/* BANNER INFORMATIVO SE FOR PLANO ESPECIAL */}
          {gidSubTab === 'PLANO_ESPECIAL' && (
            <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-950">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-emerald-900">
                    Plano Especial • Beneficiários Isentos de Pagamento
                  </span>
                  <p className="text-emerald-800 text-[11px]">
                    Destinado a pessoas PCD, idosos (60+), autistas (TEA), Síndrome de Down e necessidades especiais. 
                    <strong> Todas as pessoas incluídas neste plano ficam 100% excluídas de pagamento de mensalidades na Praça de Esportes.</strong>
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline bg-emerald-200/80 text-emerald-900 font-bold px-2.5 py-1 rounded text-[11px]">
                Gratuidade Legal Garantida
              </span>
            </div>
          )}

          {/* TOAST DE SUCESSO AO ADICIONAR DEPENDENTE */}
          {addDependentToast && (
            <div className="bg-emerald-600 text-white px-6 py-2.5 flex items-center justify-between text-xs font-bold shadow-xs transition-all">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                <span>{addDependentToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setAddDependentToast(null)}
                className="text-emerald-200 hover:text-white cursor-pointer px-1.5 py-0.5 rounded hover:bg-emerald-700"
              >
                ✕
              </button>
            </div>
          )}

          {/* TOAST DE FEEDBACK AO EXCLUIR CADASTRO */}
          {deleteFeedbackToast && (
            <div className="bg-slate-900 text-white px-6 py-2.5 flex items-center justify-between text-xs font-bold shadow-xs transition-all border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{deleteFeedbackToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setDeleteFeedbackToast(null)}
                className="text-slate-300 hover:text-white cursor-pointer px-1.5 py-0.5 rounded hover:bg-slate-800"
              >
                ✕
              </button>
            </div>
          )}

          {/* TABLE / LIST OF MEMBERS WITH CONTROL NUMBERS & FORMATTED NOTEPAD */}
          <div className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Nº de Controle</th>
                    <th className="py-3 px-4">Frequentador / Titular</th>
                    <th className="py-3 px-4">Nascimento</th>
                    <th className="py-3 px-4">Bloco de Notas (Informações Pertinentes)</th>
                    <th className="py-3 px-4">Status / Mensalidade</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {gidSubTab === 'PLANO_FAMILIAR' ? (
                    // GROUPED BY FAMILY
                    titularsInSubTab.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400">
                          Nenhum cadastro de Plano Familiar encontrado.
                        </td>
                      </tr>
                    ) : (
                      titularsInSubTab.map((titular) => {
                        const dependents = cards.filter(
                          (c) => c.category === 'PLANO_FAMILIAR' && c.familyHeadId === titular.id && c.id !== titular.id
                        );
                        const isExpanded = expandedFamilyIds[titular.id] !== undefined ? expandedFamilyIds[titular.id] : true;
                        return (
                          <React.Fragment key={titular.id}>
                            {/* Titular Row - Sempre Visível */}
                            <tr className="bg-indigo-50/40 hover:bg-indigo-50/70 transition-colors">
                              <td className="py-3 px-4">
                                <span className="font-mono font-bold text-indigo-900 bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200">
                                  {titular.controlNumber}
                                </span>
                                <span className="block text-[9.5px] text-indigo-700 font-bold uppercase mt-1">
                                  ★ Titular
                                </span>
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-900">
                                {titular.name}
                                {titular.familyName && (
                                  <span className="block text-[10px] text-slate-500 font-normal">
                                    {titular.familyName}
                                  </span>
                                )}
                                {!isExpanded && dependents.length > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => toggleFamilyExpand(titular.id)}
                                    className="inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-100/90 hover:bg-indigo-200 px-2 py-0.5 rounded-full font-bold mt-1 transition-colors cursor-pointer border border-indigo-200"
                                    title="Clique para expandir os membros da família"
                                  >
                                    <ChevronDown className="w-3 h-3 text-indigo-600" />
                                    <span>+{dependents.length} membro(s) recolhido(s)</span>
                                  </button>
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-600">{titular.birthDate}</td>
                              <td className="py-3 px-4 max-w-xs">
                                <div
                                  onClick={() => handleOpenNotes(titular)}
                                  className="group cursor-pointer p-2 bg-white rounded border border-slate-200 hover:border-blue-400 transition-all text-[11px] shadow-2xs max-h-16 overflow-hidden relative"
                                  title="Clique para abrir e editar o bloco de notas formatado"
                                >
                                  {titular.notesHtml ? (
                                    <div
                                      dangerouslySetInnerHTML={{ __html: titular.notesHtml }}
                                      className="prose prose-xs text-slate-700 pointer-events-none line-clamp-2"
                                    />
                                  ) : (
                                    <span className="text-slate-400 italic">
                                      Nenhuma nota cadastrada. Clique para adicionar.
                                    </span>
                                  )}
                                  <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white p-0.5 rounded text-[9px] flex items-center gap-0.5">
                                    <Edit className="w-2.5 h-2.5" /> Editar
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  {titular.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Ícone [V]: Vínculo com outro plano existente */}
                                  {hasVinculo(titular) && (
                                    <span
                                      className="w-5 h-5 rounded-full bg-orange-500 text-black font-extrabold text-[10px] flex items-center justify-center shrink-0 shadow-2xs select-none"
                                      title={
                                        titular.linkedPlanNumbers?.some((p) => p && p.trim())
                                          ? `Possui Vínculo com plano(s): ${titular.linkedPlanNumbers.filter((p) => p && p.trim()).join(', ')}`
                                          : 'Possui Vínculo com Plano Existente'
                                      }
                                    >
                                      V
                                    </span>
                                  )}

                                  {/* Ícone [J]: DOC JUD */}
                                  {titular.docJud && (
                                    <span
                                      className="w-5 h-5 rounded-full bg-yellow-400 text-black font-extrabold text-[10px] flex items-center justify-center shrink-0 shadow-2xs select-none"
                                      title="Possui Vínculo Judicial (DOC JUD)"
                                    >
                                      J
                                    </span>
                                  )}

                                  {/* Ícone do Olho: Abre Ficha Cadastral em modo Visualização */}
                                  <button
                                    onClick={() => handleOpenFicha(titular, 'VIEW')}
                                    className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                    title="Visualizar Ficha Cadastral Completa"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>

                                  {/* Ícone de Editar: Abre Ficha Cadastral com Abas editáveis */}
                                  <button
                                    onClick={() => handleOpenFicha(titular, 'EDIT')}
                                    className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                    title="Editar Ficha Cadastral e Demonstrativo de Pagamento"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => {
                                      setTargetTitular(titular);
                                      setShowAddDependentModal(true);
                                    }}
                                    className="px-2 py-1 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded text-[11px] font-semibold flex items-center gap-1"
                                    title="Adicionar dependente a esta família"
                                  >
                                    <UserPlus className="w-3 h-3" /> + Dep.
                                  </button>
                                  <button
                                    onClick={() => openCardInGda(titular)}
                                    className="px-2.5 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                                    title="Emitir/Imprimir Carteirinha no GDA"
                                  >
                                    <Printer className="w-3 h-3" /> Carteirinha
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCard(titular)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                                    title="Excluir titular e dependentes"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Seta vertical ao lado direito do botão Lixeira */}
                                  <button
                                    type="button"
                                    onClick={() => toggleFamilyExpand(titular.id)}
                                    className={`p-1 rounded transition-colors ml-0.5 ${
                                      dependents.length === 0
                                        ? 'text-slate-300 cursor-not-allowed opacity-40'
                                        : isExpanded
                                        ? 'text-indigo-600 hover:text-indigo-900 hover:bg-indigo-100 cursor-pointer'
                                        : 'text-indigo-700 bg-indigo-100 hover:bg-indigo-200 cursor-pointer shadow-2xs'
                                    }`}
                                    disabled={dependents.length === 0}
                                    title={
                                      dependents.length === 0
                                        ? 'Nenhum dependente cadastrado para este plano'
                                        : isExpanded
                                        ? `Recolher ${dependents.length} membro(s) dependente(s)`
                                        : `Expandir ${dependents.length} membro(s) dependente(s)`
                                    }
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4 text-indigo-700" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 text-indigo-700" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* Nested Dependents Rows - Rendered only if family is expanded */}
                            {isExpanded && dependents.map((dep) => (
                              <tr key={dep.id} className="bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                                <td className="py-2.5 px-4 pl-8">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-slate-400">└</span>
                                    <span className="font-mono text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-300 text-[11px]">
                                      {dep.controlNumber}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-4 text-slate-700">
                                  <span className="font-medium">{dep.name}</span>
                                  <span className="text-[10px] text-slate-500 ml-1.5 font-medium">
                                    {dep.kinship
                                      ? `(${dep.kinship}${dep.docJud ? ' • DOC JUD' : ''})`
                                      : dep.docJud
                                      ? '(DOC JUD)'
                                      : '(Dependente)'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 text-slate-600">{dep.birthDate}</td>
                                <td className="py-2.5 px-4 max-w-xs">
                                  <div
                                    onClick={() => handleOpenNotes(dep)}
                                    className="group cursor-pointer p-1.5 bg-white rounded border border-slate-200 hover:border-blue-400 transition-all text-[10.5px] max-h-12 overflow-hidden relative"
                                    title="Clique para editar anotações formatadas deste dependente"
                                  >
                                    {dep.notesHtml ? (
                                      <div
                                        dangerouslySetInnerHTML={{ __html: dep.notesHtml }}
                                        className="prose prose-xs text-slate-700 pointer-events-none line-clamp-1"
                                      />
                                    ) : (
                                      <span className="text-slate-400 italic">Sem notas.</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-4">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-700">
                                    {dep.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {/* Ícone [V]: Vínculo com outro plano existente */}
                                    {hasVinculo(dep) && (
                                      <span
                                        className="w-5 h-5 rounded-full bg-orange-500 text-black font-extrabold text-[10px] flex items-center justify-center shrink-0 shadow-2xs select-none"
                                        title={
                                          dep.linkedPlanNumbers?.some((p) => p && p.trim())
                                            ? `Possui Vínculo com plano(s): ${dep.linkedPlanNumbers.filter((p) => p && p.trim()).join(', ')}`
                                            : 'Possui Vínculo com Plano Existente'
                                        }
                                      >
                                        V
                                      </span>
                                    )}

                                    {/* Ícone [J]: DOC JUD */}
                                    {dep.docJud && (
                                      <span
                                        className="w-5 h-5 rounded-full bg-yellow-400 text-black font-extrabold text-[10px] flex items-center justify-center shrink-0 shadow-2xs select-none"
                                        title="Possui Vínculo Judicial (DOC JUD)"
                                      >
                                        J
                                      </span>
                                    )}

                                    {/* Ícone do Olho */}
                                    <button
                                      onClick={() => handleOpenFicha(dep, 'VIEW')}
                                      className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                      title="Visualizar Ficha Cadastral deste dependente"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>

                                    {/* Ícone de Editar */}
                                    <button
                                      onClick={() => handleOpenFicha(dep, 'EDIT')}
                                      className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                      title="Editar Dados deste dependente"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>

                                    <button
                                      onClick={() => openCardInGda(dep)}
                                      className="px-2 py-1 bg-slate-700 text-white hover:bg-slate-900 rounded text-[11px] font-medium flex items-center gap-1"
                                      title="Emitir carteirinha deste dependente"
                                    >
                                      <Printer className="w-3 h-3" /> Imprimir
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCard(dep)}
                                      className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                                      title="Excluir dependente"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}

                            {/* Botão para adicionar dependente a esta família */}
                            {isExpanded && (
                              <tr className="bg-indigo-50/20 border-b border-indigo-100/70">
                                <td colSpan={6} className="py-2.5 px-4 pl-8">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTargetTitular(titular);
                                      setShowAddDependentModal(true);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
                                    title="Adicionar dependente a esta família"
                                  >
                                    <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>+ Adicionar dependente a esta família ({titular.name.split(' ')[0]})</span>
                                  </button>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )
                  ) : (
                    // PREFEITURA, BOMBEIROS, PLANO INDIVIDUAL, PLANO ESPECIAL
                    filteredCards.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400">
                          Nenhum registro encontrado para esta categoria.
                        </td>
                      </tr>
                    ) : (
                      filteredCards.map((c) => {
                        const isSpecial = c.category === 'PLANO_ESPECIAL' || c.isSpecialExempt;
                        return (
                          <tr
                            key={c.id}
                            className={`transition-colors ${
                              isSpecial ? 'bg-emerald-50/20 hover:bg-emerald-50/50' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-3 px-4">
                              <span
                                className={`font-mono font-bold px-2 py-0.5 rounded border ${
                                  isSpecial
                                    ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                                    : 'bg-blue-50 text-blue-900 border-blue-200'
                                }`}
                              >
                                {c.controlNumber}
                              </span>
                              {isSpecial && (
                                <span className="block text-[9.5px] text-emerald-700 font-bold uppercase mt-1">
                                  ★ Especial
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-slate-900">{c.name}</span>
                                {c.specialCondition && (
                                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300">
                                    {c.specialCondition}
                                  </span>
                                )}
                              </div>
                              {c.rgOrCpf && (
                                <span className="text-[10px] text-slate-500 block">{c.rgOrCpf}</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-600">{c.birthDate}</td>
                            <td className="py-3 px-4 max-w-xs">
                              <div
                                onClick={() => handleOpenNotes(c)}
                                className="group cursor-pointer p-2 bg-white rounded border border-slate-200 hover:border-blue-400 transition-all text-[11px] shadow-2xs max-h-16 overflow-hidden relative"
                                title="Clique para abrir e formatar anotações no Bloco de Notas"
                              >
                                {c.notesHtml ? (
                                  <div
                                    dangerouslySetInnerHTML={{ __html: c.notesHtml }}
                                    className="prose prose-xs text-slate-700 pointer-events-none line-clamp-2"
                                  />
                                ) : (
                                  <span className="text-slate-400 italic">
                                    Clique para abrir o bloco de notas formatado...
                                  </span>
                                )}
                                <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 text-white p-0.5 rounded text-[9px] flex items-center gap-0.5">
                                  <Edit className="w-2.5 h-2.5" /> Editar
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {isSpecial ? (
                                <div className="space-y-0.5">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-block">
                                    ★ Isento de Pagamento
                                  </span>
                                  <span className="block text-[9.5px] text-emerald-600">
                                    Dispensa Mensalidade
                                  </span>
                                </div>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  {c.status}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Ícone [V]: Vínculo com outro plano existente */}
                                {hasVinculo(c) && (
                                  <span
                                    className="w-5 h-5 rounded-full bg-orange-500 text-black font-extrabold text-[10px] flex items-center justify-center shrink-0 shadow-2xs select-none"
                                    title={
                                      c.linkedPlanNumbers?.some((p) => p && p.trim())
                                        ? `Possui Vínculo com plano(s): ${c.linkedPlanNumbers.filter((p) => p && p.trim()).join(', ')}`
                                        : 'Possui Vínculo com Plano Existente'
                                    }
                                  >
                                    V
                                  </span>
                                )}

                                {/* Ícone [J]: DOC JUD */}
                                {c.docJud && (
                                  <span
                                    className="w-5 h-5 rounded-full bg-yellow-400 text-black font-extrabold text-[10px] flex items-center justify-center shrink-0 shadow-2xs select-none"
                                    title="Possui Vínculo Judicial (DOC JUD)"
                                  >
                                    J
                                  </span>
                                )}

                                {/* Ícone do Olho: Abre Ficha Cadastral em modo Visualização */}
                                <button
                                  onClick={() => handleOpenFicha(c, 'VIEW')}
                                  className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Visualizar Ficha Cadastral Completa"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {/* Ícone de Editar: Abre Ficha Cadastral com Abas editáveis */}
                                <button
                                  onClick={() => handleOpenFicha(c, 'EDIT')}
                                  className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                  title="Editar Ficha Cadastral e Demonstrativo de Pagamento"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => openCardInGda(c)}
                                  className="px-2.5 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                                  title="Emitir/Imprimir Carteirinha no GDA"
                                >
                                  <Printer className="w-3 h-3" /> Carteirinha
                                </button>
                                <button
                                  onClick={() => handleDeleteCard(c)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                                  title="Excluir cadastro"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= ABA CHURRASQUEIRA ================= */}
      {gidActiveTab === 'CHURRASQUEIRA' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Bar */}
          <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-500" />
                Controle de Reservas de Churrasqueiras (Quiosques 1 a 6)
              </h2>
              <p className="text-xs text-slate-500">
                Agendamento de datas, lista nominal de participantes/convidados e campo de observações exclusivas
              </p>
            </div>

            <button
              onClick={handleOpenNewReservation}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Reserva de Churrasqueira</span>
            </button>
          </div>

          {/* Reservations Grid & List */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reservations.map((res) => (
                <div
                  key={res.id}
                  className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <span className="bg-amber-100 text-amber-900 font-bold text-xs px-2 py-0.5 rounded">
                        Quiosque {res.kioskNumber}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-1">
                        {res.responsibleName}
                      </h3>
                      {res.responsiblePlanNumber && (
                        <span className="text-[10px] font-mono text-blue-700">
                          Plano: {res.responsiblePlanNumber}
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        res.status === 'CONFIRMADA'
                          ? 'bg-emerald-100 text-emerald-800'
                          : res.status === 'PENDENTE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {res.status}
                    </span>
                  </div>

                  <div className="my-3 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium">
                        Data: {new Date(res.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Período:{' '}
                        {res.timeSlot === 'MANHA_TARDE'
                          ? 'Manhã / Tarde'
                          : res.timeSlot === 'INTEGRAL'
                          ? 'Dia Todo (Integral)'
                          : 'Noite'}
                      </span>
                    </div>

                    {res.responsiblePhone && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{res.responsiblePhone}</span>
                      </div>
                    )}

                    {/* Participants List Accordion/Summary */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                        <span>Convidados / Participantes:</span>
                        <span className="bg-slate-200 px-1.5 rounded-full text-[10px]">
                          {res.participantsList.length}
                        </span>
                      </div>
                      <div className="max-h-20 overflow-y-auto text-[11px] text-slate-600 divide-y divide-slate-200">
                        {res.participantsList.length > 0 ? (
                          res.participantsList.map((p, idx) => (
                            <div key={idx} className="py-0.5 flex items-center gap-1.5">
                              <span className="text-slate-400 text-[9px]">•</span>
                              <span className="truncate">{p}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">Lista de convidados em branco.</span>
                        )}
                      </div>
                    </div>

                    {/* Dedicated Observations Field */}
                    <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200">
                      <span className="block text-[11px] font-bold text-amber-900 mb-0.5">
                        Observações da Reserva:
                      </span>
                      <p className="text-[11px] text-amber-800 leading-relaxed italic">
                        {res.observations || 'Nenhuma observação específica anotada.'}
                      </p>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400">Por: {res.createdBy}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditReservation(res)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" /> Editar
                      </button>
                      <button
                        onClick={() => deleteReservation(res.id)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                        title="Cancelar / Excluir Reserva"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ================= CALENDÁRIO ANUAL DAS CHURRASQUEIRAS ================= */}
            {/* 3 linhas de 4 quadros de meses (Janeiro a Dezembro) com destaques por cor */}
            <div className="pt-2 pb-6">
              <AnnualChurrasqueiraCalendar
                reservations={reservations}
                onSelectDate={handleOpenReservationForDate}
                onSelectReservation={handleEditReservation}
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= RICH TEXT NOTEPAD MODAL ================= */}
      {editingCardNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                  Bloco de Notas Formatado • GID
                </span>
                <h3 className="text-base font-bold">
                  {editingCardNotes.name} ({editingCardNotes.controlNumber})
                </h3>
              </div>
              <button
                onClick={() => setEditingCardNotes(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-600">
                Utilize a barra de ferramentas para formatar anotações sobre este plano/pessoa com{' '}
                <strong>Negrito, Itálico, Sublinhado, Riscado, Cor, Tipografia, Tamanho e Destaque</strong>.
              </p>

              <RichTextEditor
                value={currentNoteHtml}
                onChange={(html) => setCurrentNoteHtml(html)}
                onSave={handleSaveNotes}
                savedIndicator={noteSavedIndicator}
                minHeight="220px"
              />
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                As informações são salvas no cadastro do usuário e associadas ao seu número de controle.
              </span>
              <button
                onClick={() => {
                  handleSaveNotes();
                  setEditingCardNotes(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                Concluir e Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL NOVO CADASTRO ================= */}
      {showNewMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            <form onSubmit={handleCreateMemberSubmit} className="flex flex-col overflow-hidden max-h-[92vh]">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-sm font-bold">Novo Cadastro</h3>
                  <span className="text-[11px] text-slate-300">
                    Categoria: {newMemberData.category}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewMemberModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 sm:p-5 space-y-3.5 text-xs overflow-y-auto flex-1">
                {/* Seleção de Categoria */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoria:</label>
                  <select
                    value={newMemberData.category}
                    onChange={(e) =>
                      setNewMemberData({
                        ...newMemberData,
                        category: e.target.value as CategoryType,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PREFEITURA">Prefeitura (Servidores PMPA)</option>
                    <option value="BOMBEIROS">Bombeiros (CBMMG)</option>
                    <option value="PLANO_INDIVIDUAL">Plano Individual (Comum)</option>
                    <option value="PLANO_FAMILIAR">Plano Familiar (Titular / Dependentes)</option>
                    <option value="PLANO_ESPECIAL">★ Plano Especial (PCD / Autistas / Idosos - Isento)</option>
                  </select>
                </div>

                {/* Se for Plano Especial: Destaque visual e campo de condição */}
                {newMemberData.category === 'PLANO_ESPECIAL' && (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                      <HeartHandshake className="w-4 h-4 text-emerald-600" />
                      <span>Condição / Laudo do Beneficiário:</span>
                    </div>
                    <input
                      type="text"
                      required
                      value={newMemberData.specialCondition}
                      onChange={(e) =>
                        setNewMemberData({ ...newMemberData, specialCondition: e.target.value })
                      }
                      placeholder="Ex: Síndrome de Down, Autista TEA, PCD Motora, Idoso 60+..."
                      className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-medium text-emerald-950"
                    />
                    <p className="text-[10.5px] text-emerald-800 leading-tight">
                      ★ <strong>Isenção 100%:</strong> Pessoas participantes deste plano ficam totalmente dispensadas do pagamento de mensalidades.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nome Completo:</label>
                  <input
                    type="text"
                    required
                    value={newMemberData.name}
                    onChange={(e) =>
                      setNewMemberData({ ...newMemberData, name: e.target.value })
                    }
                    placeholder="Nome completo do titular"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nascimento:</label>
                    <input
                      type="text"
                      value={newMemberData.birthDate}
                      onChange={(e) =>
                        setNewMemberData({ ...newMemberData, birthDate: e.target.value })
                      }
                      onBlur={() => {
                        const formatted = formatBirthDate(newMemberData.birthDate);
                        setNewMemberData((prev) => ({ ...prev, birthDate: formatted }));
                      }}
                      placeholder="DD/MM/AAAA (ex: 15012026)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Telefone:</label>
                    <input
                      type="text"
                      value={newMemberData.phone}
                      onChange={(e) =>
                        setNewMemberData({ ...newMemberData, phone: e.target.value })
                      }
                      onBlur={() => {
                        const formatted = formatPhoneNumber(newMemberData.phone);
                        setNewMemberData((prev) => ({ ...prev, phone: formatted }));
                      }}
                      placeholder="(35) 9 9955-8899"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">RG / CPF / Laudo:</label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 cursor-pointer text-slate-700 hover:text-blue-600 select-none text-[11px]">
                        <input
                          type="checkbox"
                          checked={docType === 'CPF'}
                          onChange={() => {
                            setDocType('CPF');
                            if (newMemberData.rgOrCpf) {
                              setNewMemberData((prev) => ({ ...prev, rgOrCpf: formatCpfNumber(prev.rgOrCpf) }));
                            }
                          }}
                          className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className={docType === 'CPF' ? 'font-bold text-blue-700' : 'font-medium'}>CPF</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer text-slate-700 hover:text-blue-600 select-none text-[11px]">
                        <input
                          type="checkbox"
                          checked={docType === 'RG'}
                          onChange={() => setDocType('RG')}
                          className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className={docType === 'RG' ? 'font-bold text-blue-700' : 'font-medium'}>RG</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer text-slate-700 hover:text-blue-600 select-none text-[11px]">
                        <input
                          type="checkbox"
                          checked={docType === 'LAUDO'}
                          onChange={() => setDocType('LAUDO')}
                          className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className={docType === 'LAUDO' ? 'font-bold text-blue-700' : 'font-medium'}>Laudo</span>
                      </label>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={newMemberData.rgOrCpf}
                    onChange={(e) =>
                      setNewMemberData({ ...newMemberData, rgOrCpf: e.target.value })
                    }
                    onBlur={() => {
                      if (docType === 'CPF') {
                        const formatted = formatCpfNumber(newMemberData.rgOrCpf);
                        setNewMemberData((prev) => ({ ...prev, rgOrCpf: formatted }));
                      }
                    }}
                    placeholder={
                      docType === 'CPF'
                        ? 'Digite os 11 dígitos do CPF (ex: 12345678923 -> 123.456.789-23)'
                        : docType === 'RG'
                        ? 'Número do RG (ex: MG-12.345.678)'
                        : 'Identificação ou Nº do Laudo Médico'
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Endereço:</label>
                  <input
                    type="text"
                    value={newMemberData.address}
                    onChange={(e) =>
                      setNewMemberData({ ...newMemberData, address: e.target.value })
                    }
                    placeholder="Rua, avenida ou logradouro"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>

                {/* Campos adicionais de endereço solicitados: Nº, Complemento, Bairro, CEP */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nº:</label>
                    <input
                      type="text"
                      value={newMemberData.addressNumber}
                      onChange={(e) =>
                        setNewMemberData({ ...newMemberData, addressNumber: e.target.value })
                      }
                      placeholder="Ex: 340 ou S/N"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Complemento:</label>
                    <input
                      type="text"
                      value={newMemberData.addressComplement}
                      onChange={(e) =>
                        setNewMemberData({ ...newMemberData, addressComplement: e.target.value })
                      }
                      placeholder="Ex: Apto 102"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Bairro:</label>
                    <input
                      type="text"
                      value={newMemberData.neighborhood}
                      onChange={(e) =>
                        setNewMemberData({ ...newMemberData, neighborhood: e.target.value })
                      }
                      placeholder="Ex: Centro"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">CEP:</label>
                    <input
                      type="text"
                      value={newMemberData.cep}
                      onChange={(e) =>
                        setNewMemberData({ ...newMemberData, cep: e.target.value })
                      }
                      onBlur={() =>
                        setNewMemberData((prev) => ({ ...prev, cep: formatCepNumber(prev.cep) }))
                      }
                      placeholder="37550-000"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* ================= CAMPO: PROCURAÇÃO (COM BORDA DELIMITADORA E SUBCAMPOS) ================= */}
                <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                    <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <span>PROCURAÇÃO</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                      Representação / Outorgado
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Subcampo: Data da Procuração com ícone de calendário */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Data da Procuração:
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={newMemberData.procuracao.dataProcuracao || ''}
                          onChange={(e) =>
                            setNewMemberData({
                              ...newMemberData,
                              procuracao: {
                                ...newMemberData.procuracao,
                                dataProcuracao: e.target.value,
                              },
                            })
                          }
                          onBlur={() => {
                            if (newMemberData.procuracao.dataProcuracao) {
                              const formatted = formatBirthDate(newMemberData.procuracao.dataProcuracao);
                              setNewMemberData((prev) => ({
                                ...prev,
                                procuracao: { ...prev.procuracao, dataProcuracao: formatted },
                              }));
                            }
                          }}
                          placeholder="DD/MM/AAAA"
                          className="w-full px-2.5 py-1.5 pr-8 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {/* Input date nativo oculto acionado pelo ícone */}
                        <input
                          type="date"
                          ref={procuracaoDateInputRef}
                          className="sr-only"
                          tabIndex={-1}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              const [yyyy, mm, dd] = val.split('-');
                              const formatted = `${dd}/${mm}/${yyyy}`;
                              setNewMemberData((prev) => ({
                                ...prev,
                                procuracao: {
                                  ...prev.procuracao,
                                  dataProcuracao: formatted,
                                },
                              }));
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (procuracaoDateInputRef.current) {
                              if ('showPicker' in procuracaoDateInputRef.current) {
                                (procuracaoDateInputRef.current as any).showPicker();
                              } else {
                                (procuracaoDateInputRef.current as any).focus();
                              }
                            }
                          }}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-blue-600 rounded transition-colors cursor-pointer"
                          title="Abrir calendário para escolher a data da procuração"
                        >
                          <Calendar className="w-4 h-4 text-blue-600" />
                        </button>
                      </div>
                    </div>

                    {/* Subcampo: Nome (nome do outorgado) */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Nome: <span className="text-[10px] font-normal text-slate-500">(Outorgado)</span>
                      </label>
                      <input
                        type="text"
                        value={newMemberData.procuracao.nomeOutorgado || ''}
                        onChange={(e) =>
                          setNewMemberData({
                            ...newMemberData,
                            procuracao: {
                              ...newMemberData.procuracao,
                              nomeOutorgado: e.target.value,
                            },
                          })
                        }
                        placeholder="Nome do outorgado"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Subcampo: CPF (CPF do outorgado) */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        CPF: <span className="text-[10px] font-normal text-slate-500">(Outorgado)</span>
                      </label>
                      <input
                        type="text"
                        value={newMemberData.procuracao.cpfOutorgado || ''}
                        onChange={(e) =>
                          setNewMemberData({
                            ...newMemberData,
                            procuracao: {
                              ...newMemberData.procuracao,
                              cpfOutorgado: e.target.value,
                            },
                          })
                        }
                        onBlur={() => {
                          if (newMemberData.procuracao.cpfOutorgado) {
                            const formatted = formatCpfNumber(newMemberData.procuracao.cpfOutorgado);
                            setNewMemberData((prev) => ({
                              ...prev,
                              procuracao: { ...prev.procuracao, cpfOutorgado: formatted },
                            }));
                          }
                        }}
                        placeholder="000.000.000-00"
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Subcampo com borda delimitadora: AUTORIZAÇÕES */}
                  <div className="border border-slate-300 rounded-lg p-2.5 bg-white space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                      AUTORIZAÇÕES:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={newMemberData.procuracao.autorizacoes?.retiradaCarteirinha || false}
                          onChange={(e) =>
                            setNewMemberData({
                              ...newMemberData,
                              procuracao: {
                                ...newMemberData.procuracao,
                                autorizacoes: {
                                  ...newMemberData.procuracao.autorizacoes,
                                  retiradaCarteirinha: e.target.checked,
                                },
                              },
                            })
                          }
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="font-medium">Retirada de Carteirinha</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={newMemberData.procuracao.autorizacoes?.retiradaBoletos || false}
                          onChange={(e) =>
                            setNewMemberData({
                              ...newMemberData,
                              procuracao: {
                                ...newMemberData.procuracao,
                                autorizacoes: {
                                  ...newMemberData.procuracao.autorizacoes,
                                  retiradaBoletos: e.target.checked,
                                },
                              },
                            })
                          }
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="font-medium">Retirada de Boletos</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 hover:text-slate-900">
                        <input
                          type="checkbox"
                          checked={newMemberData.procuracao.autorizacoes?.cancelamentoPlano || false}
                          onChange={(e) =>
                            setNewMemberData({
                              ...newMemberData,
                              procuracao: {
                                ...newMemberData.procuracao,
                                autorizacoes: {
                                  ...newMemberData.procuracao.autorizacoes,
                                  cancelamentoPlano: e.target.checked,
                                },
                              },
                            })
                          }
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="font-medium">Cancelamento do Plano</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* ================= CAMPO DE NOME: VINCULAÇÃO IDENTIFICATIVA (5 ESPAÇOS COM BUSCA) ================= */}
                <div className="bg-slate-50 border border-slate-300 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-blue-600" />
                      <span>Vinculação Identificativa (Opcional - Até 5 Planos)</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-semibold bg-slate-200/80 px-2 py-0.5 rounded-full">
                      Parentesco / Familiaridade
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Informe o número de um plano já existente no sistema (ex: 5689, 4219) para vincular associados parentes ou familiares. Ao clicar em <strong>Buscar</strong>, a plataforma busca no banco de dados e permite direcionar diretamente ao Módulo GID desse plano.
                  </p>

                  <div className="space-y-2 pt-1">
                    {[0, 1, 2, 3, 4].map((idx) => {
                      const feedback = linkedPlanSearchResults[idx];
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-600 w-16 shrink-0 font-mono">
                              Vínculo #{idx + 1}:
                            </span>
                            <input
                              type="text"
                              value={newMemberData.linkedPlanNumbers[idx] || ''}
                              onChange={(e) => {
                                const updated = [...newMemberData.linkedPlanNumbers];
                                updated[idx] = e.target.value;
                                setNewMemberData({ ...newMemberData, linkedPlanNumbers: updated });
                                if (linkedPlanSearchResults[idx]) {
                                  setLinkedPlanSearchResults((prev) => ({ ...prev, [idx]: null }));
                                }
                              }}
                              placeholder={`Nº do plano já existente (ex: ${idx === 0 ? '5689' : idx === 1 ? '4219' : idx === 2 ? '5601' : '3120'})`}
                              className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleSearchLinkedPlan(idx, newMemberData.linkedPlanNumbers[idx] || '')}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-2xs cursor-pointer"
                              title="Buscar este plano no banco de dados"
                            >
                              <Search className="w-3.5 h-3.5" />
                              <span>Buscar</span>
                            </button>
                          </div>

                          {/* Mensagem e atalho para Módulo GID do plano localizado */}
                          {feedback && (
                            <div
                              className={`text-[11px] px-2.5 py-1.5 rounded-lg flex flex-wrap items-center justify-between gap-2 ml-0 sm:ml-18 ${
                                feedback.success
                                  ? 'bg-emerald-50 text-emerald-950 border border-emerald-300'
                                  : 'bg-amber-50 text-amber-950 border border-amber-300'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                {feedback.success ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                ) : (
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                )}
                                <span className="font-medium">{feedback.text}</span>
                              </div>

                              {feedback.foundCard && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleOpenFicha(feedback.foundCard!, 'VIEW');
                                    setShowNewMemberModal(false);
                                  }}
                                  className="text-[10.5px] font-bold text-blue-700 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-2 py-0.5 rounded flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                                  title="Abrir este plano no GID"
                                >
                                  <span>Ir até o Módulo GID deste plano</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ================= CAMPO: OBSERVAÇÕES (TEXTO LIVRE COM FORMATAÇÃO E SCROLL) ================= */}
                <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-slate-600" />
                      <span>Observações (Texto Livre com Formatação)</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono bg-white border border-slate-200 px-2 py-0.5 rounded">
                      Scroll Ativo
                    </span>
                  </div>

                  <p className="text-[10.5px] text-slate-500 leading-tight">
                    Utilize as ferramentas de formatação (Negrito, Itálico, Sublinhado, Riscado, Tamanho, Fonte, Cor e Fundo). Caso o texto ultrapasse a altura limite, a barra de rolagem (scroll) entra em ação à direita.
                  </p>

                  <div className="border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                    <RichTextEditor
                      value={newMemberData.notesHtml}
                      onChange={(html) => setNewMemberData({ ...newMemberData, notesHtml: html })}
                      placeholder="Digite aqui anotações ou observações gerais..."
                      minHeight="95px"
                      maxHeight="130px"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewMemberModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Cadastrar e Gerar Nº de Controle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL ADICIONAR DEPENDENTE (PLANO FAMILIAR) ================= */}
      {showAddDependentModal && targetTitular && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <form onSubmit={handleAddDependentSubmit}>
              <div className="p-4 bg-indigo-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Adicionar Dependente</h3>
                  <p className="text-[11px] text-indigo-200">
                    Titular: {targetTitular.name} ({targetTitular.controlNumber})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddDependentModal(false)}
                  className="text-indigo-200 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nome Completo do Dependente:
                  </label>
                  <input
                    type="text"
                    required
                    value={dependentFormData.name}
                    onChange={(e) => setDependentFormData({ ...dependentFormData, name: e.target.value })}
                    placeholder="Ex: Cônjuge, Filho(a)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* ================= NATUREZA DE VÍNCULO (CHECKBOXES) ================= */}
                <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-800 text-xs">
                      Natureza de Vínculo:
                    </label>
                    <span className="text-[10px] text-slate-500 font-semibold bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                      {dependentFormData.docJud ? 'DOC JUD ativo (+1 vínculo admitido)' : 'Marcação única ou com DOC JUD'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-0.5">
                    {(['Esposa', 'Filho', 'Irmão', 'Sobrinho', 'Neto'] as const).map((kinshipOpt) => {
                      const isChecked = dependentFormData.kinship === kinshipOpt;
                      return (
                        <label
                          key={kinshipOpt}
                          className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                            isChecked
                              ? 'bg-indigo-100 border-indigo-400 text-indigo-950 font-bold shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setDependentFormData((prev) => ({
                                ...prev,
                                kinship: prev.kinship === kinshipOpt ? '' : kinshipOpt,
                              }));
                            }}
                            className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="truncate">{kinshipOpt}</span>
                        </label>
                      );
                    })}

                    {/* Checkbox DOC JUD */}
                    <label
                      className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                        dependentFormData.docJud
                          ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={dependentFormData.docJud}
                        onChange={(e) => {
                          setDependentFormData((prev) => ({
                            ...prev,
                            docJud: e.target.checked,
                          }));
                        }}
                        className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="font-bold flex items-center gap-1">
                        DOC JUD
                        <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 text-black font-black text-[9px] inline-flex items-center justify-center">
                          J
                        </span>
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Data de Nascimento:
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={dependentFormData.birthDate}
                      onChange={(e) => setDependentFormData({ ...dependentFormData, birthDate: e.target.value })}
                      onBlur={() =>
                        setDependentFormData((prev) => ({
                          ...prev,
                          birthDate: formatBirthDate(prev.birthDate),
                        }))
                      }
                      placeholder="DD/MM/AAAA (ex: 15/01/2010)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs pr-9"
                    />
                    <input
                      ref={depDateInputRef}
                      type="date"
                      className="sr-only"
                      onChange={(e) => {
                        if (e.target.value) {
                          const [y, m, d] = e.target.value.split('-');
                          setDependentFormData((prev) => ({ ...prev, birthDate: `${d}/${m}/${y}` }));
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => depDateInputRef.current?.showPicker?.() || depDateInputRef.current?.click()}
                      className="absolute right-2 p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                      title="Abrir calendário"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* ================= CAMPO: CPF / RG (COM CHECKBOXES E AUTO-FORMATAÇÃO NO ONBLUR) ================= */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">
                      {depDocType === 'CPF' ? 'CPF (Opcional):' : 'RG (Opcional):'}
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 cursor-pointer text-slate-700 hover:text-indigo-600 select-none text-[11px]">
                        <input
                          type="checkbox"
                          checked={depDocType === 'CPF'}
                          onChange={() => {
                            setDepDocType('CPF');
                            if (dependentFormData.rgOrCpf) {
                              setDependentFormData((prev) => ({
                                ...prev,
                                rgOrCpf: formatCpfNumber(prev.rgOrCpf),
                              }));
                            }
                          }}
                          className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className={depDocType === 'CPF' ? 'font-bold text-indigo-700' : 'font-medium'}>
                          CPF
                        </span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer text-slate-700 hover:text-indigo-600 select-none text-[11px]">
                        <input
                          type="checkbox"
                          checked={depDocType === 'RG'}
                          onChange={() => setDepDocType('RG')}
                          className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className={depDocType === 'RG' ? 'font-bold text-indigo-700' : 'font-medium'}>
                          RG
                        </span>
                      </label>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={dependentFormData.rgOrCpf}
                    onChange={(e) => setDependentFormData({ ...dependentFormData, rgOrCpf: e.target.value })}
                    onBlur={() => {
                      if (depDocType === 'CPF') {
                        const formatted = formatCpfNumber(dependentFormData.rgOrCpf);
                        setDependentFormData((prev) => ({ ...prev, rgOrCpf: formatted }));
                      }
                    }}
                    placeholder={
                      depDocType === 'CPF'
                        ? 'Digite os 11 números do CPF (ex: 12345678923 -> 123.456.789-23)'
                        : 'Número do RG (digitação livre, ex: MG-12.345.678)'
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Telefone / Celular (Opcional):
                  </label>
                  <input
                    type="text"
                    value={dependentFormData.phone}
                    onChange={(e) => setDependentFormData({ ...dependentFormData, phone: e.target.value })}
                    placeholder="(35) 99999-9999"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDependentModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Adicionar Dependente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL RESERVA DE CHURRASQUEIRA ================= */}
      {showReservationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-amber-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">
                  {editingReservation ? 'Editar Reserva de Churrasqueira' : 'Nova Reserva de Churrasqueira'}
                </h3>
                <span className="text-[11px] text-amber-200">
                  Praça de Esportes • Quiosques 1 a 6
                </span>
              </div>
              <button
                onClick={() => setShowReservationModal(false)}
                className="text-amber-200 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReservationSubmit} className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quiosque:</label>
                  <select
                    value={resFormData.kioskNumber}
                    onChange={(e) =>
                      setResFormData({ ...resFormData, kioskNumber: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-bold text-slate-800"
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>
                        Quiosque {num}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data da Reserva:</label>
                  <input
                    type="date"
                    required
                    value={resFormData.date}
                    onChange={(e) => setResFormData({ ...resFormData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Período / Horário:</label>
                  <select
                    value={resFormData.timeSlot}
                    onChange={(e) =>
                      setResFormData({
                        ...resFormData,
                        timeSlot: e.target.value as 'MANHA_TARDE' | 'INTEGRAL' | 'NOITE',
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
                  >
                    <option value="MANHA_TARDE">Manhã / Tarde (08h às 17h)</option>
                    <option value="INTEGRAL">Dia Todo (Integral)</option>
                    <option value="NOITE">Noite (18h às 22h)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status da Reserva:</label>
                  <select
                    value={resFormData.status}
                    onChange={(e) =>
                      setResFormData({
                        ...resFormData,
                        status: e.target.value as 'CONFIRMADA' | 'PENDENTE' | 'CANCELADA' | 'CONCLUIDA',
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-bold"
                  >
                    <option value="CONFIRMADA">CONFIRMADA (Verde)</option>
                    <option value="PENDENTE">PENDENTE (Amarelo)</option>
                    <option value="CANCELADA">CANCELADA (Vermelho)</option>
                    <option value="CONCLUIDA">CONCLUÍDA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nome do Responsável / Solicitante:
                </label>
                <input
                  type="text"
                  required
                  value={resFormData.responsibleName}
                  onChange={(e) =>
                    setResFormData({ ...resFormData, responsibleName: e.target.value })
                  }
                  placeholder="Nome completo do sócio ou solicitante"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefone Contato:</label>
                  <input
                    type="text"
                    value={resFormData.responsiblePhone}
                    onChange={(e) =>
                      setResFormData({ ...resFormData, responsiblePhone: e.target.value })
                    }
                    placeholder="(35) 9..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nº da Carteirinha / Plano:</label>
                  <input
                    type="text"
                    value={resFormData.responsiblePlanNumber}
                    onChange={(e) =>
                      setResFormData({ ...resFormData, responsiblePlanNumber: e.target.value })
                    }
                    placeholder="Ex: IND-2026-0087"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* LISTA DE CONVIDADOS / PARTICIPANTES */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Lista Nominal de Participantes / Convidados:
                  </label>
                  <span className="text-[10px] text-slate-500">1 nome por linha</span>
                </div>
                <textarea
                  rows={4}
                  value={resFormData.participantsInput}
                  onChange={(e) =>
                    setResFormData({ ...resFormData, participantsInput: e.target.value })
                  }
                  placeholder="Digite os nomes dos convidados que entrarão na Praça de Esportes..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-[11px]"
                />
              </div>

              {/* CAMPO DE OBSERVAÇÕES EXCLUSIVAS */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Observações e Restrições da Reserva:
                </label>
                <textarea
                  rows={2}
                  value={resFormData.observations}
                  onChange={(e) =>
                    setResFormData({ ...resFormData, observations: e.target.value })
                  }
                  placeholder="Ex: Aniversário infantil, necessidade de ponto de energia, autorização de entrada..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-amber-50/50"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReservationModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Salvar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL RELATÓRIO DE VÍNCULOS EXISTENTES ================= */}
      <VinculosReportModal
        isOpen={showVinculosModal}
        onClose={() => setShowVinculosModal(false)}
        initialAssociate={vinculosTargetAssociate}
        category={gidSubTab as CategoryType}
      />
    </div>
  );
};
