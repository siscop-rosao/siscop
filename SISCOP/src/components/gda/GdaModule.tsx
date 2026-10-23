import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CardData, CategoryType } from '../../types';
import { PrintableCard } from './PrintableCard';
import { FoldSimulatorModal } from './FoldSimulatorModal';
import { PrintSheetViewerModal, PrintMode } from './PrintSheetViewerModal';
import { optimizeImageBase64 } from '../../services/imageOptimizer';
import { GdaReportsView } from './GdaReportsView';
import { GdaLatestRecordsView } from './GdaLatestRecordsView';
import { BrasaoPousoAlegre } from '../common/BrasaoPousoAlegre';
import { formatBirthDate, formatCpfNumber, getNumericSortKey } from '../../utils/formatters';
import {
  Printer,
  Sliders,
  RotateCw,
  Plus,
  Users,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Save,
  CheckCircle,
  FileText,
  ArrowLeft,
  CreditCard,
  UserPlus,
  Eye,
  Shield,
  HeartHandshake,
  AlertTriangle,
  X,
  FileSpreadsheet,
  Hash,
  Calendar,
  Layers,
  ChevronDown,
} from 'lucide-react';

export const GdaModule: React.FC = () => {
  const {
    cards,
    selectedCardForGda,
    setSelectedCardForGda,
    updateCard,
    addCard,
    addFamilyMember,
    incrementPrintedCount,
    layoutConfig,
    updateLayoutConfig,
    resetLayoutConfig,
    updateCoatOfArms,
    resetCoatOfArms,
    generateNextControlNumber,
    setCurrentView,
  } = useApp();

  // Tab State: 'CARTEIRINHAS' | 'RELATORIOS' | 'ULTIMOS_REGISTROS'
  const [gdaTab, setGdaTab] = useState<'CARTEIRINHAS' | 'RELATORIOS' | 'ULTIMOS_REGISTROS'>('CARTEIRINHAS');

  // Active card being edited/viewed
  const [activeCardId, setActiveCardId] = useState<string>(
    selectedCardForGda?.id || (cards.length > 0 ? cards[0].id : '')
  );

  // Sync if selected card changes from context
  useEffect(() => {
    if (selectedCardForGda) {
      setActiveCardId(selectedCardForGda.id);
    }
  }, [selectedCardForGda]);

  const activeCard = cards.find((c) => c.id === activeCardId) || cards[0];

  // If in Family Plan, find titular and dependents
  const isFamily = activeCard?.planType === 'FAMILIAR' || activeCard?.category === 'PLANO_FAMILIAR';
  const titularCard = isFamily
    ? activeCard.isTitular
      ? activeCard
      : cards.find((c) => c.id === activeCard.familyHeadId) || activeCard
    : null;

  const familyMembers = isFamily && titularCard
    ? [titularCard, ...cards.filter((c) => c.familyHeadId === titularCard.id && c.id !== titularCard.id)]
    : [];

  // UI state
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(false);
  const [showFoldModal, setShowFoldModal] = useState<boolean>(false);
  const [showPrintSheetModal, setShowPrintSheetModal] = useState<boolean>(false);
  const [printSheetInitialMode, setPrintSheetInitialMode] = useState<PrintMode>('SINGLE_4X');
  const [saveToast, setSaveToast] = useState<boolean>(false);

  // Control Number Validation & Duplicate Alert State
  const [numberValidationStatus, setNumberValidationStatus] = useState<'idle' | 'valid' | 'duplicate'>('idle');
  const [duplicateWarningModal, setDuplicateWarningModal] = useState<{
    isOpen: boolean;
    number: string;
    planWord: string;
    existingCardName?: string;
  }>({
    isOpen: false,
    number: '',
    planWord: '',
  });

  // Modal de Adicionar Dependente no GDA
  const [showAddDepModalGda, setShowAddDepModalGda] = useState(false);
  const [depFormDataGda, setDepFormDataGda] = useState({
    name: '',
    birthDate: '',
    rgOrCpf: '',
    phone: '',
    kinship: '',
    docJud: false,
  });
  const [depDocTypeGda, setDepDocTypeGda] = useState<'CPF' | 'RG'>('CPF');
  const gdaDepDateInputRef = useRef<HTMLInputElement>(null);

  // Menus Dropdown da Barra de Ferramentas (Visual e Impressão em Lote)
  const [isVisualMenuOpen, setIsVisualMenuOpen] = useState(false);
  const [isBatchMenuOpen, setIsBatchMenuOpen] = useState(false);
  const visualMenuRef = useRef<HTMLDivElement>(null);
  const batchMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (visualMenuRef.current && !visualMenuRef.current.contains(event.target as Node)) {
        setIsVisualMenuOpen(false);
      }
      if (batchMenuRef.current && !batchMenuRef.current.contains(event.target as Node)) {
        setIsBatchMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Form edit state
  const [formData, setFormData] = useState<Partial<CardData>>({});

  useEffect(() => {
    if (activeCard) {
      setFormData({
        controlNumber: activeCard.controlNumber,
        name: activeCard.name,
        birthDate: activeCard.birthDate,
        planType: activeCard.planType,
        category: activeCard.category,
        directorLabel: activeCard.directorLabel || layoutConfig.directorLabel,
        isSpecialExempt: activeCard.isSpecialExempt,
        specialCondition: activeCard.specialCondition,
        year1: activeCard.year1,
        year2: activeCard.year2,
        physicalArchiveLocation: activeCard.physicalArchiveLocation || '',
        photoUrl: activeCard.photoUrl || '',
        batchPrintSelected: !!activeCard.batchPrintSelected,
      });
      setNumberValidationStatus('idle');
    }
  }, [activeCard, layoutConfig.directorLabel]);

  // Handle Coat of Arms Image Upload
  const handleCoatOfArmsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const optimized = await optimizeImageBase64(file, {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.88,
          mimeType: 'image/png',
        });
        updateCoatOfArms(optimized);
      } catch (err) {
        console.warn('Falha ao otimizar brasão:', err);
      }
    }
  };

  // ITEM 1: Replicação de "Localização Arquivo Físico" no Plano Familiar
  const handleArchiveLocationChange = (val: string) => {
    setFormData((prev) => ({ ...prev, physicalArchiveLocation: val }));
    if (activeCard) {
      updateCard(activeCard.id, { physicalArchiveLocation: val });
    }

    // Se for Plano Familiar, replicar para o titular e para todos os dependentes
    const isFam = formData.category === 'PLANO_FAMILIAR' || activeCard?.planType === 'FAMILIAR';
    if (isFam && titularCard) {
      const targetFamilyId = titularCard.id;
      // Replicar para todos os dependentes da mesma família
      const dependents = cards.filter((c) => c.familyHeadId === targetFamilyId);
      dependents.forEach((dep) => {
        updateCard(dep.id, { physicalArchiveLocation: val });
      });
      // Também garantir que o titular tenha o valor atualizado
      if (titularCard.id !== activeCard?.id) {
        updateCard(titularCard.id, { physicalArchiveLocation: val });
      }
    }
  };

  // Função auxiliar para replicar número do plano / controle para todos os membros do Plano Familiar
  const replicateControlNumberToFamily = (typedNumber: string) => {
    if (!activeCard) return;
    const isFam = formData.category === 'PLANO_FAMILIAR' || activeCard.planType === 'FAMILIAR';
    if (!isFam || !titularCard) {
      updateCard(activeCard.id, { controlNumber: typedNumber });
      return;
    }

    const targetFamilyId = titularCard.id;
    const dependents = cards.filter((c) => c.familyHeadId === targetFamilyId && c.id !== targetFamilyId);

    if (/-\d+$/.test(typedNumber)) {
      const base = typedNumber.replace(/-\d+$/, '').trim();
      const titularNum = `${base}-01`;
      updateCard(titularCard.id, { controlNumber: titularNum });
      dependents.forEach((dep, idx) => {
        const depNum = `${base}-${String(idx + 2).padStart(2, '0')}`;
        updateCard(dep.id, { controlNumber: depNum });
      });
      const activeNum =
        activeCard.id === titularCard.id
          ? titularNum
          : `${base}-${String(dependents.findIndex((d) => d.id === activeCard.id) + 2).padStart(2, '0')}`;
      setFormData((prev) => ({ ...prev, controlNumber: activeNum }));
    } else {
      updateCard(titularCard.id, { controlNumber: typedNumber });
      dependents.forEach((dep) => {
        updateCard(dep.id, { controlNumber: typedNumber });
      });
      setFormData((prev) => ({ ...prev, controlNumber: typedNumber }));
    }
  };

  // ITEM 2: Gravar e conferir número do plano / controle com indicador verde/vermelho, alerta e replicação no Plano Familiar
  const handleSaveControlNumber = () => {
    const typedNumber = (formData.controlNumber || '').trim();
    if (!typedNumber) {
      alert('Por favor, informe o número do plano antes de gravar.');
      return;
    }

    // Identificar a palavra correta: INDIVIDUAL ou FAMILIAR
    const isFam = formData.category === 'PLANO_FAMILIAR' || activeCard?.planType === 'FAMILIAR';
    const planWord = isFam ? 'FAMILIAR' : 'INDIVIDUAL';

    // Conferência no banco de dados para saber se aquele número digitado já foi utilizado por outro cartão
    // No Plano Familiar, os membros da MESMA família compartilham o plano e não geram falso conflito entre si
    const duplicate = cards.find((c) => {
      if (c.id === activeCard?.id) return false;
      if (isFam && titularCard) {
        const isSameFamily = c.id === titularCard.id || c.familyHeadId === titularCard.id;
        if (isSameFamily) return false;
      }
      return String(c.controlNumber || '').trim().toLowerCase() === typedNumber.toLowerCase();
    });

    if (duplicate) {
      // Já foi utilizado por outro associado/família: Bloqueia gravação, botão redondo fica vermelho, abre janela de alerta
      setNumberValidationStatus('duplicate');
      setDuplicateWarningModal({
        isOpen: true,
        number: typedNumber,
        planWord,
        existingCardName: duplicate.name,
      });
      return;
    }

    // Ainda não foi utilizado: Permite gravação no banco de dados e botão redondo acende verde
    setNumberValidationStatus('valid');
    replicateControlNumberToFamily(typedNumber);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  // Save changes
  const handleSaveChanges = () => {
    if (activeCard) {
      updateCard(activeCard.id, formData);

      const isFam = formData.category === 'PLANO_FAMILIAR' || activeCard.planType === 'FAMILIAR';
      if (isFam && titularCard) {
        const targetFamilyId = titularCard.id;
        const dependents = cards.filter((c) => c.familyHeadId === targetFamilyId && c.id !== targetFamilyId);

        // Replicar localização de arquivo físico se for plano familiar
        if (formData.physicalArchiveLocation !== undefined) {
          dependents.forEach((dep) => {
            updateCard(dep.id, { physicalArchiveLocation: formData.physicalArchiveLocation });
          });
          if (titularCard.id !== activeCard.id) {
            updateCard(titularCard.id, { physicalArchiveLocation: formData.physicalArchiveLocation });
          }
        }

        // Replicar número do plano / controle se for plano familiar
        if (formData.controlNumber) {
          replicateControlNumberToFamily(formData.controlNumber.trim());
        }
      }

      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 2500);
    }
  };

  // Print single card - opens A4 landscape sheet viewer for optimal layout
  const handlePrintSingle = () => {
    if (!activeCard) return;
    incrementPrintedCount(activeCard.id);
    setPrintSheetInitialMode('SINGLE_1X');
    setShowPrintSheetModal(true);
  };

  // Limpar todas as marcações de Impressão em Lote
  const handleClearBatchSelections = () => {
    cards.forEach((c) => {
      if (c.batchPrintSelected) {
        updateCard(c.id, { batchPrintSelected: false });
      }
    });
    setFormData((prev) => ({ ...prev, batchPrintSelected: false }));
  };

  // Create new card
  const handleCreateNew = () => {
    const newCard = addCard({
      name: 'Novo Frequentador',
      category: 'PLANO_INDIVIDUAL',
      planType: 'INDIVIDUAL',
    });
    setActiveCardId(newCard.id);
    setSelectedCardForGda(newCard);
  };

  // Add dependent to current family via modal
  const handleAddDependent = () => {
    if (!titularCard) return;
    setDepFormDataGda({ name: '', birthDate: '', rgOrCpf: '', phone: '', kinship: '', docJud: false });
    setDepDocTypeGda('CPF');
    setShowAddDepModalGda(true);
  };

  const handleAddDepGdaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titularCard) {
      alert('Titular da família não localizado.');
      return;
    }
    const nameClean = (depFormDataGda.name || '').trim();
    if (!nameClean) {
      alert('Por favor, informe o Nome Completo do dependente.');
      return;
    }

    try {
      const formattedDoc =
        depDocTypeGda === 'CPF' && depFormDataGda.rgOrCpf
          ? formatCpfNumber(depFormDataGda.rgOrCpf)
          : depFormDataGda.rgOrCpf;

      const dep = addFamilyMember(titularCard.id, {
        name: nameClean,
        birthDate: depFormDataGda.birthDate,
        rgOrCpf: formattedDoc,
        phone: depFormDataGda.phone || titularCard.phone,
        kinship: depFormDataGda.kinship || undefined,
        docJud: !!depFormDataGda.docJud,
        physicalArchiveLocation: titularCard.physicalArchiveLocation || '',
      });
      setActiveCardId(dep.id);
      setShowAddDepModalGda(false);
      setDepFormDataGda({ name: '', birthDate: '', rgOrCpf: '', phone: '', kinship: '', docJud: false });
      setDepDocTypeGda('CPF');
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
    } catch (err: any) {
      console.error('Falha ao adicionar dependente no GDA:', err);
      alert('Não foi possível gravar o dependente: ' + (err?.message || 'Erro desconhecido.'));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-100">
      {/* ================= GDA SUB-HEADER ================= */}
      <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentView('DASHBOARD')}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Voltar ao Painel Geral"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white font-bold text-xs px-2 py-0.5 rounded shadow-2xs">
                GDA
              </span>
              <h1 className="text-base font-bold text-slate-900">
                Gerenciamento de Documentos de Acesso
              </h1>
            </div>
            <p className="text-xs text-slate-500">
              Estúdio de layout, emissão fiel de carteirinhas e relatórios operacionais
            </p>
          </div>
        </div>

        {/* ================= TRÊS ABAS DO GDA ================= */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs shadow-inner">
          <button
            type="button"
            onClick={() => setGdaTab('CARTEIRINHAS')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              gdaTab === 'CARTEIRINHAS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-white hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>GERAÇÃO DE CARTEIRINHAS</span>
          </button>

          <button
            type="button"
            onClick={() => setGdaTab('RELATORIOS')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              gdaTab === 'RELATORIOS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-white hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>RELATÓRIOS</span>
          </button>

          <button
            type="button"
            onClick={() => setGdaTab('ULTIMOS_REGISTROS')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              gdaTab === 'ULTIMOS_REGISTROS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-white hover:text-slate-900'
            }`}
          >
            <Hash className="w-4 h-4" />
            <span>ÚLTIMOS REGISTROS</span>
          </button>
        </div>

        {/* Controles de Ação da Aba Carteirinhas */}
        {gdaTab === 'CARTEIRINHAS' && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Card Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-700 hidden sm:inline">Carteirinha:</span>
              <select
                value={activeCardId}
                onChange={(e) => setActiveCardId(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none max-w-[260px] truncate cursor-pointer"
              >
                {/* 1. PLANO FAMILIAR (Agrupado por Família com Titular e Dependentes) */}
                {cards.some((c) => c.category === 'PLANO_FAMILIAR') && (
                  <optgroup label="👨‍👩‍👦 PLANO FAMILIAR (Titulares & Dependentes)">
                    {cards
                      .filter((c) => c.category === 'PLANO_FAMILIAR' && c.isTitular)
                      .sort((a, b) => getNumericSortKey(b) - getNumericSortKey(a))
                      .flatMap((titular) => {
                        const familyDeps = cards.filter(
                          (c) => c.category === 'PLANO_FAMILIAR' && c.familyHeadId === titular.id && c.id !== titular.id
                        );
                        return [
                          <option key={titular.id} value={titular.id}>
                            ★ {titular.controlNumber} - {titular.name} (Titular) [{familyDeps.length} dep.]
                          </option>,
                          ...familyDeps.map((dep) => (
                            <option key={dep.id} value={dep.id}>
                              &nbsp;&nbsp;&nbsp;&nbsp;└ {dep.controlNumber} - {dep.name} (Dependente)
                            </option>
                          )),
                        ];
                      })}
                  </optgroup>
                )}

                {/* 2. PLANO INDIVIDUAL */}
                {cards.some((c) => c.category === 'PLANO_INDIVIDUAL') && (
                  <optgroup label="👤 PLANO INDIVIDUAL">
                    {cards
                      .filter((c) => c.category === 'PLANO_INDIVIDUAL')
                      .sort((a, b) => getNumericSortKey(b) - getNumericSortKey(a))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.controlNumber} - {c.name}
                        </option>
                      ))}
                  </optgroup>
                )}

                {/* 3. PLANO ESPECIAL (PCD / IDOSO / TEA) */}
                {cards.some((c) => c.category === 'PLANO_ESPECIAL') && (
                  <optgroup label="♿ PLANO ESPECIAL (PCD / Isento)">
                    {cards
                      .filter((c) => c.category === 'PLANO_ESPECIAL')
                      .sort((a, b) => getNumericSortKey(b) - getNumericSortKey(a))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.controlNumber} - {c.name} ({c.specialCondition || 'Especial'})
                        </option>
                      ))}
                  </optgroup>
                )}

                {/* 4. PREFEITURA */}
                {cards.some((c) => c.category === 'PREFEITURA') && (
                  <optgroup label="🏛️ PREFEITURA MUNICIPAL">
                    {cards
                      .filter((c) => c.category === 'PREFEITURA')
                      .sort((a, b) => getNumericSortKey(b) - getNumericSortKey(a))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.controlNumber} - {c.name}
                        </option>
                      ))}
                  </optgroup>
                )}

                {/* 5. BOMBEIROS */}
                {cards.some((c) => c.category === 'BOMBEIROS') && (
                  <optgroup label="🚒 CORPO DE BOMBEIROS">
                    {cards
                      .filter((c) => c.category === 'BOMBEIROS')
                      .sort((a, b) => getNumericSortKey(b) - getNumericSortKey(a))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.controlNumber} - {c.name}
                        </option>
                      ))}
                  </optgroup>
                )}
              </select>
            </div>

            <button
              onClick={handleCreateNew}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold border border-blue-200 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova</span>
            </button>

            {/* Menu Dropdown Visual (Simulador 3D de Dobra e Personalizar Layout) */}
            <div className="relative" ref={visualMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsVisualMenuOpen((prev) => !prev);
                  setIsBatchMenuOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  showConfigDrawer || isVisualMenuOpen
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
                title="Visual"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Visual</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isVisualMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isVisualMenuOpen && (
                <div className="absolute left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsVisualMenuOpen(false);
                      setShowFoldModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-100 transition-colors text-left font-medium cursor-pointer"
                    title="Simular dobra para conferir frente e verso"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                    <span>Simulador 3D de Dobra</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsVisualMenuOpen(false);
                      setShowConfigDrawer(!showConfigDrawer);
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-100 transition-colors text-left font-medium cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Personalizar Layout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Menu Dropdown Impressão em Lote (Executar IL e Limpar IL) */}
            <div className="relative" ref={batchMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setIsBatchMenuOpen((prev) => !prev);
                  setIsVisualMenuOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  cards.some((c) => c.batchPrintSelected)
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
                title="Impressão em Lote"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Impressão em Lote</span>
                {cards.filter((c) => c.batchPrintSelected).length > 0 && (
                  <span className="px-1.5 py-0.2 bg-white text-blue-700 rounded-full font-bold text-[10px]">
                    {cards.filter((c) => c.batchPrintSelected).length}
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isBatchMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isBatchMenuOpen && (
                <div className="absolute left-0 mt-1 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                  {/* Botão Executar IL */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsBatchMenuOpen(false);
                      setPrintSheetInitialMode('BATCH_INDIVIDUAL');
                      setShowPrintSheetModal(true);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-xs text-slate-800 hover:bg-blue-50 transition-colors text-left font-semibold cursor-pointer"
                    title="Executar Impressão em Lote"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      <span>Executar IL</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
                      {cards.filter((c) => c.batchPrintSelected).length} selecionadas
                    </span>
                  </button>

                  {/* Botão Limpar IL */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsBatchMenuOpen(false);
                      handleClearBatchSelections();
                    }}
                    disabled={!cards.some((c) => c.batchPrintSelected)}
                    className={`w-full flex items-center gap-2 px-3.5 py-2 text-xs text-left font-semibold transition-colors ${
                      cards.some((c) => c.batchPrintSelected)
                        ? 'text-rose-600 hover:bg-rose-50 cursor-pointer'
                        : 'text-slate-300 cursor-not-allowed'
                    }`}
                    title="Retirar a marcação geral de Impressão em Lote"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Limpar IL</span>
                  </button>
                </div>
              )}
            </div>

            {/* Visualizar Impressão */}
            <button
              onClick={() => setShowPrintSheetModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Visualizar a folha A4 no modo Paisagem contendo 4 carteirinhas por folha"
            >
              <Eye className="w-4 h-4 text-indigo-200" />
              <span>Visualizar Impressão</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrintSingle}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
          </div>
        )}
      </header>

      {/* ================= CONDITIONAL CONTENT BASED ON ACTIVE TAB ================= */}
      {gdaTab === 'RELATORIOS' ? (
        /* ABA 2: RELATÓRIOS DE EMISSÃO DE CARTEIRINHAS */
        <GdaReportsView />
      ) : gdaTab === 'ULTIMOS_REGISTROS' ? (
        /* ABA 3: ÚLTIMOS REGISTROS */
        <GdaLatestRecordsView />
      ) : (
        /* ABA 1: GERAÇÃO DE CARTEIRINHAS (ESTÚDIO DE LAYOUT E IMPRESSÃO) */
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT COLUMN: Data Form & Family Tabs */}
          <aside className="w-80 sm:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-y-auto">
            {/* Family Plan Banner / Quick Switcher */}
            {isFamily && titularCard && (
              <div className="p-3 bg-indigo-50 border-b border-indigo-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Plano Familiar ({familyMembers.length} pessoas)</span>
                  </div>
                  <button
                    onClick={handleAddDependent}
                    className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-indigo-200 cursor-pointer"
                  >
                    <UserPlus className="w-3 h-3" /> + Dependente
                  </button>
                </div>

                {/* Members tabs */}
                <div className="flex flex-wrap gap-1">
                  {familyMembers.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        handleSaveChanges();
                        setActiveCardId(m.id);
                      }}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                        m.id === activeCardId
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-indigo-100 border border-slate-200'
                      }`}
                    >
                      {m.name.split(' ')[0]} {m.isTitular ? '★' : ''}
                    </button>
                  ))}
                </div>

                {/* Batch Print Family Button */}
                {familyMembers.length > 1 && (
                  <button
                    onClick={() => setShowPrintSheetModal(true)}
                    className="mt-2 w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visualizar Folhas da Família ({familyMembers.length} carteirinhas)</span>
                  </button>
                )}
              </div>
            )}

            {/* Form Fields */}
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Dados da Carteirinha
                </h2>
                {saveToast && (
                  <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Atualizado!
                  </span>
                )}
              </div>

              {/* ================= ITEM 2: NÚMERO DO PLANO / CONTROLE COM GRAVAR E BOTÃO REDONDO ================= */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Número do Plano / Controle:</span>
                  {isFamily && (
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                      Replicado na Família
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  {/* Botão redondo pequeno à esquerda (Verde se gravado e válido, Vermelho se já existente) */}
                  <div
                    className={`w-5 h-5 rounded-full shrink-0 border transition-all duration-300 ${
                      numberValidationStatus === 'valid'
                        ? 'bg-emerald-500 border-emerald-400 ring-4 ring-emerald-200 shadow-xs'
                        : numberValidationStatus === 'duplicate'
                        ? 'bg-red-500 border-red-400 ring-4 ring-red-200 shadow-xs animate-pulse'
                        : 'bg-slate-200 border-slate-300'
                    }`}
                    title={
                      numberValidationStatus === 'valid'
                        ? 'Número gravado e conferido no banco de dados'
                        : numberValidationStatus === 'duplicate'
                        ? 'Número duplicado! Não permitido gravar.'
                        : 'Clique em Gravar para validar e salvar o número'
                    }
                  />

                  {/* Campo com tamanho reduzido (4 dígitos) */}
                  <input
                    type="text"
                    value={formData.controlNumber || ''}
                    onChange={(e) => {
                      setNumberValidationStatus('idle');
                      setFormData({ ...formData, controlNumber: e.target.value });
                    }}
                    placeholder="4550"
                    maxLength={30}
                    className="w-32 sm:w-36 px-3 py-1.5 text-xs font-mono font-bold text-center bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />

                  {/* Botão Gravar (Substitui o botão Auto) */}
                  <button
                    type="button"
                    onClick={handleSaveControlNumber}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    title="Conferir se o número já existe e gravar no banco de dados"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Gravar</span>
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 block mt-1">
                  {isFamily
                    ? '★ Plano Familiar: Ao gravar, o número do plano é replicado automaticamente para todos os dependentes desta família.'
                    : '* 4 dígitos (ex: 4550). O indicador redondo acende em verde se liberado ou vermelho se já existente.'}
                </span>
              </div>

              {/* Nome do Frequentador */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo:
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo do titular ou dependente"
                  className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Data de Nascimento */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data de Nascimento:
                </label>
                <input
                  type="text"
                  value={formData.birthDate || ''}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  placeholder="DD/MM/AAAA"
                  className="w-full px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Categoria Específica com Plano Especial */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Categoria do Plano:
                </label>
                <select
                  value={formData.category || 'PLANO_INDIVIDUAL'}
                  onChange={(e) => {
                    const cat = e.target.value as CategoryType;
                    let pType = 'INDIVIDUAL';
                    if (cat === 'PLANO_FAMILIAR') pType = 'FAMILIAR';
                    if (cat === 'PLANO_ESPECIAL') pType = 'ESPECIAL';

                    setFormData({
                      ...formData,
                      category: cat,
                      planType: pType as any,
                      isSpecialExempt: cat === 'PLANO_ESPECIAL',
                    });
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-slate-800 cursor-pointer"
                >
                  <option value="PLANO_FAMILIAR">Plano Familiar (Titular / Dependentes)</option>
                  <option value="PLANO_INDIVIDUAL">Plano Individual (Comum)</option>
                  <option value="PLANO_ESPECIAL">★ Plano Especial (PCD / Autistas / Idosos / Down - Isento)</option>
                  <option value="PREFEITURA">Prefeitura (Servidores PMPA)</option>
                  <option value="BOMBEIROS">Bombeiros (CBMMG)</option>
                </select>
              </div>

              {/* ================= IMPRESSÃO EM LOTE (CHECKBOX) ================= */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-2.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!formData.batchPrintSelected}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData((prev) => ({ ...prev, batchPrintSelected: checked }));
                      if (activeCard) {
                        updateCard(activeCard.id, { batchPrintSelected: checked });
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-blue-900">
                    Impressão em Lote
                  </span>
                  {formData.batchPrintSelected && (
                    <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold ml-auto">
                      Marcada para Lote
                    </span>
                  )}
                </label>
                <span className="text-[10px] text-blue-700 block mt-1 leading-snug">
                  Ao marcar este checkbox, esta carteirinha é agrupada com as demais marcadas para preencher a folha A4 (limite de 4 carteirinhas por folha).
                </span>
              </div>

              {/* Campo Específico se for Plano Especial */}
              {formData.category === 'PLANO_ESPECIAL' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                    <HeartHandshake className="w-4 h-4 text-emerald-600" />
                    <span>Condição / Laudo do Plano Especial:</span>
                  </div>
                  <input
                    type="text"
                    value={formData.specialCondition || ''}
                    onChange={(e) => setFormData({ ...formData, specialCondition: e.target.value })}
                    placeholder="Ex: Síndrome de Down, Autista TEA, PCD Física..."
                    className="w-full px-2.5 py-1 text-xs bg-white border border-emerald-300 rounded text-emerald-950 font-medium"
                  />
                  <span className="text-[10px] text-emerald-700 block">
                    ★ Beneficiário Isento de Pagamento de mensalidades.
                  </span>
                </div>
              )}

              {/* ================= ITEM 1: CAMPO LOCALIZAÇÃO ARQUIVO FÍSICO COM REPLICAÇÃO NO PLANO FAMILIAR ================= */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Localização Arquivo Físico:</span>
                  {isFamily && (
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                      Pasta Compartilhada da Família
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.physicalArchiveLocation || ''}
                  onChange={(e) => handleArchiveLocationChange(e.target.value)}
                  placeholder="Ex: 10-C"
                  className="w-full px-3 py-1.5 text-xs font-mono font-bold uppercase bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5 leading-snug">
                  {isFamily
                    ? '★ Plano Familiar: A informação colocada no Titular é replicada automaticamente para todos os dependentes (mesma pasta e gaveta de arquivo).'
                    : 'Ex: 10-C (Armário 10, Gaveta C). Aparece na base da carteirinha.'}
                </span>
              </div>

              {/* CARREGAR BRASÃO DA PREFEITURA */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
                    Brasão de Pouso Alegre
                  </span>
                  {layoutConfig.customCoatOfArmsUrl && (
                    <button
                      type="button"
                      onClick={resetCoatOfArms}
                      className="text-[10px] text-rose-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" /> Restaurar Oficial
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs">
                    {layoutConfig.customCoatOfArmsUrl ? (
                      <img
                        src={layoutConfig.customCoatOfArmsUrl}
                        alt="Brasão Atual"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <BrasaoPousoAlegre size={48} />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 shadow-2xs transition-colors">
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>Substituir Brasão</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoatOfArmsUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-slate-400 block leading-tight">
                      PNG transparente recomendado (será aplicado em todas as carteirinhas).
                    </span>
                  </div>
                </div>
              </div>

              {/* Anos de Controle */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Ano 1 (Verso):
                  </label>
                  <input
                    type="text"
                    value={formData.year1 || '2026'}
                    onChange={(e) => setFormData({ ...formData, year1: e.target.value })}
                    className="w-full px-2.5 py-1 text-xs font-mono bg-slate-50 border border-slate-300 rounded text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Ano 2 (Verso):
                  </label>
                  <input
                    type="text"
                    value={formData.year2 || '2027'}
                    onChange={(e) => setFormData({ ...formData, year2: e.target.value })}
                    className="w-full px-2.5 py-1 text-xs font-mono bg-slate-50 border border-slate-300 rounded text-center font-bold"
                  />
                </div>
              </div>

              {/* Botão de Salvar Alterações */}
              <button
                type="button"
                onClick={handleSaveChanges}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-98 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Alterações na Carteirinha</span>
              </button>
            </div>
          </aside>

          {/* CENTER: Live Card Preview Canvas */}
          <main className="flex-1 bg-slate-200/80 overflow-auto p-4 sm:p-8 flex flex-col items-center justify-center relative">
            {/* Canvas Zoom Controls Toolbar */}
            <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-xs border border-slate-300 rounded-lg p-1 flex items-center gap-1 shadow-sm">
              <button
                onClick={() => setZoomScale((prev) => Math.max(0.6, prev - 0.1))}
                className="p-1 hover:bg-slate-100 rounded text-slate-700 transition-colors cursor-pointer"
                title="Diminuir Zoom"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono px-1 font-semibold text-slate-700">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={() => setZoomScale((prev) => Math.min(1.8, prev + 0.1))}
                className="p-1 hover:bg-slate-100 rounded text-slate-700 transition-colors cursor-pointer"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomScale(1)}
                className="p-1 hover:bg-slate-100 rounded text-slate-700 transition-colors cursor-pointer border-l border-slate-200 ml-1"
                title="Tamanho Real (100%)"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Instruction Banner */}
            <div className="mb-4 text-xs font-medium text-slate-600 flex items-center gap-2 bg-white/80 px-3 py-1 rounded-full border border-slate-300 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                Visualização 1:1 • Cartolina dobrável no meio • Frente com foto física 3x4 e Verso com tabela em branco
              </span>
            </div>

            {/* The Actual Printable Card Preview */}
            {activeCard && (
              <div className="transition-transform duration-200 flex items-center justify-center">
                <PrintableCard
                  card={{ ...activeCard, ...formData }}
                  config={layoutConfig}
                  scale={zoomScale}
                  className="shadow-2xl rounded-sm"
                />
              </div>
            )}
          </main>

          {/* RIGHT DRAWER: Layout Settings */}
          {showConfigDrawer && (
            <aside className="w-72 bg-white border-l border-slate-200 p-4 shrink-0 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  Ajustes de Layout
                </h3>
                <button
                  onClick={() => setShowConfigDrawer(false)}
                  className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* Dobra da Carteirinha */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Orientação da Dobra:
                  </label>
                  <select
                    value={layoutConfig.foldOrientation}
                    onChange={(e) =>
                      updateLayoutConfig({ foldOrientation: e.target.value as any })
                    }
                    className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs cursor-pointer"
                  >
                    <option value="horizontal">Horizontal (Lado a Lado - Padrão)</option>
                    <option value="vertical">Vertical (Topo a Base)</option>
                  </select>
                </div>

                {/* Dimensões em Milímetros */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">
                      Largura (mm):
                    </label>
                    <input
                      type="number"
                      value={layoutConfig.cardWidthMm}
                      onChange={(e) =>
                        updateLayoutConfig({ cardWidthMm: Number(e.target.value) })
                      }
                      className="w-full p-1 bg-slate-50 border border-slate-300 rounded text-center font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block">
                      Altura (mm):
                    </label>
                    <input
                      type="number"
                      value={layoutConfig.cardHeightMm}
                      onChange={(e) =>
                        updateLayoutConfig({ cardHeightMm: Number(e.target.value) })
                      }
                      className="w-full p-1 bg-slate-50 border border-slate-300 rounded text-center font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Exibir Brasão */}
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">Exibir Brasão:</label>
                  <input
                    type="checkbox"
                    checked={layoutConfig.showCoatOfArms}
                    onChange={(e) =>
                      updateLayoutConfig({ showCoatOfArms: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </div>

                {/* Exibir Moldura / Borda */}
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">Moldura Fina:</label>
                  <input
                    type="checkbox"
                    checked={layoutConfig.showBorder}
                    onChange={(e) => updateLayoutConfig({ showBorder: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </div>

                {/* Cor de Fundo da Cartolina */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Cor da Cartolina:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={layoutConfig.cardBackground}
                      onChange={(e) =>
                        updateLayoutConfig({ cardBackground: e.target.value })
                      }
                      className="w-8 h-8 rounded border border-slate-300 p-0.5 cursor-pointer"
                    />
                    <span className="text-xs font-mono self-center text-slate-600">
                      {layoutConfig.cardBackground}
                    </span>
                  </div>
                </div>

                {/* Cabeçalho Customizado */}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Título do Cabeçalho:
                  </label>
                  <input
                    type="text"
                    value={layoutConfig.customHeaderTitle}
                    onChange={(e) =>
                      updateLayoutConfig({ customHeaderTitle: e.target.value })
                    }
                    className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Subtítulo do Cabeçalho:
                  </label>
                  <input
                    type="text"
                    value={layoutConfig.customHeaderSubtitle}
                    onChange={(e) =>
                      updateLayoutConfig({ customHeaderSubtitle: e.target.value })
                    }
                    className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
                  />
                </div>

                {/* Orientação Invertida para Alimentações Específicas */}
                <div className="bg-amber-50 border border-amber-200 rounded p-2.5">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="rotate180Drawer"
                      checked={layoutConfig.rotateVerso180}
                      onChange={(e) => updateLayoutConfig({ rotateVerso180: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded mt-0.5 cursor-pointer"
                    />
                    <label htmlFor="rotate180Drawer" className="text-amber-900 leading-snug cursor-pointer">
                      <strong>Girar Verso em 180°:</strong> Marque apenas se a sua impressora física inverter a folha ao recolher a cartolina.
                    </label>
                  </div>
                </div>

                {/* Restaurar Padrões */}
                <button
                  onClick={resetLayoutConfig}
                  className="w-full py-1.5 text-slate-600 hover:text-slate-900 border border-slate-300 hover:bg-slate-50 rounded text-xs font-medium transition-colors cursor-pointer"
                >
                  Restaurar Padrões de Fábrica
                </button>
              </div>
            </aside>
          )}
        </div>
      )}

      {/* ================= MODAL DE ALERTA DE NÚMERO JÁ EXISTENTE (ITEM 2) ================= */}
      {duplicateWarningModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 border-red-500 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header Vermelho de Alerta */}
            <div className="bg-red-600 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-white" />
                <h3 className="font-bold text-sm tracking-wide uppercase">
                  Aviso do Sistema
                </h3>
              </div>
              <button
                onClick={() => setDuplicateWarningModal({ isOpen: false, number: '', planWord: '' })}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo com a Frase Exata Requisitada */}
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto border-2 border-red-200">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <div className="text-base sm:text-lg font-black text-red-700 tracking-tight leading-snug">
                  ESTE NÚMERO DE PLANO {duplicateWarningModal.planWord} JÁ EXISTE!
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  O número <strong className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">"{duplicateWarningModal.number}"</strong> já está registrado no banco de dados para o associado{' '}
                  <strong className="text-slate-900">{duplicateWarningModal.existingCardName || 'outro associado'}</strong>.
                  <br />
                  A gravação foi bloqueada. Por favor, utilize um número diferente.
                </p>
              </div>

              <button
                onClick={() => setDuplicateWarningModal({ isOpen: false, number: '', planWord: '' })}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-98 uppercase tracking-wider cursor-pointer"
              >
                Entendido, Corrigir Número
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL DE VISUALIZAR IMPRESSÃO (A4 PAISAGEM COM 4 CARTEIRINHAS) ================= */}
      {showPrintSheetModal && (
        <PrintSheetViewerModal
          isOpen={showPrintSheetModal}
          onClose={() => setShowPrintSheetModal(false)}
          activeCard={activeCard ? { ...activeCard, ...formData } : null}
          familyMembers={familyMembers}
          allCards={cards}
          layoutConfig={layoutConfig}
          initialMode={printSheetInitialMode}
        />
      )}

      {/* ================= MODAL ADICIONAR DEPENDENTE NO GDA ================= */}
      {showAddDepModalGda && titularCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <form onSubmit={handleAddDepGdaSubmit}>
              <div className="p-4 bg-indigo-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Adicionar Dependente (GDA)</h3>
                  <p className="text-[11px] text-indigo-200">
                    Titular: {titularCard.name} ({titularCard.controlNumber})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddDepModalGda(false)}
                  className="text-indigo-200 hover:text-white cursor-pointer"
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
                    value={depFormDataGda.name}
                    onChange={(e) => setDepFormDataGda({ ...depFormDataGda, name: e.target.value })}
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
                      {depFormDataGda.docJud ? 'DOC JUD ativo (+1 vínculo admitido)' : 'Marcação única ou com DOC JUD'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-0.5">
                    {(['Esposa', 'Filho', 'Irmão', 'Sobrinho', 'Neto'] as const).map((kinshipOpt) => {
                      const isChecked = depFormDataGda.kinship === kinshipOpt;
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
                              setDepFormDataGda((prev) => ({
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
                        depFormDataGda.docJud
                          ? 'bg-amber-100 border-amber-400 text-amber-950 font-bold shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={depFormDataGda.docJud}
                        onChange={(e) => {
                          setDepFormDataGda((prev) => ({
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
                      value={depFormDataGda.birthDate}
                      onChange={(e) => setDepFormDataGda({ ...depFormDataGda, birthDate: e.target.value })}
                      onBlur={() =>
                        setDepFormDataGda((prev) => ({
                          ...prev,
                          birthDate: formatBirthDate(prev.birthDate),
                        }))
                      }
                      placeholder="DD/MM/AAAA (ex: 15/01/2010)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs pr-9"
                    />
                    <input
                      ref={gdaDepDateInputRef}
                      type="date"
                      className="sr-only"
                      onChange={(e) => {
                        if (e.target.value) {
                          const [y, m, d] = e.target.value.split('-');
                          setDepFormDataGda((prev) => ({ ...prev, birthDate: `${d}/${m}/${y}` }));
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => gdaDepDateInputRef.current?.showPicker?.() || gdaDepDateInputRef.current?.click()}
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
                      {depDocTypeGda === 'CPF' ? 'CPF (Opcional):' : 'RG (Opcional):'}
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 cursor-pointer text-slate-700 hover:text-indigo-600 select-none text-[11px]">
                        <input
                          type="checkbox"
                          checked={depDocTypeGda === 'CPF'}
                          onChange={() => {
                            setDepDocTypeGda('CPF');
                            if (depFormDataGda.rgOrCpf) {
                              setDepFormDataGda((prev) => ({
                                ...prev,
                                rgOrCpf: formatCpfNumber(prev.rgOrCpf),
                              }));
                            }
                          }}
                          className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className={depDocTypeGda === 'CPF' ? 'font-bold text-indigo-700' : 'font-medium'}>
                          CPF
                        </span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer text-slate-700 hover:text-indigo-600 select-none text-[11px]">
                        <input
                          type="checkbox"
                          checked={depDocTypeGda === 'RG'}
                          onChange={() => setDepDocTypeGda('RG')}
                          className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span className={depDocTypeGda === 'RG' ? 'font-bold text-indigo-700' : 'font-medium'}>
                          RG
                        </span>
                      </label>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={depFormDataGda.rgOrCpf}
                    onChange={(e) => setDepFormDataGda({ ...depFormDataGda, rgOrCpf: e.target.value })}
                    onBlur={() => {
                      if (depDocTypeGda === 'CPF') {
                        const formatted = formatCpfNumber(depFormDataGda.rgOrCpf);
                        setDepFormDataGda((prev) => ({ ...prev, rgOrCpf: formatted }));
                      }
                    }}
                    placeholder={
                      depDocTypeGda === 'CPF'
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
                    value={depFormDataGda.phone}
                    onChange={(e) => setDepFormDataGda({ ...depFormDataGda, phone: e.target.value })}
                    placeholder="(35) 99999-9999"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDepModalGda(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Adicionar Dependente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
