import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { BrasaoPousoAlegre } from '../common/BrasaoPousoAlegre';
import { validatePasswordRules } from '../../utils/passwordValidator';
import { User, UserRole } from '../../types';
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
  EyeOff,
  Type,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Lock,
  Unlock,
  KeyRound,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Trash2,
  Edit3,
  ShieldAlert,
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
    users,
    addUser,
    updateUser,
    deleteUser,
    unlockUser,
    updateUserPassword,
    currentUser,
  } = useApp();

  // Abas Principais: 1. Identidade Visual & Layout | 2. Setup de Acesso
  const [mainTab, setMainTab] = useState<'VISUAL' | 'ACCESS'>('VISUAL');

  // Sub-abas de Identidade Visual
  const [visualSubTab, setVisualSubTab] = useState<'NAVBAR' | 'DASHBOARD' | 'TEXTS'>('NAVBAR');

  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Estados do Setup de Acesso
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [passwordChangeUserId, setPasswordChangeUserId] = useState<string | null>(null);
  const [unlockTargetUserId, setUnlockTargetUserId] = useState<string | null>(null);
  const [adminUnlockPassword, setAdminUnlockPassword] = useState('');

  // Formulário de Cadastro / Edição de Usuário
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formMatriculaOrCpf, setFormMatriculaOrCpf] = useState('');
  const [formOrgaoOrEmpresa, setFormOrgaoOrEmpresa] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('operador');
  const [formPassword, setFormPassword] = useState('');
  const [formConfirmPassword, setFormConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Formulário de Troca de Senha
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const navbarFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const showError = (msg: string) => {
    setErrorToast(msg);
    setTimeout(() => setErrorToast(null), 4000);
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

  // Estatísticas de Usuários
  const totalUsers = users.length;
  const adminUsers = users.filter((u) => u.role === 'admin');
  const adminCount = adminUsers.length;
  const lockedUsers = users.filter((u) => u.isLocked);

  // Validação em tempo real de senha
  const passwordRules = validatePasswordRules(formPassword);
  const passwordsMatch = formPassword.length > 0 && formPassword === formConfirmPassword;

  // Validação de troca de senha
  const newPasswordRules = validatePasswordRules(newPassword);
  const newPasswordsMatch = newPassword.length > 0 && newPassword === confirmNewPassword;

  // Limpar formulário de cadastro
  const resetUserForm = () => {
    setFormName('');
    setFormUsername('');
    setFormMatriculaOrCpf('');
    setFormOrgaoOrEmpresa('');
    setFormRole(adminCount >= 2 ? 'operador' : 'admin');
    setFormPassword('');
    setFormConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setEditingUserId(null);
  };

  // Submeter cadastro / edição de usuário
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || !formUsername.trim()) {
      showError('Nome completo e Nome de Usuário são campos obrigatórios.');
      return;
    }

    if (formRole === 'admin' && adminCount >= 2 && (!editingUserId || users.find(u => u.id === editingUserId)?.role !== 'admin')) {
      showError('Limite atingido: O SISCOP permite no máximo 2 Administradores cadastrados simultaneamente.');
      return;
    }

    // Modo Criação: exige senha válida com todas as 5 regras
    if (!editingUserId) {
      if (!passwordRules.isValid) {
        showError('A senha cadastrada não atende a todos os 5 requisitos de segurança exigidos.');
        return;
      }
      if (!passwordsMatch) {
        showError('A confirmação da senha não coincide com a senha digitada.');
        return;
      }

      const res = addUser({
        name: formName.trim(),
        username: formUsername.trim().toLowerCase(),
        matriculaOrCpf: formMatriculaOrCpf.trim() || undefined,
        orgaoOrEmpresa: formOrgaoOrEmpresa.trim() || undefined,
        cargo: formRole === 'admin' ? 'Administrador SISCOP' : 'Operador',
        role: formRole,
        password: formPassword,
        active: true,
        avatarColor: formRole === 'admin' ? 'bg-indigo-600' : 'bg-emerald-600',
      });

      if (!res.success) {
        showError(res.message || 'Erro ao cadastrar usuário.');
        return;
      }

      showToast(`Usuário ${formName} cadastrado com sucesso no SISCOP!`);
      setIsAddUserModalOpen(false);
      resetUserForm();
    } else {
      // Modo Edição - Salva nome, nome de usuário livre, cargo/privilégio e demais dados
      const res = updateUser(editingUserId, {
        name: formName.trim(),
        username: formUsername.trim().toLowerCase(),
        matriculaOrCpf: formMatriculaOrCpf.trim() || undefined,
        orgaoOrEmpresa: formOrgaoOrEmpresa.trim() || undefined,
        role: formRole,
        cargo: formRole === 'admin' ? 'Administrador SISCOP' : 'Operador',
      });

      if (!res.success) {
        showError(res.message || 'Erro ao atualizar usuário.');
        return;
      }

      showToast(`Dados do usuário ${formName} (@${formUsername.trim().toLowerCase()}) atualizados com sucesso!`);
      setIsAddUserModalOpen(false);
      resetUserForm();
    }
  };

  // Abrir edição de dados do usuário
  const handleOpenEditUser = (u: User) => {
    setEditingUserId(u.id);
    setFormName(u.name);
    setFormUsername(u.username);
    setFormMatriculaOrCpf(u.matriculaOrCpf || '');
    setFormOrgaoOrEmpresa(u.orgaoOrEmpresa || '');
    setFormRole(u.role);
    setFormPassword('');
    setFormConfirmPassword('');
    setIsAddUserModalOpen(true);
  };

  // Submeter troca de senha
  const handleSavePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordChangeUserId) return;

    if (!newPasswordRules.isValid) {
      showError('A nova senha não atende aos requisitos de segurança do checklist.');
      return;
    }
    if (!newPasswordsMatch) {
      showError('A confirmação da nova senha não confere.');
      return;
    }

    updateUserPassword(passwordChangeUserId, newPassword);
    showToast('Senha de acesso alterada com sucesso!');
    setPasswordChangeUserId(null);
    setNewPassword('');
    setConfirmNewPassword('');
  };

  // Executar desbloqueio de usuário travado
  const handleExecuteUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockTargetUserId) return;

    const res = unlockUser(unlockTargetUserId, adminUnlockPassword);
    if (!res.success) {
      showError(res.message || 'Senha incorreta do Administrador.');
      return;
    }

    showToast(res.message || 'Usuário destravado com sucesso!');
    setUnlockTargetUserId(null);
    setAdminUnlockPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
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
                  Setup da Plataforma
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Configuração visual, identidade institucional e gestão de acesso de usuários
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= ABAS PRINCIPAIS DO SETUP ================= */}
        <div className="bg-slate-950 px-5 pt-3 flex gap-3 border-b border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setMainTab('VISUAL')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-t border-x cursor-pointer ${
              mainTab === 'VISUAL'
                ? 'bg-slate-100 text-indigo-900 border-slate-200 shadow-sm'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-indigo-500" />
            <span>Identidade Visual & Layout</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('ACCESS')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-t border-x cursor-pointer ${
              mainTab === 'ACCESS'
                ? 'bg-slate-100 text-indigo-900 border-slate-200 shadow-sm'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Setup de Acesso (Usuários & Senhas)</span>
            {lockedUsers.length > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[9px] font-mono font-bold animate-pulse">
                {lockedUsers.length} Travado{lockedUsers.length > 1 ? 's' : ''}
              </span>
            )}
          </button>
        </div>

        {/* ================= SUB-ABAS DE IDENTIDADE VISUAL ================= */}
        {mainTab === 'VISUAL' && (
          <div className="bg-slate-100 border-b border-slate-200 px-5 pt-3 flex gap-2 shrink-0">
            <button
              onClick={() => setVisualSubTab('NAVBAR')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x cursor-pointer ${
                visualSubTab === 'NAVBAR'
                  ? 'bg-white text-indigo-700 border-slate-200 shadow-xs -mb-px'
                  : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Shield className="w-4 h-4 text-blue-600" />
              <span>1. Brasão da Barra Fixa</span>
            </button>

            <button
              onClick={() => setVisualSubTab('DASHBOARD')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x cursor-pointer ${
                visualSubTab === 'DASHBOARD'
                  ? 'bg-white text-indigo-700 border-slate-200 shadow-xs -mb-px'
                  : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              <span>2. Imagem Central do Dashboard</span>
            </button>

            <button
              onClick={() => setVisualSubTab('TEXTS')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition-all border-t border-x cursor-pointer ${
                visualSubTab === 'TEXTS'
                  ? 'bg-white text-indigo-700 border-slate-200 shadow-xs -mb-px'
                  : 'bg-slate-200/70 text-slate-600 border-transparent hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Type className="w-4 h-4 text-emerald-600" />
              <span>3. Títulos Oficiais do SISCOP</span>
            </button>
          </div>
        )}

        {/* ================= TOASTS DE NOTIFICAÇÃO ================= */}
        {successToast && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shrink-0 shadow-xs animate-in slide-in-from-top">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{successToast}</span>
            </div>
            <button onClick={() => setSuccessToast(null)} className="text-emerald-100 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {errorToast && (
          <div className="bg-rose-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shrink-0 shadow-xs animate-in slide-in-from-top">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{errorToast}</span>
            </div>
            <button onClick={() => setErrorToast(null)} className="text-rose-100 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ================= CORPO DO MODAL ================= */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 bg-white">
          {/* ================= ABA 1: IDENTIDADE VISUAL & LAYOUT ================= */}
          {mainTab === 'VISUAL' && (
            <>
              {/* SUB-ABA 1: BRASÃO DA BARRA FIXA */}
              {visualSubTab === 'NAVBAR' && (
                <div className="space-y-6">
                  <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-700" />
                      Brasão da Prefeitura Municipal na Barra Fixa Superior
                    </h3>
                    <p className="text-xs text-blue-900/80 mt-1 leading-relaxed">
                      Carregue a imagem oficial do brasão de Pouso Alegre para aparecer no canto superior esquerdo da barra fixa do sistema, substituindo a imagem atual.
                    </p>
                  </div>

                  {/* Preview Box & Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-slate-50 border border-slate-200 rounded-2xl p-5">
                    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-xl border border-slate-800 text-white">
                      <span className="text-[11px] font-mono text-slate-400 mb-3 uppercase tracking-wider">
                        Pré-visualização na Barra Fixa
                      </span>
                      <div className="flex items-center gap-3 p-3 bg-slate-950/80 rounded-xl border border-slate-700/60 shadow-inner">
                        {platformSettings.navbarLogoUrl ? (
                          <img
                            src={platformSettings.navbarLogoUrl}
                            alt="Brasão Customizado"
                            className="w-10 h-10 object-contain drop-shadow-sm"
                          />
                        ) : (
                          <BrasaoPousoAlegre className="w-10 h-10 drop-shadow-sm" />
                        )}
                        <div>
                          <div className="text-xs font-black tracking-wide text-white uppercase">
                            PREFEITURA DE POUSO ALEGRE
                          </div>
                          <div className="text-[10px] text-blue-300 font-medium">
                            Secretaria de Juventude, Esportes e Lazer
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="file"
                        ref={navbarFileInputRef}
                        onChange={handleNavbarLogoUpload}
                        accept="image/*"
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => navbarFileInputRef.current?.click()}
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Carregar Imagem do Brasão da Barra Fixa</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetNavbarLogo}
                        className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4 text-slate-500" />
                        <span>Restaurar Brasão Vetorial Original</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-ABA 2: IMAGEM CENTRAL DO DASHBOARD */}
              {visualSubTab === 'DASHBOARD' && (
                <div className="space-y-6">
                  <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-indigo-950 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-indigo-700" />
                      Logotipo Central da Prefeitura de Pouso Alegre no Dashboard
                    </h3>
                    <p className="text-xs text-indigo-900/80 mt-1 leading-relaxed">
                      Altere o logotipo ou imagem central exibida com destaque no centro da página principal do Dashboard.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-slate-50 border border-slate-200 rounded-2xl p-5">
                    <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-xl border border-slate-800 text-white">
                      <span className="text-[11px] font-mono text-slate-400 mb-3 uppercase tracking-wider">
                        Pré-visualização Central do Dashboard
                      </span>
                      <div className="w-48 h-32 flex items-center justify-center bg-slate-950/90 rounded-xl border border-slate-800 p-2 overflow-hidden shadow-inner">
                        {platformSettings.dashboardBannerUrl ? (
                          <img
                            src={platformSettings.dashboardBannerUrl}
                            alt="Banner Central"
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <BrasaoPousoAlegre className="w-24 h-24" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <input
                        type="file"
                        ref={bannerFileInputRef}
                        onChange={handleDashboardBannerUpload}
                        accept="image/*"
                        className="hidden"
                      />

                      <button
                        type="button"
                        onClick={() => bannerFileInputRef.current?.click()}
                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Carregar Imagem Central do Dashboard</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetDashboardBanner}
                        className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4 text-slate-500" />
                        <span>Restaurar Logotipo Central Original</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-ABA 3: TÍTULOS OFICIAIS DO SISCOP */}
              {visualSubTab === 'TEXTS' && (
                <div className="space-y-6">
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4">
                    <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                      <Type className="w-4 h-4 text-emerald-700" />
                      Títulos Oficiais & Dizeres do SISCOP
                    </h3>
                    <p className="text-xs text-emerald-900/80 mt-1 leading-relaxed">
                      Personalize os dizeres e legendas do cabeçalho principal do Dashboard conforme as normas municipais.
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-800 mb-1">
                        Linha 1 (Fonte Principal: 13 / Negrito):
                      </label>
                      <input
                        type="text"
                        value={platformSettings.dashboardTitle}
                        onChange={(e) => updatePlatformSettings({ dashboardTitle: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                        className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restaurar Textos Originais</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ================= ABA 2: SETUP DE ACESSO (USUÁRIOS & SENHAS) ================= */}
          {mainTab === 'ACCESS' && (
            <div className="space-y-6">
              {/* Header Informativo e Contadores */}
              <div className="bg-slate-900 text-white p-4.5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-600 text-white uppercase tracking-wider">
                      SEGURANÇA & CONTROLE DE ACESSO
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      Gestão de Usuários, Credenciais e Políticas de Senha
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Cadastre, altere senhas, destrave acessos e gerencie operadores autorizados (Máximo de 2 Administradores).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    resetUserForm();
                    setIsAddUserModalOpen(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shrink-0 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Cadastrar Novo Usuário</span>
                </button>
              </div>

              {/* Quadro de Resumo de Privilégios */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      Total de Usuários
                    </div>
                    <div className="text-lg font-black text-slate-800">{totalUsers} cadastrados</div>
                  </div>
                  <Users className="w-7 h-7 text-slate-400" />
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide">
                      Administradores SISCOP
                    </div>
                    <div className="text-lg font-black text-indigo-950">
                      {adminCount} / 2 <span className="text-xs font-medium text-indigo-700">(Limite Oficial)</span>
                    </div>
                  </div>
                  <Shield className="w-7 h-7 text-indigo-600" />
                </div>

                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  lockedUsers.length > 0 ? 'bg-rose-50 border-rose-300' : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <div>
                    <div className={`text-[11px] font-bold uppercase tracking-wide ${
                      lockedUsers.length > 0 ? 'text-rose-700' : 'text-emerald-700'
                    }`}>
                      Contas Travadas (3 Erros)
                    </div>
                    <div className={`text-lg font-black ${
                      lockedUsers.length > 0 ? 'text-rose-800' : 'text-emerald-800'
                    }`}>
                      {lockedUsers.length} bloqueada{lockedUsers.length > 1 ? 's' : ''}
                    </div>
                  </div>
                  {lockedUsers.length > 0 ? (
                    <Lock className="w-7 h-7 text-rose-600 animate-pulse" />
                  ) : (
                    <UserCheck className="w-7 h-7 text-emerald-600" />
                  )}
                </div>
              </div>

              {/* Lista de Usuários */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-3.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Usuários Cadastrados na Plataforma
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Critério de Bloqueio: 3 tentativas incorretas
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const isCurrentUser = currentUser?.id === u.id;
                    return (
                      <div
                        key={u.id}
                        className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                          u.isLocked ? 'bg-rose-50/60' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Identificação do Usuário */}
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl ${u.avatarColor} text-white font-bold flex items-center justify-center shrink-0 shadow-xs text-xs`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {u.name}
                              </span>
                              <span className="text-[11px] font-mono font-medium text-slate-500">
                                (@{u.username})
                              </span>

                              {/* Badge de Perfil / Cargo */}
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                u.role === 'admin'
                                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                {u.role === 'admin' ? 'Administrador SISCOP' : 'Operador'}
                              </span>

                              {isCurrentUser && (
                                <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded text-[9px] font-bold">
                                  Você (Sessão Atual)
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-medium">
                              <span>Matrícula/CPF: <strong>{u.matriculaOrCpf || 'Não informado'}</strong></span>
                              <span>•</span>
                              <span>Órgão/Empresa: <strong>{u.orgaoOrEmpresa || 'Praça de Esportes'}</strong></span>
                            </div>

                            {/* Status de Bloqueio */}
                            <div className="mt-2">
                              {u.isLocked ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-600 text-white rounded-lg text-[10.5px] font-bold shadow-xs">
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>ACESSO TRAVADO • 3 TENTATIVAS INCORRETAS</span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10.5px] font-medium">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Acesso Normal</span>
                                  {u.failedLoginAttempts && u.failedLoginAttempts > 0 ? (
                                    <span className="text-amber-700 font-bold ml-1">
                                      ({u.failedLoginAttempts} tentativa falha)
                                    </span>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Ações do Usuário */}
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                          {/* Botão de Destravar (Apenas se o usuário estiver travado) */}
                          {u.isLocked && (
                            <button
                              type="button"
                              onClick={() => {
                                setUnlockTargetUserId(u.id);
                                setAdminUnlockPassword('');
                              }}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                              title="Destravar com Senha de Administrador"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Destravar Acesso</span>
                            </button>
                          )}

                          {/* Botão de Trocar Senha */}
                          <button
                            type="button"
                            onClick={() => {
                              setPasswordChangeUserId(u.id);
                              setNewPassword('');
                              setConfirmNewPassword('');
                            }}
                            className="p-2 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Trocar Senha de Acesso"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Mudar Senha</span>
                          </button>

                          {/* Botão de Editar Dados */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditUser(u)}
                            className="p-2 text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Editar Informações"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Editar</span>
                          </button>

                          {/* Botão de Excluir */}
                          <button
                            type="button"
                            disabled={isCurrentUser || (u.role === 'admin' && adminCount <= 1)}
                            onClick={() => {
                              if (confirm(`Tem certeza que deseja excluir permanentemente o acesso do usuário "${u.name}"?`)) {
                                const res = deleteUser(u.id);
                                if (!res.success) {
                                  showError(res.message || 'Erro ao excluir.');
                                } else {
                                  showToast('Usuário removido com sucesso!');
                                }
                              }
                            }}
                            className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isCurrentUser ? 'Não é possível excluir a si mesmo' : 'Excluir Usuário'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
              showToast('Todas as configurações visuais foram restauradas aos padrões de fábrica!');
            }}
            className="text-xs text-rose-700 hover:text-rose-900 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrões Visuais</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            Concluir e Fechar
          </button>
        </div>
      </div>

      {/* ================= MODAL SECUNDÁRIO: CADASTRAR OU EDITAR USUÁRIO ================= */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-600 rounded-lg text-white">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold">
                  {editingUserId ? 'Editar Cadastro de Usuário' : 'Novo Usuário do SISCOP'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs text-slate-800">
              {/* Nome Completo */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nome Completo: *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Ex: João da Silva Santos"
                />
              </div>

              {/* Nome de Usuário (Login) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nome de Usuário (Login de Acesso): *
                </label>
                <input
                  type="text"
                  required
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Ex: joao.silva"
                />
                <span className="text-[10.5px] text-slate-500 mt-0.5 block">
                  Livre para escolha. Este será o nome de usuário que você colocará no campo de Login na tela de login da plataforma.
                </span>
              </div>

              {/* Matrícula / CPF & Órgão / Empresa */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Matrícula / CPF:
                  </label>
                  <input
                    type="text"
                    value={formMatriculaOrCpf}
                    onChange={(e) => setFormMatriculaOrCpf(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Ex: 104829 ou CPF"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Órgão / Empresa:
                  </label>
                  <input
                    type="text"
                    value={formOrgaoOrEmpresa}
                    onChange={(e) => setFormOrgaoOrEmpresa(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Ex: Secretaria de Esportes"
                  />
                </div>
              </div>

              {/* Privilégio de Acesso com Limite de 2 Administradores */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Privilégio de Acesso à Plataforma: *
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none bg-white cursor-pointer"
                >
                  <option
                    value="admin"
                    disabled={adminCount >= 2 && (!editingUserId || users.find(u => u.id === editingUserId)?.role !== 'admin')}
                  >
                    Administrador SISCOP {adminCount >= 2 && (!editingUserId || users.find(u => u.id === editingUserId)?.role !== 'admin') ? '(Limite de 2 Atingido)' : ''}
                  </option>
                  <option value="operador">Operador</option>
                </select>
                <span className="text-[10.5px] text-slate-500 mt-0.5 block">
                  Regra do SISCOP: Permite que no máximo 2 cadastros tenham o privilégio de Administrador SISCOP.
                </span>
              </div>

              {/* Se for Modo Criação: Cadastro de Senha com Checklist */}
              {!editingUserId && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <label className="block font-bold text-slate-800 mb-1">
                      Cadastro de Senha de Acesso: *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="Digite uma senha forte"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    <label className="block font-bold text-slate-800 mt-2 mb-1">
                      Confirmação de Senha: *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formConfirmPassword}
                        onChange={(e) => setFormConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="Confirme a senha digitada"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* CHECKLIST INTERATIVO DE CRITÉRIOS DE SENHA */}
                    <div className="mt-3 p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-700 mb-1">
                        Checklist Obrigatório de Formação de Senha:
                      </div>

                      <div className="flex items-center gap-2">
                        {passwordRules.hasMinLength ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                        <span className={passwordRules.hasMinLength ? 'text-emerald-700 font-bold' : 'text-rose-600'}>
                          Mínimo de 8 caracteres / dígitos
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {passwordRules.hasUpperCase ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                        <span className={passwordRules.hasUpperCase ? 'text-emerald-700 font-bold' : 'text-rose-600'}>
                          Pelo menos uma letra MAIÚSCULA (A-Z)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {passwordRules.hasLowerCase ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                        <span className={passwordRules.hasLowerCase ? 'text-emerald-700 font-bold' : 'text-rose-600'}>
                          Pelo menos uma letra minúscula (a-z)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {passwordRules.hasNumber ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                        <span className={passwordRules.hasNumber ? 'text-emerald-700 font-bold' : 'text-rose-600'}>
                          Pelo menos um número (0-9)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {passwordRules.hasSpecialChar ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                        <span className={passwordRules.hasSpecialChar ? 'text-emerald-700 font-bold' : 'text-rose-600'}>
                          Pelo menos um caractere especial (!@#$%&*...)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                        {passwordsMatch ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                        )}
                        <span className={passwordsMatch ? 'text-emerald-700 font-bold' : 'text-rose-600'}>
                          Confirmação de senha confere exatamente
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões do Formulário */}
              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!editingUserId && (!passwordRules.isValid || !passwordsMatch)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  {editingUserId ? 'Salvar Alterações' : 'Concluir Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL SECUNDÁRIO: TROCAR SENHA ================= */}
      {passwordChangeUserId && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold">
                  Troca de Senha de Acesso
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPasswordChangeUserId(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePasswordChange} className="p-5 space-y-4 text-xs text-slate-800">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Usuário Selecionado:</span>
                <strong className="text-slate-900 font-bold">
                  {users.find((u) => u.id === passwordChangeUserId)?.name} (@
                  {users.find((u) => u.id === passwordChangeUserId)?.username})
                </strong>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Nova Senha de Acesso: *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Digite a nova senha forte"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Confirmação da Nova Senha: *
                </label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Repita a nova senha digitada"
                />
              </div>

              {/* CHECKLIST INTERATIVO DA NOVA SENHA */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="text-[11px] font-bold text-slate-700 mb-1">
                  Checklist de Requisitos Obrigatórios:
                </div>

                <div className="flex items-center gap-2">
                  {newPasswordRules.hasMinLength ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span className={newPasswordRules.hasMinLength ? 'text-emerald-700 font-bold' : 'text-rose-600'}>
                    Mínimo de 8 caracteres / dígitos
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {newPasswordRules.hasUpperCase ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span className={newPasswordRules.hasUpperCase ? 'text-emerald-700 font-bold' : 'text-rose-600'}>
                    Pelo menos uma letra MAIÚSCULA (A-Z)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {newPasswordRules.hasLowerCase ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span className={newPasswordRules.hasLowerCase ? 'text-emerald-700 font-bold' : 'text-rose-600'}>
                    Pelo menos uma letra minúscula (a-z)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {newPasswordRules.hasNumber ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span className={newPasswordRules.hasNumber ? 'text-emerald-700 font-bold' : 'text-rose-600'}>
                    Pelo menos um número (0-9)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {newPasswordRules.hasSpecialChar ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span className={newPasswordRules.hasSpecialChar ? 'text-emerald-700 font-bold' : 'text-rose-600'}>
                    Pelo menos um caractere especial (!@#$%&*...)
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                  {newPasswordsMatch ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span className={newPasswordsMatch ? 'text-emerald-700 font-bold' : 'text-rose-600'}>
                    Confirmação de senha confere exatamente
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordChangeUserId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newPasswordRules.isValid || !newPasswordsMatch}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Salvar Nova Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL SECUNDÁRIO: DESTRAVAR USUÁRIO (EXIGE SENHA DO ADMINISTRADOR) ================= */}
      {unlockTargetUserId && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-rose-300 overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="bg-rose-950 text-white px-5 py-3.5 flex items-center justify-between border-b border-rose-900">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-rose-600 rounded-lg text-white">
                  <Unlock className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-rose-200">
                  Destravar Conta de Usuário
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setUnlockTargetUserId(null)}
                className="text-rose-300 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteUnlock} className="p-5 space-y-4 text-xs text-slate-800">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-rose-950">Acesso Travado por Segurança</h4>
                    <p className="text-rose-800 mt-1 leading-relaxed">
                      O usuário <strong>{users.find((u) => u.id === unlockTargetUserId)?.name}</strong> foi travado por 3 tentativas consecutivas de senha incorreta.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Senha do Administrador do SISCOP para Autorizar: *
                </label>
                <input
                  type="password"
                  required
                  value={adminUnlockPassword}
                  onChange={(e) => setAdminUnlockPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-slate-900 focus:ring-2 focus:ring-rose-500 outline-none"
                  placeholder="Digite a senha do Administrador"
                  autoFocus
                />
                <span className="text-[10.5px] text-slate-500 mt-0.5 block">
                  Somente um Administrador do SISCOP tem autorização para destravar este usuário.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUnlockTargetUserId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Autorizar e Destravar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
