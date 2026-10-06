import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AuditLog, ModuleType, ActionType } from '../../types';
import { BrasaoPousoAlegre } from '../common/BrasaoPousoAlegre';
import { executePrint } from '../../utils/printHelper';
import {
  FileText,
  Printer,
  Download,
  Upload,
  Search,
  Filter,
  User as UserIcon,
  Clock,
  CheckCircle2,
  Trash2,
  X,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface AuditLogModalProps {
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ onClose }) => {
  const {
    logs,
    users,
    currentUser,
    clearLogs,
    exportDatabaseJson,
    importDatabaseJson,
  } = useApp();

  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (selectedUserFilter !== 'ALL' && log.userId !== selectedUserFilter) return false;
    if (selectedModuleFilter !== 'ALL' && log.module !== selectedModuleFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        log.details.toLowerCase().includes(term) ||
        log.userName.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        (log.targetName && log.targetName.toLowerCase().includes(term))
      );
    }
    return true;
  });

  const handlePrintReport = () => {
    executePrint({
      orientation: 'portrait',
      bodyClass: 'printing-audit-logs',
      pageMargin: '8mm',
    });
  };

  const handleDownloadBackup = () => {
    const { filename, json } = exportDatabaseJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const success = importDatabaseJson(text);
        if (success) {
          setImportStatus('Backup restaurado com sucesso!');
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus('Erro ao restaurar arquivo JSON.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="audit-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="audit-modal-container bg-white rounded-2xl shadow-2xl max-w-5xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                Relatório de Logs e Histórico de Atividades
              </h2>
              <p className="text-xs text-slate-300">
                Registro perene e imutável de todas as ações executadas pelos usuários no sistema
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRINTABLE REPORT HEADER (shown only when printing) */}
        <div className="hidden print:block p-6 border-b border-slate-400">
          <div className="flex items-center gap-4">
            <BrasaoPousoAlegre size={64} monochrome={true} />
            <div>
              <h1 className="text-lg font-bold uppercase tracking-tight">
                Prefeitura Municipal de Pouso Alegre - MG
              </h1>
              <h2 className="text-sm font-semibold text-slate-700">
                Praça de Esportes Pref. Alvarim Vieira Rios
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Relatório Oficial de Auditoria e Logs de Usuários • Gerado em{' '}
                {new Date().toLocaleString('pt-BR')} por {currentUser?.name}
              </p>
            </div>
          </div>
        </div>

        {/* FILTER TOOLBAR (hidden on print) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex flex-wrap items-center gap-2">
            {/* User Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-2xs">
              <UserIcon className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-700">Operador:</span>
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none"
              >
                <option value="ALL">Todos os Usuários ({users.length})</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.username})
                  </option>
                ))}
              </select>
            </div>

            {/* Module Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 shadow-2xs">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-700">Módulo:</span>
              <select
                value={selectedModuleFilter}
                onChange={(e) => setSelectedModuleFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none"
              >
                <option value="ALL">Todos os Módulos</option>
                <option value="GDA">GDA (Carteirinhas)</option>
                <option value="GID_USUARIOS">GID (Planos e Cadastros)</option>
                <option value="GID_CHURRASQUEIRA">GID (Churrasqueira)</option>
                <option value="AUTH">Autenticação / Login</option>
                <option value="SISTEMA">Sistema e Backup</option>
              </select>
            </div>

            {/* Search query */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar detalhes do log..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
            </div>
          </div>

          {/* Action buttons: Print & Backup */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Emitir Relatório Impresso</span>
            </button>

            <button
              onClick={handleDownloadBackup}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium shadow-xs transition-colors"
              title="Baixar backup dos dados em formato JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup JSON</span>
            </button>

            <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-medium shadow-2xs transition-colors">
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Restaurar</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {importStatus && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{importStatus}</span>
          </div>
        )}

        {/* LOGS TABLE */}
        <div className="audit-table-container flex-1 overflow-auto p-4">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Data e Hora</th>
                  <th className="py-2.5 px-3">Usuário Responsável</th>
                  <th className="py-2.5 px-3">Módulo</th>
                  <th className="py-2.5 px-3">Ação</th>
                  <th className="py-2.5 px-3">Histórico de Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      Nenhum registro de log encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-600">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-900 block">{log.userName}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-tight">
                          {log.userRole}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.module === 'GDA'
                              ? 'bg-blue-100 text-blue-800'
                              : log.module === 'GID_USUARIOS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : log.module === 'GID_CHURRASQUEIRA'
                              ? 'bg-amber-100 text-amber-800'
                              : log.module === 'AUTH'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {log.module}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[10.5px] font-semibold text-slate-700">
                        {log.action}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 leading-snug">
                        {log.details}
                        {log.targetName && (
                          <span className="block text-[10.5px] text-slate-500 font-medium mt-0.5">
                            Alvo: {log.targetName}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs print:hidden">
          <span className="text-slate-500">
            Total de registros: <strong>{filteredLogs.length}</strong> eventos registrados
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
