import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BrasaoPousoAlegre } from '../common/BrasaoPousoAlegre';
import { Lock, User as UserIcon, LogIn, AlertCircle, X } from 'lucide-react';

interface LoginModalProps {
  onClose?: () => void;
  isMandatory?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, isMandatory = false }) => {
  const { users, login, currentUser, platformSettings } = useApp();
  const [username, setUsername] = useState(currentUser?.username || 'admin');
  const [password, setPassword] = useState('admin');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(username, password);
    if (success) {
      setErrorMsg('');
      if (onClose) onClose();
    } else {
      setErrorMsg('Usuário ou senha incorretos. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white text-center relative">
          {!isMandatory && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex justify-center mb-3">
            {platformSettings?.navbarLogoUrl ? (
              <img
                src={platformSettings.navbarLogoUrl}
                alt="Brasão Pouso Alegre"
                className="w-16 h-16 object-contain rounded-xs drop-shadow-md"
              />
            ) : (
              <BrasaoPousoAlegre size={64} />
            )}
          </div>

          <span className="text-[10px] font-mono font-extrabold bg-blue-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-widest inline-block mb-1.5 shadow-2xs">
            SISCOP
          </span>
          <h2 className="text-base font-black tracking-tight">
            Sistema de Controle Operacional
          </h2>
          <p className="text-xs text-blue-200 mt-0.5">
            Praça de Esportes Pref. Alvarim Vieira Rios • Pouso Alegre/MG
          </p>
        </div>

        {/* Quick User Selector (for easy multi-operator switching) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <span className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 text-center">
            Selecione o Operador (Acesso Rápido):
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  setUsername(u.username);
                  setPassword(u.password || '123');
                }}
                className={`p-2 rounded-lg text-left text-xs border transition-all flex items-center gap-2 ${
                  username === u.username
                    ? 'bg-blue-50 border-blue-500 text-blue-900 font-semibold'
                    : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${u.avatarColor} shrink-0`} />
                <div className="truncate">
                  <div className="truncate font-semibold">{u.name.split(' ')[0]}</div>
                  <div className="text-[10px] text-slate-500 truncate">{u.cargo}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Usuário / Login:
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nome de usuário"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Senha de Acesso:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Entrar na Plataforma</span>
          </button>
        </form>
      </div>
    </div>
  );
};
