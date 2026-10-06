import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BrasaoPousoAlegre } from '../common/BrasaoPousoAlegre';
import {
  FileBadge,
  Layers,
  Printer,
  Users,
  Flame,
  ShieldCheck,
  Clock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  BookOpen,
  HeartHandshake,
  Database,
  FileText,
} from 'lucide-react';

interface DashboardProps {
  onOpenLogs?: () => void;
  onOpenBackup?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenLogs }) => {
  const {
    cards,
    reservations,
    popProcedures,
    logs,
    setCurrentView,
    openCardInGda,
    platformSettings,
  } = useApp();

  const [planTab, setPlanTab] = useState<'TODOS' | 'FAMILIAR' | 'INDIVIDUAL' | 'ESPECIAL'>('TODOS');

  // Stats calculation
  const totalCards = cards.length;
  const individualCards = cards.filter((c) => c.category === 'PLANO_INDIVIDUAL').length;
  const familyCards = cards.filter((c) => c.category === 'PLANO_FAMILIAR').length;
  const specialCards = cards.filter((c) => c.category === 'PLANO_ESPECIAL').length;
  const activeReservations = reservations.filter((r) => r.status === 'CONFIRMADA').length;

  // Filtragem de apenas TITULARES para o quadro de Últimas Carteirinhas (dependentes NÃO são exibidos na lista, apenas o titular)
  const titularCards = cards.filter(
    (c) => c.isTitular === true || (!c.familyHeadId && c.isTitular !== false)
  );
  const titularFamilyCards = titularCards.filter(
    (c) => c.category === 'PLANO_FAMILIAR' || c.planType === 'FAMILIAR'
  );
  const titularIndividualCards = titularCards.filter(
    (c) => c.category === 'PLANO_INDIVIDUAL' || c.planType === 'INDIVIDUAL'
  );
  const titularSpecialCards = titularCards.filter(
    (c) => c.category === 'PLANO_ESPECIAL' || c.planType === 'ESPECIAL'
  );

  const filteredTitularCards = titularCards.filter((c) => {
    if (planTab === 'FAMILIAR') return c.category === 'PLANO_FAMILIAR' || c.planType === 'FAMILIAR';
    if (planTab === 'INDIVIDUAL') return c.category === 'PLANO_INDIVIDUAL' || c.planType === 'INDIVIDUAL';
    if (planTab === 'ESPECIAL') return c.category === 'PLANO_ESPECIAL' || c.planType === 'ESPECIAL';
    return true;
  });

  const sortedTitularCards = [...filteredTitularCards].sort((a, b) => {
    const timeA = new Date(a.createdAt || a.emissionDate || 0).getTime();
    const timeB = new Date(b.createdAt || b.emissionDate || 0).getTime();
    return timeB - timeA;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-7">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ================= PAINEL CENTRAL SUPERIOR DO DASHBOARD (IMAGEM GRANDE RESOLUÇÃO E TEXTOS OFICIAIS - SEM LINHA DE CONTORNO) ================= */}
        <div className="flex flex-col items-center justify-center text-center py-2 sm:py-4 border-0 outline-none shadow-none">
          {/* Imagem Centralizada de Grande Resolução (sem linha de contorno) */}
          <div className="flex items-center justify-center mb-3 max-w-3xl w-full border-0 outline-none">
            {platformSettings.dashboardBannerUrl ? (
              <img
                src={platformSettings.dashboardBannerUrl}
                alt="SISCOP - Painel Central da Praça de Esportes"
                className="max-h-64 sm:max-h-72 w-auto object-contain border-0 outline-none shadow-none"
              />
            ) : (
              <div className="py-2 px-8 flex flex-col items-center justify-center border-0 outline-none">
                <BrasaoPousoAlegre size={130} />
              </div>
            )}
          </div>

          {/* Dizeres Oficiais Exatamente Conforme Solicitado */}
          <div className="space-y-1 text-center max-w-3xl">
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

        {/* ================= THE THREE MAIN MODULE CARDS: GDA, GID & POP ================= */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Módulos Centrais da Plataforma</span>
            </h2>
          </div>

          {/* 3 QUADROS JUNTOS, UM DO LADO DO OUTRO: GDA, GID e POP */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* ============ QUADRO 1: GDA ============ */}
            <button
              onClick={() => setCurrentView('GDA')}
              className="group text-left bg-white hover:bg-blue-50/40 rounded-2xl p-5 border-2 border-slate-200 hover:border-blue-500 shadow-sm hover:shadow-lg transition-all duration-200 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/10 rounded-full blur-xl -mr-8 -mt-8 group-hover:bg-blue-500/20 transition-all" />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
                    GDA
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Carteirinhas
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight group-hover:text-blue-700 transition-colors">
                  Gerenciamento de Documentos de Acesso
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Montagem de layout, colagem de foto física 3x4, carregamento do Brasão de Pouso Alegre, verso em branco para anotação e visualização de 4 carteirinhas por folha A4 Paisagem.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">
                  {totalCards} carteirinhas
                </span>
                <div className="flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                  <span>Acessar GDA</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </button>

            {/* ============ QUADRO 2: GID ============ */}
            <button
              onClick={() => setCurrentView('GID')}
              className="group text-left bg-white hover:bg-emerald-50/40 rounded-2xl p-5 border-2 border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-lg transition-all duration-200 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-xl -mr-8 -mt-8 group-hover:bg-emerald-500/20 transition-all" />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
                    GID
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Informações
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors">
                  Gerenciamento de Informações Diversas
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Controle por abas: <strong>Usuários</strong> (Plano Familiar, Individual, Prefeitura, Bombeiros e o novo <strong>Plano Especial Isento</strong>) e <strong>Churrasqueira</strong> com Calendário Anual 12 meses.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">
                  {activeReservations} reservas • 5 planos
                </span>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                  <span>Acessar GID</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </button>

            {/* ============ QUADRO 3: POP ============ */}
            <button
              onClick={() => setCurrentView('POP')}
              className="group text-left bg-white hover:bg-amber-50/40 rounded-2xl p-5 border-2 border-slate-200 hover:border-amber-500 shadow-sm hover:shadow-lg transition-all duration-200 relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-xl -mr-8 -mt-8 group-hover:bg-amber-500/20 transition-all" />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
                    POP
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Procedimentos
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight group-hover:text-amber-700 transition-colors">
                  Procedimento Operacional Padrão
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Consulta de rotinas da secretaria: regras de atendimento, emissão e dobra da carteirinha, normas de piscinas, concessão de isenção no Plano Especial e código de conduta.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">
                  {popProcedures.length} procedimentos ativos
                </span>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform">
                  <span>Acessar POP</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* ================= QUICK STATS (5 CATEGORIES) ================= */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold">Plano Especial</span>
              <HeartHandshake className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-emerald-700">{specialCards}</div>
            <span className="text-[10px] text-emerald-600 font-semibold">isento de pagamento</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold">Plano Familiar</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl font-black text-slate-900">{familyCards}</div>
            <span className="text-[10px] text-slate-400">titulares e dependentes</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold">Plano Individual</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-xl font-black text-slate-900">{individualCards}</div>
            <span className="text-[10px] text-slate-400">frequentadores</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold">Churrasqueiras</span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-black text-slate-900">{reservations.length}</div>
            <span className="text-[10px] text-slate-400">reservas agendadas</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold">Manual POP</span>
              <BookOpen className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-black text-slate-900">{popProcedures.length}</div>
            <span className="text-[10px] text-slate-400">regras e diretrizes</span>
          </div>
        </div>

        {/* ================= RECENT CARDS & ACTIVITY ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Recent Cards for Quick Print in GDA */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-blue-600" />
                  Últimas Carteirinhas no Sistema
                </h3>
                <p className="text-xs text-slate-500">
                  Clique para abrir imediatamente o estúdio GDA para conferência e impressão
                </p>
              </div>
              <button
                onClick={() => setCurrentView('GDA')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Abrir GDA →
              </button>
            </div>

            {/* Abas das Modalidades de Planos */}
            <div className="flex items-center gap-1.5 flex-wrap my-3 border-b border-slate-100 pb-2">
              <button
                onClick={() => setPlanTab('TODOS')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  planTab === 'TODOS'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({titularCards.length})
              </button>

              <button
                onClick={() => setPlanTab('FAMILIAR')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  planTab === 'FAMILIAR'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                Plano Familiar ({titularFamilyCards.length})
              </button>

              <button
                onClick={() => setPlanTab('INDIVIDUAL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  planTab === 'INDIVIDUAL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                Plano Individual ({titularIndividualCards.length})
              </button>

              <button
                onClick={() => setPlanTab('ESPECIAL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  planTab === 'ESPECIAL'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Plano Especial ({titularSpecialCards.length})
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {sortedTitularCards.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Nenhuma carteirinha titular cadastrada nesta modalidade.
                </div>
              ) : (
                sortedTitularCards.slice(0, 6).map((c) => {
                  return (
                    <div
                      key={c.id}
                      className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                            c.category === 'PLANO_ESPECIAL'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.planType === 'FAMILIAR'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {c.category === 'PLANO_ESPECIAL' ? 'ESP' : c.planType === 'FAMILIAR' ? 'FAM' : 'IND'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-900">{c.name}</h4>
                            <span className="text-[9.5px] px-1.5 py-0.2 rounded font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              Titular
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-mono text-blue-700 font-semibold">
                              {c.controlNumber}
                            </span>
                            <span>•</span>
                            <span>
                              {c.category === 'PLANO_ESPECIAL'
                                ? 'Plano Especial (Isento)'
                                : c.planType === 'FAMILIAR'
                                ? 'Plano Familiar'
                                : 'Plano Individual'}
                            </span>
                            {c.category === 'PLANO_ESPECIAL' && (
                              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1 rounded">
                                Isento de Pgto
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => openCardInGda(c)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                        title="Abrir no estúdio GDA para conferência de dependentes e impressão"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Ver no GDA</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Logs Summary & Report Button */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-600" />
                  Atividades Recentes & Auditoria
                </h3>
              </div>

              <div className="space-y-2.5">
                {logs.slice(0, 4).map((log) => (
                  <div key={log.id} className="text-xs border-b border-slate-100 pb-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-semibold text-slate-600">{log.userName}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-700 mt-0.5 line-clamp-1">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onOpenLogs}
              className="mt-4 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <FileText className="w-4 h-4" />
              <span>Emitir Relatório de Logs Completo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
