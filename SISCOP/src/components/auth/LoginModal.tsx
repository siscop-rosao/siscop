import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BrasaoPousoAlegre } from '../common/BrasaoPousoAlegre';
import {
  Lock,
  User as UserIcon,
  LogIn,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  Radio,
  Cpu,
  Activity,
  Terminal,
  AlertTriangle,
  ShieldAlert,
  LockKeyhole,
} from 'lucide-react';

interface LoginModalProps {
  onClose?: () => void;
  isMandatory?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, isMandatory = false }) => {
  const { users, loginWithAttempts, currentUser, platformSettings } = useApp();
  const [username, setUsername] = useState(currentUser?.username || 'admin');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attemptAlert, setAttemptAlert] = useState<{
    isLocked: boolean;
    remainingAttempts?: number;
    message: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    setTimeout(() => {
      const result = loginWithAttempts(username, password);
      if (result.success) {
        setErrorMsg('');
        setAttemptAlert(null);
        if (onClose) onClose();
      } else {
        setErrorMsg(result.message || 'Credenciais inválidas.');
        setAttemptAlert({
          isLocked: !!result.isLocked,
          remainingAttempts: result.remainingAttempts,
          message: result.message || 'Credenciais inválidas. Verifique o usuário e a senha digitados.',
        });
      }
      setIsLoading(false);
    }, 350);
  };

  const selectedUserObj = users.find((u) => u.username === username);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-950 text-slate-100 overflow-x-hidden overflow-y-auto selection:bg-cyan-500 selection:text-black">
      {/* ================= FUNDO COMPUTACIONAL FUTURÍSTICO COM RADARES E LINHAS DE TELEMETRIA ================= */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Malha de Grid Cibernético */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #00f0ff 1px, transparent 1px),
              linear-gradient(to bottom, #00f0ff 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Gradientes Radiais de Iluminação Holográfica */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-10 right-10 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[130px]" />

        {/* ================= RADAR 1 (SUPERIOR ESQUERDO) COM LINHAS E TELEMETRIA ALEATÓRIA ================= */}
        <div className="absolute -top-16 -left-16 w-80 h-80 sm:w-96 sm:h-96 opacity-40">
          <svg className="w-full h-full text-cyan-400" viewBox="0 0 400 400" fill="none">
            {/* Círculos Concêntricos de Sonar */}
            <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
            <circle cx="200" cy="200" r="130" stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" />
            <circle cx="200" cy="200" r="80" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.8" />
            <circle cx="200" cy="200" r="30" stroke="currentColor" strokeWidth="1" />
            {/* Eixos do Radar */}
            <line x1="20" y1="200" x2="380" y2="200" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
            <line x1="200" y1="20" x2="200" y2="380" stroke="currentColor" strokeWidth="1" strokeOpacity="0.5" />
            {/* Feixe Rotativo do Radar */}
            <g className="animate-spin origin-center" style={{ animationDuration: '9s' }}>
              <line x1="200" y1="200" x2="370" y2="250" stroke="url(#radarGradient)" strokeWidth="2.5" />
            </g>
            <defs>
              <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0" />
                <stop offset="100%" stopColor="#00f0ff" stopOpacity="1" />
              </linearGradient>
            </defs>
          </svg>
          {/* Linhas de Dados Saindo do Radar */}
          <div className="hidden lg:block absolute top-48 left-64 w-60 border-t border-cyan-400/50">
            <div className="relative">
              <span className="absolute -top-2 left-0 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
              <div className="pl-4 pt-1 text-[9px] font-mono text-cyan-300 leading-tight">
                <div>SYS_ENCRYPT // AES-256 [GCM]</div>
                <div className="text-slate-400">INTEGRITY_CHECK // OK</div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RADAR 2 (INFERIOR DIREITO) COM LINHAS E TELEMETRIA LGPD ================= */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 sm:w-[420px] sm:h-[420px] opacity-35">
          <svg className="w-full h-full text-blue-400" viewBox="0 0 400 400" fill="none">
            <circle cx="200" cy="200" r="170" stroke="currentColor" strokeWidth="1" strokeDasharray="3 8" />
            <circle cx="200" cy="200" r="120" stroke="currentColor" strokeWidth="1" strokeOpacity="0.6" />
            <circle cx="200" cy="200" r="70" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.8" />
            <line x1="30" y1="200" x2="370" y2="200" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="200" y1="30" x2="200" y2="370" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
            <g className="animate-spin origin-center" style={{ animationDuration: '12s', animationDirection: 'reverse' }}>
              <line x1="200" y1="200" x2="270" y2="50" stroke="#60a5fa" strokeWidth="2" />
            </g>
          </svg>
          {/* Linhas de Dados Saindo do Radar Inferior */}
          <div className="hidden lg:block absolute bottom-44 right-64 w-64 border-t border-blue-400/50">
            <div className="relative">
              <span className="absolute -top-2 right-0 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />
              <div className="pr-4 pt-1 text-[9px] font-mono text-blue-300 text-right leading-tight">
                <div>LGPD_PROTOCOL // LEI 13.709/18</div>
                <div className="text-slate-400">DATA_MASKING // ACTIVE</div>
              </div>
            </div>
          </div>
        </div>

        {/* Telemetria Flutuante Superior Direita */}
        <div className="hidden md:flex flex-col gap-1 absolute top-8 right-8 font-mono text-[9px] text-slate-400 text-right opacity-70">
          <div className="text-cyan-400 font-bold flex items-center justify-end gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            FIREBASE_FIRESTORE // CLOUD SYNC ACTIVE
          </div>
          <div>SERVER_NODE: SA-EAST-1 (SÃO PAULO)</div>
          <div>AUTH_GATEWAY: GOV_RESTRICTED // PORT 443</div>
        </div>

        {/* Telemetria Flutuante Inferior Esquerda */}
        <div className="hidden md:flex flex-col gap-1 absolute bottom-8 left-8 font-mono text-[9px] text-slate-400 opacity-70">
          <div className="text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            PMPA_SECURITY_GATE // OPERATIONAL
          </div>
          <div>LOCAL: PRAÇA DE ESPORTES ALVARIM VIEIRA RIOS</div>
          <div>SESSION: AUDITED_IMMUTABLE_LOGS</div>
        </div>
      </div>

      {/* ================= BOTÃO FECHAR CASO SEJA MODAL OPCIONAL (TROCA DE OPERADOR) ================= */}
      {!isMandatory && onClose && (
        <div className="relative z-20 flex justify-end p-4">
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-all cursor-pointer"
            title="Fechar e retornar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ================= CORPO PRINCIPAL CENTRALIZADO ================= */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-xl mx-auto w-full">
        {/* ================= TOPO: LOGO DA PREFEITURA DE POUSO ALEGRE ================= */}
        <div className="flex flex-col items-center justify-center mb-5 group">
          <div className="relative p-2 rounded-2xl bg-slate-900/60 border border-cyan-500/30 backdrop-blur-md shadow-[0_0_35px_rgba(0,240,255,0.15)] group-hover:border-cyan-400/60 transition-all">
            {platformSettings?.navbarLogoUrl ? (
              <img
                src={platformSettings.navbarLogoUrl}
                alt="Prefeitura de Pouso Alegre"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
              />
            ) : (
              <BrasaoPousoAlegre size={76} className="drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]" />
            )}
          </div>
        </div>

        {/* ================= ESCRITO LOGO ABAIXO DO LOGO: SISCOP ================= */}
        <div className="text-center mb-6 space-y-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span className="text-cyan-400 font-mono tracking-wider">SISCOP</span>
            <span className="text-slate-500 font-light">—</span>
            <span className="bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
              Sistema de Controle Operacional
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-cyan-300/80 font-medium tracking-wide">
            Praça de Esportes Pref. Alvarim Vieira Rios • Pouso Alegre/MG
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-500/40 text-[10px] font-mono text-blue-200 mt-1 shadow-inner">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>ACESSO RESTRITO • CONFORMIDADE LGPD (LEI 13.709/2018)</span>
          </div>
        </div>

        {/* ================= CARD DE AUTENTICAÇÃO HOLOGRÁFICO ================= */}
        <div className="w-full bg-slate-900/85 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_10px_50px_rgba(0,0,0,0.8),0_0_40px_rgba(6,182,212,0.15)] relative overflow-hidden">
          {/* Brilho Superior do Card */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-75" />

          {/* Seletor de Operador (Acesso Rápido Institucional) */}
          <div className="mb-5 space-y-2">
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300/90">
              Operador Autorizado:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {users.map((u) => {
                const isSelected = username === u.username;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setUsername(u.username);
                      setPassword('');
                      setErrorMsg('');
                    }}
                    className={`p-2.5 rounded-xl text-left border transition-all flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.25)] ring-1 ring-cyan-400/50'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${u.avatarColor} shrink-0 ring-1 ring-white/30`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate text-white">
                        {u.name.split(' ')[0]} {u.name.split(' ')[1] || ''}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate font-mono">
                        {u.role === 'admin' ? 'Administrador' : u.role === 'diretor' ? 'Diretor' : 'Operador'}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Formulário de Autenticação */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-950/70 border border-rose-500/60 text-rose-200 text-xs rounded-xl flex items-center gap-2.5 animate-in fade-in zoom-in-95">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Campo Usuário */}
            <div className="space-y-1">
              <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                Usuário / Matrícula:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9.5 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 rounded-xl text-xs font-mono text-white placeholder-slate-500 outline-none transition-all"
                  placeholder="Nome de usuário ou matrícula"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-1">
              <label className="block text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider">
                Senha de Acesso:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9.5 pr-10 py-2.5 bg-slate-950/80 border border-slate-700 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 rounded-xl text-xs font-mono text-white placeholder-slate-500 outline-none transition-all"
                  placeholder="Digite sua senha de segurança"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Botão de Entrar */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Acessar Plataforma SISCOP</span>
                </>
              )}
            </button>
          </form>

          {/* Dica de Demonstração / Credenciais */}
          <div className="mt-4 pt-4 border-t border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 font-mono">
              Operadores Padrão: <strong>admin</strong> (senha: <code>admin</code>) ou <strong>operador1</strong> / <strong>diretor</strong> (senha: <code>123</code>)
            </span>
          </div>
        </div>
      </div>

      {/* ================= MODAL DE ALERTA DE TENTATIVAS INCORRETAS / TRAVAMENTO ================= */}
      {attemptAlert && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className={`max-w-md w-full rounded-2xl p-6 border shadow-2xl relative ${
              attemptAlert.isLocked
                ? 'bg-slate-900 border-rose-500/80 shadow-[0_0_50px_rgba(244,63,94,0.3)]'
                : 'bg-slate-900 border-amber-500/80 shadow-[0_0_50px_rgba(245,158,11,0.25)]'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-2xl shrink-0 ${
                  attemptAlert.isLocked
                    ? 'bg-rose-950/80 border border-rose-500 text-rose-400'
                    : 'bg-amber-950/80 border border-amber-500 text-amber-400'
                }`}
              >
                {attemptAlert.isLocked ? (
                  <LockKeyhole className="w-8 h-8 text-rose-500 animate-pulse" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase mb-1 ${
                    attemptAlert.isLocked
                      ? 'bg-rose-900/60 text-rose-300 border border-rose-700/60'
                      : 'bg-amber-900/60 text-amber-300 border border-amber-700/60'
                  }`}
                >
                  {attemptAlert.isLocked ? 'SEGURANÇA ATIVADA • CONTA BLOQUEADA' : 'AVISO DE AUTENTICAÇÃO'}
                </span>
                <h3
                  className={`text-base font-bold tracking-tight ${
                    attemptAlert.isLocked ? 'text-rose-400' : 'text-amber-300'
                  }`}
                >
                  {attemptAlert.isLocked ? 'ACESSO TRAVADO' : 'Credenciais Incorretas'}
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {attemptAlert.message}
                </p>

                {/* Régua Visual de Tentativas */}
                {!attemptAlert.isLocked && attemptAlert.remainingAttempts !== undefined && (
                  <div className="mt-4 p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 mb-1.5">
                      <span>Tentativas restantes:</span>
                      <strong className="text-amber-400 font-bold">{attemptAlert.remainingAttempts} de 3</strong>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 h-2">
                      <div className={`rounded-full ${attemptAlert.remainingAttempts <= 2 ? 'bg-amber-500' : 'bg-slate-700'}`} />
                      <div className={`rounded-full ${attemptAlert.remainingAttempts <= 1 ? 'bg-amber-500' : 'bg-slate-700'}`} />
                      <div className={`rounded-full ${attemptAlert.remainingAttempts === 0 ? 'bg-rose-500' : 'bg-slate-700'}`} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setAttemptAlert(null)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
                  attemptAlert.isLocked
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/50'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-900/50'
                }`}
              >
                {attemptAlert.isLocked ? 'Entendido (Contatar Administrador)' : 'Tentar Novamente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= RODAPÉ DA PÁGINA (AO CENTRO, TAMANHO 8) ================= */}
      <footer className="relative z-10 w-full py-4 text-center border-t border-slate-900 bg-slate-950/80 shrink-0">
        <p
          className="text-slate-400 font-mono tracking-widest uppercase select-none"
          style={{ fontSize: '8px', lineHeight: '1.2' }}
        >
          © 2026 - Todos os Direitos Reservados
        </p>
      </footer>
    </div>
  );
};
