import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BrasaoPousoAlegre } from '../common/BrasaoPousoAlegre';
import { GlobalSearchModal } from './GlobalSearchModal';
import { AcertoCalculatorModal } from '../calculator/AcertoCalculatorModal';
import {
  Home,
  CreditCard,
  Layers,
  FileText,
  ChevronDown,
  BookOpen,
  Database,
  Settings,
  SlidersHorizontal,
  RotateCw,
  LogOut,
  Info,
  Search,
  Calculator,
} from 'lucide-react';

interface NavbarProps {
  onOpenLogs: () => void;
  onOpenLogin: () => void;
  onOpenBackup: () => void;
  onOpenSetup: () => void;
  onOpenAbout: () => void;
}

const MONTH_ABBR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const WEEK_DAYS_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export const Navbar: React.FC<NavbarProps> = ({
  onOpenLogs,
  onOpenLogin,
  onOpenBackup,
  onOpenSetup,
  onOpenAbout,
}) => {
  const {
    currentUser,
    users,
    switchUser,
    logout,
    resetAllToFactoryDefaults,
    currentView,
    setCurrentView,
    platformSettings,
  } = useApp();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sistemaMenuOpen, setSistemaMenuOpen] = useState(false);
  const [modulosMenuOpen, setModulosMenuOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  // Real-time clock update every second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K for Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const monthAbbr = MONTH_ABBR[now.getMonth()];
  const year = now.getFullYear();
  const weekDay = WEEK_DAYS_NAMES[now.getDay()];

  return (
    <header className="sticky top-0 z-50 bg-slate-900 text-white min-h-[78px] py-2 px-4 sm:px-6 flex items-center justify-between border-b border-slate-800 shrink-0 shadow-lg relative">
      {/* ================= LADO ESQUERDO: BRASÃO + DIVISÓRIA + BOTÕES MÓDULOS E SISTEMA ================= */}
      <div className="flex items-center gap-3">
        {/* Identificação Institucional / Marca */}
        <button
          onClick={() => setCurrentView('DASHBOARD')}
          className="flex items-center gap-3 text-left group focus:outline-none shrink-0"
        >
          {platformSettings.navbarLogoUrl ? (
            <img
              src={platformSettings.navbarLogoUrl}
              alt="Brasão Pouso Alegre"
              className="w-12 h-12 object-contain rounded-xs drop-shadow-md group-hover:scale-105 transition-transform"
            />
          ) : (
            <BrasaoPousoAlegre size={46} className="group-hover:scale-105 transition-transform" />
          )}
          <div className="leading-none">
            <span className="text-[10.5px] text-blue-300 font-extrabold uppercase tracking-wider block">
              SISCOP • Prefeitura de Pouso Alegre
            </span>
            <span className="text-sm sm:text-base font-black text-white tracking-tight group-hover:text-blue-300 transition-colors mt-0.5 block">
              Praça de Esportes • Alvarim Vieira Rios
            </span>
          </div>
        </button>

        {/* Linha vertical divisória separando o nome dos botões da barra fixa */}
        <div className="h-10 w-px bg-slate-700/80 mx-1.5 hidden sm:block shrink-0" />

        {/* Botões Módulos e Sistema posicionados ao lado da linha divisória à esquerda do relógio */}
        <div className="hidden md:flex items-center gap-2.5 shrink-0">
          {/* ================= BOTÃO MÓDULOS COM DROPDOWN (Início, GDA, GID e POP) ================= */}
          <div className="relative">
            <button
              onClick={() => {
                setModulosMenuOpen(!modulosMenuOpen);
                setSistemaMenuOpen(false);
              }}
              className={`w-[180px] min-w-[180px] max-w-[180px] h-[46px] min-h-[46px] max-h-[46px] box-border shrink-0 flex items-center justify-between gap-2 px-3.5 rounded-xl text-xs font-bold transition-all border shadow-xs select-none ${
                modulosMenuOpen
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400/40'
                  : 'bg-slate-800 text-slate-100 hover:text-white hover:bg-slate-700/90 border-slate-700'
              }`}
              title="Acessar Módulos da Plataforma (Início, GDA, GID, POP)"
            >
              <div className="flex items-center gap-2 shrink-0">
                <Layers className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs font-bold tracking-tight">Módulos</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono leading-none h-[22px] px-2 flex items-center justify-center rounded bg-slate-900/80 text-blue-300 font-semibold border border-slate-700/60">
                  {currentView === 'DASHBOARD' && 'Início'}
                  {currentView === 'GDA' && 'GDA'}
                  {currentView === 'GID' && 'GID'}
                  {currentView === 'POP' && 'POP'}
                  {currentView !== 'DASHBOARD' && currentView !== 'GDA' && currentView !== 'GID' && currentView !== 'POP' && 'Menu'}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    modulosMenuOpen ? 'rotate-180 text-white' : ''
                  }`}
                />
              </div>
            </button>

            {modulosMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setModulosMenuOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-xs text-slate-200 divide-y divide-slate-800 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Módulos Centrais SISCOP</span>
                    <span className="text-[9px] text-blue-400 font-mono">Navegação Rápida</span>
                  </div>

                  <div className="py-1.5 space-y-1">
                    {/* Opção 1: Início */}
                    <button
                      onClick={() => {
                        setModulosMenuOpen(false);
                        setCurrentView('DASHBOARD');
                      }}
                      className={`w-full px-3 py-2 text-left rounded-xl flex items-center gap-3 transition-all ${
                        currentView === 'DASHBOARD'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'hover:bg-slate-800/90 text-slate-200 hover:text-white'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold shrink-0 border border-blue-400/30">
                        <Home className="w-4 h-4 text-blue-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">Início</span>
                          {currentView === 'DASHBOARD' && (
                            <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded font-mono font-bold">Ativo</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">
                          Painel Geral e Visão Consolidada
                        </span>
                      </div>
                    </button>

                    {/* Opção 2: GDA (Carteirinhas) */}
                    <button
                      onClick={() => {
                        setModulosMenuOpen(false);
                        setCurrentView('GDA');
                      }}
                      className={`w-full px-3 py-2 text-left rounded-xl flex items-center gap-3 transition-all ${
                        currentView === 'GDA'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'hover:bg-slate-800/90 text-slate-200 hover:text-white'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                        GDA
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">GDA (Carteirinhas)</span>
                          {currentView === 'GDA' && (
                            <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded font-mono font-bold">Ativo</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">
                          Emissão, Foto 3x4 e Impressão A4 Paisagem
                        </span>
                      </div>
                    </button>

                    {/* Opção 3: GID (Informações) */}
                    <button
                      onClick={() => {
                        setModulosMenuOpen(false);
                        setCurrentView('GID');
                      }}
                      className={`w-full px-3 py-2 text-left rounded-xl flex items-center gap-3 transition-all ${
                        currentView === 'GID'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'hover:bg-slate-800/90 text-slate-200 hover:text-white'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                        GID
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">GID (Informações)</span>
                          {currentView === 'GID' && (
                            <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded font-mono font-bold">Ativo</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">
                          Cadastro de Usuários e Reservas Quiosques
                        </span>
                      </div>
                    </button>

                    {/* Opção 4: POP (Procedimentos) */}
                    <button
                      onClick={() => {
                        setModulosMenuOpen(false);
                        setCurrentView('POP');
                      }}
                      className={`w-full px-3 py-2 text-left rounded-xl flex items-center gap-3 transition-all ${
                        currentView === 'POP'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'hover:bg-slate-800/90 text-slate-200 hover:text-white'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                        POP
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">POP (Procedimentos)</span>
                          {currentView === 'POP' && (
                            <span className="text-[9px] bg-white/20 px-1.5 py-0.2 rounded font-mono font-bold">Ativo</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">
                          Normas, Taxas Oficiais e Instruções
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ================= BOTÃO SISTEMA COM DROPDOWN (Setup, Backup, Relatório de Logs e Sobre) ================= */}
          <div className="relative">
            <button
              onClick={() => {
                setSistemaMenuOpen(!sistemaMenuOpen);
                setModulosMenuOpen(false);
              }}
              className={`w-[180px] min-w-[180px] max-w-[180px] h-[46px] min-h-[46px] max-h-[46px] box-border shrink-0 flex items-center justify-between gap-2 px-3.5 rounded-xl text-xs font-bold transition-all border shadow-xs select-none ${
                sistemaMenuOpen
                  ? 'bg-slate-700 text-white border-slate-600 shadow-md ring-2 ring-indigo-400/40'
                  : 'text-slate-100 hover:text-white hover:bg-slate-700/90 border-slate-700 bg-slate-800'
              }`}
              title="Menu Sistema (Setup, Backup, Relatório de Logs e Sobre)"
            >
              <div className="flex items-center gap-2 shrink-0">
                <Settings className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-xs font-bold tracking-tight">Sistema</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono leading-none h-[22px] px-2 flex items-center justify-center rounded bg-slate-900/80 text-indigo-300 font-semibold border border-slate-700/60">
                  Menu
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    sistemaMenuOpen ? 'rotate-180 text-white' : ''
                  }`}
                />
              </div>
            </button>

            {sistemaMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setSistemaMenuOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-xs text-slate-200 divide-y divide-slate-800 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between">
                    <span>Operações do Sistema</span>
                    <span className="text-[9px] text-indigo-400 font-mono">SISCOP</span>
                  </div>
                  <div className="py-1 space-y-1">
                    {/* Setup da Plataforma */}
                    <button
                      onClick={() => {
                        setSistemaMenuOpen(false);
                        onOpenSetup();
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-slate-800 text-blue-300 hover:text-white transition-colors rounded-xl"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-400/30">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold block text-slate-100">Setup da Plataforma</span>
                        <span className="text-[10px] text-slate-400 block">
                          Brasão da Barra e Imagem do Dashboard
                        </span>
                      </div>
                    </button>

                    {/* Backup */}
                    <button
                      onClick={() => {
                        setSistemaMenuOpen(false);
                        onOpenBackup();
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-slate-800 text-indigo-300 hover:text-white transition-colors rounded-xl"
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-400/30">
                        <Database className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold block text-slate-100">Backup</span>
                        <span className="text-[10px] text-slate-400 block">
                          Dados Gerais e Arquitetura Completa
                        </span>
                      </div>
                    </button>

                    {/* Relatório de Logs */}
                    <button
                      onClick={() => {
                        setSistemaMenuOpen(false);
                        onOpenLogs();
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors rounded-xl"
                    >
                      <div className="w-7 h-7 rounded-lg bg-slate-700/40 text-slate-300 flex items-center justify-center shrink-0 border border-slate-600/30">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold block text-slate-100">Relatório de Logs</span>
                        <span className="text-[10px] text-slate-400 block">
                          Histórico e Auditoria de Acessos
                        </span>
                      </div>
                    </button>

                    {/* Sobre a Plataforma */}
                    <button
                      onClick={() => {
                        setSistemaMenuOpen(false);
                        onOpenAbout();
                      }}
                      className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-slate-800 text-emerald-300 hover:text-white transition-colors rounded-xl"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-400/30">
                        <Info className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold block text-slate-100">Sobre</span>
                        <span className="text-[10px] text-slate-400 block">
                          SISCOP v.1.0 • Dados da Plataforma
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ================= RELÓGIO DIGITAL, DATA E DIA DA SEMANA CENTRALIZADOS ENTRE O BOTÃO SISTEMA E O BOTÃO OPERADOR CONECTADO ================= */}
      <div className="flex-1 hidden md:flex items-center justify-center px-4">
        <div className="flex flex-col items-center justify-center text-center px-5 py-1.5 bg-slate-800/95 rounded-2xl border border-slate-700 shadow-md min-w-[160px] pointer-events-none select-none">
          {/* Relógio: horas e minutos normais, segundos destacados */}
          <div className="font-mono font-black leading-none flex items-baseline justify-center text-white">
            <span className="text-base tracking-wider">{hours}:{minutes}</span>
            <span className="text-xs text-blue-300 font-bold ml-1">:{seconds}</span>
          </div>
          {/* Data: 24 • Set • 2026 */}
          <div className="text-xs font-bold text-slate-100 leading-tight mt-0.5 tracking-tight">
            {day} • {monthAbbr} • {year}
          </div>
          {/* Dia da semana: Quarta-feira */}
          <div className="text-[10px] font-bold text-blue-300 leading-tight mt-0.5 uppercase tracking-wide">
            {weekDay}
          </div>
        </div>
      </div>

      {/* ================= BOTÃO DE BUSCA E BOTÃO CALCULADORA (CALC) ================= */}
      <div className="flex items-center shrink-0 gap-2 mx-2">
        <button
          onClick={() => setIsGlobalSearchOpen(true)}
          className="h-[46px] min-h-[46px] max-h-[46px] box-border px-3.5 py-1 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700/90 text-slate-100 hover:text-white transition-all shadow-xs cursor-pointer flex flex-col items-center justify-center gap-0.5 select-none"
          title="Busca com Indexação em Tempo Real - Ctrl+K"
        >
          <Search className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="text-[10px] font-bold leading-none tracking-tight">Busca</span>
        </button>

        <button
          onClick={() => setIsCalculatorOpen(true)}
          className="h-[46px] min-h-[46px] max-h-[46px] box-border px-3.5 py-1 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700/90 text-slate-100 hover:text-white transition-all shadow-xs cursor-pointer flex flex-col items-center justify-center gap-0.5 select-none"
          title="Cálculos de Pagamento de Acerto do Associado"
        >
          <Calculator className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-[10px] font-bold leading-none tracking-tight">Calc</span>
        </button>
      </div>

      {/* ================= LADO DIREITO: OPERADOR / LOGIN ================= */}
      <div className="flex items-center gap-3">
        {currentUser ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="h-[46px] min-h-[46px] max-h-[46px] box-border flex items-center gap-2.5 bg-slate-800 hover:bg-slate-700/80 px-3.5 rounded-xl border border-slate-700 transition-all text-xs"
              title="Operador Conectado"
            >
              <div
                className={`w-7 h-7 rounded-lg ${currentUser.avatarColor} flex items-center justify-center font-bold text-white text-xs shadow-2xs shrink-0`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <span className="font-bold text-white block text-xs leading-tight">
                  {currentUser.name.split(' ')[0]}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLogin}
            className="h-[46px] min-h-[46px] max-h-[46px] box-border px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center"
          >
            Entrar
          </button>
        )}

        {/* User Dropdown Menu */}
        {userMenuOpen && currentUser && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setUserMenuOpen(false)}
            />
            <div className="absolute right-4 top-16 w-60 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-xs text-slate-200 divide-y divide-slate-800 animate-in fade-in">
              <div className="px-3 py-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Operador Conectado
                </span>
                <span className="font-bold text-white text-sm block mt-0.5">
                  {currentUser.name}
                </span>
                <span className="text-[11px] text-blue-400 block">
                  {currentUser.cargo} ({currentUser.role})
                </span>
              </div>

              {/* Multi-user Switcher list */}
              <div className="py-1">
                <span className="px-3 py-1 text-[10px] uppercase font-bold text-slate-500 block">
                  Alternar Operador Rápido
                </span>
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id);
                      setUserMenuOpen(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-800 transition-colors ${
                      u.id === currentUser.id ? 'bg-slate-800/80 font-bold text-blue-300' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-md ${u.avatarColor} text-white text-[10px] font-bold flex items-center justify-center`}
                      >
                        {u.name.charAt(0)}
                      </div>
                      <span>{u.name.split(' ')[0]}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono capitalize">
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>

              {/* Database Factory Reset */}
              <div className="py-1">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    resetAllToFactoryDefaults();
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Restaurar Banco de Dados Padrão</span>
                </button>
              </div>

              {/* Logout button */}
              <div className="pt-1">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full px-3 py-1.5 text-left flex items-center gap-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sair do SISCOP</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal de Busca Global com Indexação em Tempo Real */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
      />

      {/* Modal de Cálculos de Pagamento de Acerto do Associado (Botão Calc da Barra Fixa Superior - Sem Aba de Histórico) */}
      <AcertoCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        showHistoryTab={false}
      />
    </header>
  );
};

