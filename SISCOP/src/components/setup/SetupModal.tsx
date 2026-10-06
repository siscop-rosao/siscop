import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { BrasaoPousoAlegre } from '../common/BrasaoPousoAlegre';
import {
  X,
  Upload,
  RotateCcw,
  Check,
  Image as ImageIcon,
  SlidersHorizontal,
  Sparkles,
  Shield,
  Eye,
  Type,
} from 'lucide-react';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupModal: React.FC<SetupModalProps> = ({ isOpen, onClose }) => {
  const {
    platformSettings,
    updatePlatformSettings,
    resetPlatformSettings,
    uploadNavbarLogo,
    uploadDashboardBanner,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'NAVBAR' | 'DASHBOARD' | 'TEXTS'>('NAVBAR');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const navbarFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Upload navbar logo
  const handleNavbarLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        uploadNavbarLogo(dataUrl);
        showToast('Brasão da barra fixa atualizado com sucesso!');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Upload high-resolution dashboard banner
  const handleDashboardBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        uploadDashboardBanner(dataUrl);
        showToast('Imagem de alta resolução do Dashboard atualizada com sucesso!');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleResetNavbarLogo = () => {
    updatePlatformSettings({ navbarLogoUrl: '' });
    showToast('Brasão oficial vetorial padrão restaurado na barra fixa!');
  };

  const handleResetDashboardBanner = () => {
    updatePlatformSettings({ dashboardBannerUrl: '' });
    showToast('Painel visual do Dashboard restaurado ao padrão!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* ================= MODAL HEADER ================= */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-blue-600 text-white tracking-widest uppercase">
                  SISCOP
                </span>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Setup da Plataforma • Identidade Visual & Layout
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Personalização de imagens, brasão da barra fixa e banner central do Dashboard
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= TABS SELECTOR ================= */}
        <div className="bg-slate-100 border-b border-slate-200 px-5 pt-3 flex gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('NAVBAR')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'NAVBAR'
                ? 'bg-white text-indigo-700 border-slate-200 shadow-xs -mb-px'
                : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 text-blue-600" />
            <span>1. Brasão da Barra Fixa</span>
          </button>

          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'DASHBOARD'
                ? 'bg-white text-indigo-700 border-slate-200 shadow-xs -mb-px'
                : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-indigo-600" />
            <span>2. Imagem Central do Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('TEXTS')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x ${
              activeTab === 'TEXTS'
                ? 'bg-white text-indigo-700 border-slate-200 shadow-xs -mb-px'
                : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Type className="w-4 h-4 text-emerald-600" />
            <span>3. Títulos Oficiais do SISCOP</span>
          </button>
        </div>

        {/* ================= TOAST NOTIFICATION ================= */}
        {successToast && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shrink-0 shadow-xs animate-in slide-in-from-top">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{successToast}</span>
            </div>
            <button
              onClick={() => setSuccessToast(null)}
              className="text-emerald-100 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ================= MODAL BODY ================= */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* TAB 1: BRASÃO DA BARRA FIXA */}
          {activeTab === 'NAVBAR' && (
            <div className="space-y-6">
              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-700" />
                  Brasão da Prefeitura Municipal na Barra Fixa Superior
                </h3>
                <p className="text-xs text-blue-900/80 mt-1 leading-relaxed">
                  Carregue a imagem oficial do brasão de Pouso Alegre para aparecer no canto superior esquerdo da barra fixa fixa do sistema, substituindo a imagem atual.
                </p>
              </div>

              {/* Preview Box & Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-slate-50 border border-slate-200 rounded-xl p-5">
                {/* Visualizer */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-900 rounded-xl border border-slate-800 text-white text-center">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-3 block">
                    Pré-visualização na Barra Fixa:
                  </span>
                  <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700 shadow-inner">
                    {platformSettings.navbarLogoUrl ? (
                      <img
                        src={platformSettings.navbarLogoUrl}
                        alt="Brasão Pouso Alegre"
                        className="w-14 h-14 object-contain rounded-xs drop-shadow-md"
                      />
                    ) : (
                      <BrasaoPousoAlegre size={52} />
                    )}
                    <div className="text-left leading-tight">
                      <span className="text-[10px] font-extrabold text-blue-300 uppercase tracking-wider block">
                        SISCOP • Pouso Alegre
                      </span>
                      <span className="text-sm font-black text-white block">
                        Praça de Esportes
                      </span>
                      <span className="text-[9.5px] text-slate-300 font-medium">
                        Pref. Alvarim Vieira Rios
                      </span>
                    </div>
                  </div>
                  <span className="text-[10.5px] text-slate-400 mt-3 font-medium">
                    {platformSettings.navbarLogoUrl ? '✓ Imagem customizada ativa' : '• Brasão oficial vetorial padrão ativo'}
                  </span>
                </div>

                {/* Upload & Reset Buttons */}
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={navbarFileInputRef}
                    accept="image/*"
                    onChange={handleNavbarLogoUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => navbarFileInputRef.current?.click()}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Carregar Imagem do Brasão para Barra Fixa</span>
                  </button>

                  {platformSettings.navbarLogoUrl && (
                    <button
                      type="button"
                      onClick={handleResetNavbarLogo}
                      className="w-full py-2 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      <span>Restaurar Brasão Vetorial Padrão</span>
                    </button>
                  )}

                  <p className="text-[11px] text-slate-500 leading-normal">
                    Formatos suportados: PNG com fundo transparente, JPG, SVG ou WebP. Resolução recomendada: 128x128 até 512x512 pixels.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: IMAGEM CENTRAL DO DASHBOARD */}
          {activeTab === 'DASHBOARD' && (
            <div className="space-y-6">
              <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-700" />
                  Imagem Central Superior do Dashboard (Grande Resolução)
                </h3>
                <p className="text-xs text-indigo-900/80 mt-1 leading-relaxed">
                  Carregue uma imagem em alta resolução (como a foto da fachada, brasão monumental ou banner) para substituir de forma centralizada o quadro lilás no topo do Dashboard. Logo abaixo da imagem serão exibidos os dizeres oficiais solicitados.
                </p>
              </div>

              {/* Upload & Action Bar */}
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  ref={bannerFileInputRef}
                  accept="image/*"
                  onChange={handleDashboardBannerUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => bannerFileInputRef.current?.click()}
                  className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>Carregar Imagem de Grande Resolução</span>
                </button>

                {platformSettings.dashboardBannerUrl && (
                  <button
                    type="button"
                    onClick={handleResetDashboardBanner}
                    className="py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Restaurar Padrão do Dashboard</span>
                  </button>
                )}
              </div>

              {/* Interactive Live Preview of Dashboard Top Presentation */}
              <div className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl p-5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    Pré-visualização de como aparecerá no topo do Dashboard:
                  </span>
                  <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {platformSettings.dashboardBannerUrl ? 'Imagem de Grande Resolução Ativa' : 'Imagem Padrão Ativa'}
                  </span>
                </div>

                {/* The Centralized Dashboard Presentation Card */}
                <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 flex flex-col items-center justify-center text-center">
                  {/* High-Resolution Centered Image */}
                  <div className="max-w-md w-full mb-4 flex items-center justify-center">
                    {platformSettings.dashboardBannerUrl ? (
                      <img
                        src={platformSettings.dashboardBannerUrl}
                        alt="Painel Central SISCOP"
                        className="max-h-56 w-auto object-contain rounded-xl"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-4 px-10 w-full">
                        <BrasaoPousoAlegre size={110} />
                        <span className="text-[11px] font-mono text-slate-500 mt-2 font-semibold">
                          [ Imagem Oficial de Pouso Alegre ]
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Required Exact Texts Below The Centered Image */}
                  <div className="space-y-1 text-center">
                    {/* Linha 1: SISCOP - Sistema de Controle Operacional (fonte média: 18) */}
                    <h1
                      className="font-bold text-slate-900 tracking-tight"
                      style={{ fontSize: '18px', lineHeight: '1.3' }}
                    >
                      {platformSettings.dashboardTitle || 'SISCOP - Sistema de Controle Operacional'}
                    </h1>

                    {/* Linha 2: Plataforma informatizada para emissão de carteirinhas e gestão de processos (fonte pequena: 10) */}
                    <p
                      className="text-slate-500 font-medium"
                      style={{ fontSize: '10px', lineHeight: '1.4' }}
                    >
                      {platformSettings.dashboardSubtitle ||
                        'Plataforma informatizada para emissão de carteirinhas e gestão de processos'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TÍTULOS E NOMES OFICIAIS */}
          {activeTab === 'TEXTS' && (
            <div className="space-y-5">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4">
                <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                  <Type className="w-4 h-4 text-emerald-700" />
                  Dizeres Oficiais Exibidos Abaixo da Imagem Central
                </h3>
                <p className="text-xs text-emerald-900/80 mt-1 leading-relaxed">
                  Os dizeres abaixo aparecem centralizados logo abaixo da imagem do Dashboard nos tamanhos exatos configurados (Linha 1 com fonte 18 e Linha 2 com fonte 10).
                </p>
              </div>

              <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Linha 1 (Fonte Média: 18):
                  </label>
                  <input
                    type="text"
                    value={platformSettings.dashboardTitle}
                    onChange={(e) => updatePlatformSettings({ dashboardTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="SISCOP - Sistema de Controle Operacional"
                  />
                  <span className="text-[10.5px] text-slate-500 mt-0.5 block">
                    Padrão: SISCOP - Sistema de Controle Operacional
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Linha 2 (Fonte Pequena: 10):
                  </label>
                  <input
                    type="text"
                    value={platformSettings.dashboardSubtitle}
                    onChange={(e) => updatePlatformSettings({ dashboardSubtitle: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-700 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Plataforma informatizada para emissão de carteirinhas e gestão de processos"
                  />
                  <span className="text-[10.5px] text-slate-500 mt-0.5 block">
                    Padrão: Plataforma informatizada para emissão de carteirinhas e gestão de processos
                  </span>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      updatePlatformSettings({
                        dashboardTitle: 'SISCOP - Sistema de Controle Operacional',
                        dashboardSubtitle:
                          'Plataforma informatizada para emissão de carteirinhas e gestão de processos',
                      });
                      showToast('Dizeres oficiais restaurados ao padrão!');
                    }}
                    className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar Textos Originais</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="bg-slate-100 border-t border-slate-200 px-5 py-3.5 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              resetPlatformSettings();
              showToast('Todas as configurações de Setup foram restauradas aos padrões de fábrica!');
            }}
            className="text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Todos os Padrões de Fábrica</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Concluir e Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
