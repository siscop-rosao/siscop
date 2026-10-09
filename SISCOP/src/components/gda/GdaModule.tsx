import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CardData, CategoryType } from '../../types';
import { PrintableCard } from './PrintableCard';
import { FoldSimulatorModal } from './FoldSimulatorModal';
import { PrintSheetViewerModal } from './PrintSheetViewerModal';
import { GdaReportsView } from './GdaReportsView';
import { GdaLatestRecordsView } from './GdaLatestRecordsView';
import { BrasaoPousoAlegre } from '../common/BrasaoPousoAlegre';
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
      });
      setNumberValidationStatus('idle');
    }
  }, [activeCard, layoutConfig.directorLabel]);

  // Handle Coat of Arms Image Upload
  const handleCoatOfArmsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        updateCoatOfArms(result);
      };
      reader.readAsDataURL(file);
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

  // ITEM 2: Gravar e conferir número do plano / controle com indicador verde/vermelho e alerta
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
    const duplicate = cards.find(
      (c) => c.id !== activeCard?.id && c.controlNumber?.trim().toLowerCase() === typedNumber.toLowerCase()
    );

    if (duplicate) {
      // Já foi utilizado: Bloqueia gravação, botão redondo fica vermelho, abre janela de alerta
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
    if (activeCard) {
      updateCard(activeCard.id, { controlNumber: typedNumber });
    }
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  // Save changes
  const handleSaveChanges = () => {
    if (activeCard) {
      updateCard(activeCard.id, formData);

      // Replicar localização de arquivo físico se for plano familiar
      const isFam = formData.category === 'PLANO_FAMILIAR' || activeCard.planType === 'FAMILIAR';
      if (isFam && titularCard && formData.physicalArchiveLocation !== undefined) {
        const dependents = cards.filter((c) => c.familyHeadId === titularCard.id);
        dependents.forEach((dep) => {
          updateCard(dep.id, { physicalArchiveLocation: formData.physicalArchiveLocation });
        });
        if (titularCard.id !== activeCard.id) {
          updateCard(titularCard.id, { physicalArchiveLocation: formData.physicalArchiveLocation });
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
    setShowPrintSheetModal(true);
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

  // Add dependent to current family
  const handleAddDependent = () => {
    if (!titularCard) return;
    const dep = addFamilyMember(titularCard.id, {
      name: 'Novo Dependente',
      birthDate: '',
      physicalArchiveLocation: titularCard.physicalArchiveLocation || '',
    });
    setActiveCardId(dep.id);
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

            {/* Fold Simulator Button */}
            <button
              onClick={() => setShowFoldModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              title="Simular dobra para conferir frente e verso"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Simulador 3D de Dobra</span>
            </button>

            {/* Layout Settings Toggle */}
            <button
              onClick={() => setShowConfigDrawer(!showConfigDrawer)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                showConfigDrawer
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Personalizar Layout</span>
            </button>

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
                      onClick={() => setActiveCardId(m.id)}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número do Plano / Controle:
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
                    maxLength={12}
                    className="w-28 sm:w-32 px-3 py-1.5 text-xs font-mono font-bold text-center bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  * 4 dígitos (ex: 4550). O indicador redondo acende em verde se liberado ou vermelho se já existente.
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
        />
      )}

      {/* ================= FOLD SIMULATOR MODAL ================= */}
      {showFoldModal && activeCard && (
        <FoldSimulatorModal
          card={{ ...activeCard, ...formData }}
          config={layoutConfig}
          onClose={() => setShowFoldModal(false)}
          onUpdateConfig={updateLayoutConfig}
        />
      )}
    </div>
  );
};
