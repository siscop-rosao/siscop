import React, { useState } from 'react';
import {
  useApp,
  formatBackupFilename,
  formatFileSize,
  formatBackupDate,
} from '../../context/AppContext';
import appContextRaw from '../../context/AppContext.tsx?raw';
import zipExporterRaw from '../../utils/zipExporter.ts?raw';
import printableCardRaw from '../gda/PrintableCard.tsx?raw';
import printSheetViewerModalRaw from '../gda/PrintSheetViewerModal.tsx?raw';
import firestoreSyncRaw from '../../services/firestoreSync.ts?raw';
import imageOptimizerRaw from '../../services/imageOptimizer.ts?raw';
import {
  X,
  Database,
  Download,
  Upload,
  Layers,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Cloud,
  FileText,
  Clock,
  Copy,
  Check,
  FileCheck,
  FolderArchive,
  FileCode,
  Loader2,
} from 'lucide-react';

interface BackupManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupManagerModal: React.FC<BackupManagerModalProps> = ({ isOpen, onClose }) => {
  const {
    cards,
    reservations,
    popProcedures,
    logs,
    users,
    downloadDatabaseBackup,
    downloadArchitectureBackup,
    downloadProjectZipBackup,
    importDatabaseJson,
    resetAllToFactoryDefaults,
    lastGeneratedBackup,
    lastRestoredBackup,
    syncWithCloudNow,
    isCloudSyncing,
  } = useApp();

  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const [cloudSyncFeedback, setCloudSyncFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const [downloadSuccessToast, setDownloadSuccessToast] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'gen' | 'res' | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgressText, setZipProgressText] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopyFilename = (filename: string, field: 'gen' | 'res') => {
    navigator.clipboard.writeText(filename);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleDownloadData = () => {
    const filename = downloadDatabaseBackup();
    setDownloadSuccessToast(`Backup de dados salvo com sucesso: ${filename}`);
    setTimeout(() => setDownloadSuccessToast(null), 6000);
  };

  const handleDownloadArchitecture = () => {
    const filename = downloadArchitectureBackup();
    setDownloadSuccessToast(`Backup de arquitetura e código-fonte (.json) salvo com sucesso: ${filename}`);
    setTimeout(() => setDownloadSuccessToast(null), 6000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    setZipProgressText('Iniciando empacotamento dos arquivos do SISCOP...');
    try {
      const filename = await downloadProjectZipBackup();
      setDownloadSuccessToast(`Pacote de backup completo empacotado em .ZIP com sucesso: ${filename}`);
      setTimeout(() => setDownloadSuccessToast(null), 6000);
    } catch (err) {
      console.error('Erro ao gerar arquivo ZIP:', err);
      alert('Falha ao gerar o arquivo ZIP. Tente novamente.');
    } finally {
      setIsZipping(false);
      setZipProgressText(null);
    }
  };

  const handleDownloadAppContextFile = () => {
    const blob = new Blob([appContextRaw], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'AppContext.tsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadSuccessToast('Arquivo AppContext.tsx baixado! Basta arrastá-lo para dentro do GitHub em SISCOP/src/context/.');
    setTimeout(() => setDownloadSuccessToast(null), 6000);
  };

  const handleDownloadZipExporterFile = () => {
    const blob = new Blob([zipExporterRaw], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'zipExporter.ts';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadSuccessToast('Arquivo zipExporter.ts baixado! Basta arrastá-lo para dentro do GitHub em SISCOP/src/utils/.');
    setTimeout(() => setDownloadSuccessToast(null), 6000);
  };

  const handleDownloadPrintableCardFile = () => {
    const blob = new Blob([printableCardRaw], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'PrintableCard.tsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadSuccessToast('Arquivo PrintableCard.tsx baixado! Basta arrastá-lo para dentro do GitHub em SISCOP/src/components/gda/.');
    setTimeout(() => setDownloadSuccessToast(null), 6000);
  };

  const handleDownloadPrintSheetViewerFile = () => {
    const blob = new Blob([printSheetViewerModalRaw], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'PrintSheetViewerModal.tsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadSuccessToast('Arquivo PrintSheetViewerModal.tsx baixado! Basta arrastá-lo para dentro do GitHub em SISCOP/src/components/gda/.');
    setTimeout(() => setDownloadSuccessToast(null), 6000);
  };

  const handleDownloadFirestoreSyncFile = () => {
    const blob = new Blob([firestoreSyncRaw], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'firestoreSync.ts';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadSuccessToast('Arquivo firestoreSync.ts baixado! Basta arrastá-lo para dentro do GitHub em SISCOP/src/services/.');
    setTimeout(() => setDownloadSuccessToast(null), 6000);
  };

  const handleDownloadImageOptimizerFile = () => {
    const blob = new Blob([imageOptimizerRaw], { type: 'text/typescript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'imageOptimizer.ts';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloadSuccessToast('Arquivo imageOptimizer.ts baixado! Basta arrastá-lo para dentro do GitHub em SISCOP/src/services/.');
    setTimeout(() => setDownloadSuccessToast(null), 6000);
  };

  const handleManualCloudSync = async () => {
    setCloudSyncFeedback({ type: null, message: '' });
    try {
      const res = await syncWithCloudNow();
      if (res.success) {
        setCloudSyncFeedback({
          type: 'success',
          message: `Sincronização com Cloud Firestore realizada com êxito! ${res.count} registros e configurações estão vigentes na nuvem para acesso simultâneo em qualquer máquina.`,
        });
      } else {
        setCloudSyncFeedback({
          type: 'error',
          message: `Falha na sincronização com a nuvem: ${res.error || 'Verifique sua conexão à internet.'}`,
        });
      }
    } catch (err: any) {
      setCloudSyncFeedback({
        type: 'error',
        message: 'Ocorreu um erro ao comunicar com os servidores do Firebase.',
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDatabaseJson(content, file.name, file.size);
      if (success) {
        setImportStatus({
          type: 'success',
          message: `Arquivo "${file.name}" importado e restaurado com êxito! Todos os registros e configurações foram sincronizados.`,
        });
      } else {
        setImportStatus({
          type: 'error',
          message: 'Arquivo de backup inválido ou corrompido. Certifique-se de selecionar um arquivo JSON gerado pela plataforma.',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleFactoryReset = () => {
    if (
      window.confirm(
        'ATENÇÃO: Deseja restaurar a plataforma para o padrão inicial de fábrica? Todos os dados customizados serão redefinidos para os registros padrões da Praça de Esportes.'
      )
    ) {
      resetAllToFactoryDefaults();
      setImportStatus({
        type: 'success',
        message: 'A plataforma foi restaurada com sucesso para os dados e configurações iniciais de fábrica.',
      });
    }
  };

  const previewDbFilename = formatBackupFilename('Backup_DataBase');
  const previewArchFilename = formatBackupFilename('Backup_Arquitetura_Completa');

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* ================= MODAL HEADER ================= */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-indigo-600 rounded-xl text-white shadow-md">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Centro de Backup e Restauração da Plataforma
                <span className="text-xs bg-indigo-900/80 text-indigo-200 px-2 py-0.5 rounded border border-indigo-700/60 font-mono">
                  Segurança Total
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Praça de Esportes Pref. Alvarim Vieira Rios • Gestão Municipal de Pouso Alegre/MG
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Fechar janela de backup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= SUCCESS TOAST ================= */}
        {downloadSuccessToast && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-800 font-medium">
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              {downloadSuccessToast}
            </span>
            <button
              onClick={() => setDownloadSuccessToast(null)}
              className="text-emerald-700 font-bold hover:underline cursor-pointer"
            >
              OK
            </button>
          </div>
        )}

        {/* ================= RESTORE STATUS ALERT ================= */}
        {importStatus.type && (
          <div
            className={`px-6 py-3 flex items-center justify-between text-xs border-b font-medium ${
              importStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            <span className="flex items-center gap-2">
              {importStatus.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              {importStatus.message}
            </span>
            <button
              onClick={() => setImportStatus({ type: null, message: '' })}
              className="text-slate-500 font-bold hover:text-slate-800 cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* ================= CONTENT BODY ================= */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status summary pill */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
            <div>
              <div className="text-lg font-bold text-slate-900 font-mono">{cards.length}</div>
              <div className="text-[11px] text-slate-500 font-medium">Carteirinhas</div>
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-700 font-mono">{reservations.length}</div>
              <div className="text-[11px] text-slate-500 font-medium">Reservas Churrasqueira</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-700 font-mono">{popProcedures.length}</div>
              <div className="text-[11px] text-slate-500 font-medium">Procedimentos POP</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-700 font-mono">{logs.length}</div>
              <div className="text-[11px] text-slate-500 font-medium">Logs de Auditoria</div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="text-lg font-bold text-amber-700 font-mono">{users.length}</div>
              <div className="text-[11px] text-slate-500 font-medium">Operadores / Acessos</div>
            </div>
          </div>

          {/* ================= QUADRO INFORMATIVO: HISTÓRICO DE BACKUPS ================= */}
          <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-indigo-600/30 text-indigo-400 rounded-lg border border-indigo-500/30">
                  <Clock className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    Quadro Informativo • Histórico dos Últimos Backups
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded font-mono border border-indigo-500/30 font-normal">
                      Rastreamento Ativo
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Último arquivo de backup gerado para download e último arquivo restaurado na plataforma
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CARD 1: ÚLTIMO ARQUIVO GERADO */}
              <div className="bg-slate-950/70 rounded-xl border border-blue-900/50 p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-400 uppercase tracking-wider bg-blue-950/80 px-2.5 py-1 rounded-md border border-blue-800/60">
                      <Download className="w-3.5 h-3.5" />
                      Último Arquivo Gerado (Download)
                    </span>
                    {lastGeneratedBackup && (
                      <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {formatFileSize(lastGeneratedBackup.sizeBytes)}
                      </span>
                    )}
                  </div>

                  {lastGeneratedBackup ? (
                    <>
                      {/* Nome do arquivo */}
                      <div className="bg-slate-900 border border-blue-900/60 rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-inner">
                        <div className="flex items-center gap-2 min-w-0">
                          {lastGeneratedBackup.type === 'ZIP' ? (
                            <FolderArchive className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                          )}
                          <span
                            className="font-mono text-xs font-bold text-blue-200 truncate select-all"
                            title={lastGeneratedBackup.filename}
                          >
                            {lastGeneratedBackup.filename}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyFilename(lastGeneratedBackup.filename, 'gen')}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0 cursor-pointer"
                          title="Copiar nome do arquivo"
                        >
                          {copiedField === 'gen' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Informações detalhadas */}
                      <div className="space-y-1.5 text-xs text-slate-300">
                        <div className="flex items-start gap-1.5">
                          <span className="text-slate-400 text-[11px] shrink-0 font-medium">Fator Gerador:</span>
                          <span className="font-semibold text-blue-300 text-[11px] bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-900/40">
                            {lastGeneratedBackup.typeLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-[11px] shrink-0 font-medium">Data e Horário:</span>
                          <span className="text-slate-200 font-mono text-[11px]">
                            {formatBackupDate(lastGeneratedBackup.timestamp)}
                          </span>
                        </div>
                        <div className="text-[10px] text-emerald-400/90 flex items-center gap-1 pt-1 border-t border-slate-800/80">
                          <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>Arquivo gerado e baixado automaticamente no seu dispositivo</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-5 text-center space-y-1.5 bg-slate-900/40 rounded-lg border border-dashed border-slate-800 p-4">
                      <Download className="w-6 h-6 text-slate-600 mx-auto" />
                      <div className="text-xs font-medium text-slate-300">Nenhum backup gerado recentemente</div>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                        Ao clicar em <strong className="text-slate-300">"Baixar Código do Projeto Completo (.ZIP)"</strong>, <strong className="text-slate-300">"Baixar Backup de Dados (.json)"</strong> ou <strong className="text-slate-300">"Baixar Pacote Estrutural (.json)"</strong>, o arquivo baixado será registrado aqui.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* CARD 2: ÚLTIMO ARQUIVO RESTAURADO */}
              <div className="bg-slate-950/70 rounded-xl border border-emerald-900/50 p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800/60">
                      <Upload className="w-3.5 h-3.5" />
                      Último Arquivo Restaurado (Carga)
                    </span>
                    {lastRestoredBackup && (
                      <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {formatFileSize(lastRestoredBackup.sizeBytes)}
                      </span>
                    )}
                  </div>

                  {lastRestoredBackup ? (
                    <>
                      {/* Nome do arquivo */}
                      <div className="bg-slate-900 border border-emerald-900/60 rounded-lg p-2.5 flex items-center justify-between gap-2 shadow-inner">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span
                            className="font-mono text-xs font-bold text-emerald-200 truncate select-all"
                            title={lastRestoredBackup.filename}
                          >
                            {lastRestoredBackup.filename}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyFilename(lastRestoredBackup.filename, 'res')}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0 cursor-pointer"
                          title="Copiar nome do arquivo"
                        >
                          {copiedField === 'res' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Informações detalhadas */}
                      <div className="space-y-1.5 text-xs text-slate-300">
                        <div className="flex items-start gap-1.5">
                          <span className="text-slate-400 text-[11px] shrink-0 font-medium">Fator Gerador:</span>
                          <span className="font-semibold text-emerald-300 text-[11px] bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-900/40">
                            Selecionar Arquivo JSON de Backup
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 text-[11px] shrink-0 font-medium">Data e Horário:</span>
                          <span className="text-slate-200 font-mono text-[11px]">
                            {formatBackupDate(lastRestoredBackup.timestamp)}
                          </span>
                        </div>
                        <div className="text-[10px] text-emerald-400/90 flex items-center gap-1 pt-1 border-t border-slate-800/80">
                          <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>Arquivo importado e base de dados sincronizada com sucesso</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-5 text-center space-y-1.5 bg-slate-900/40 rounded-lg border border-dashed border-slate-800 p-4">
                      <Upload className="w-6 h-6 text-slate-600 mx-auto" />
                      <div className="text-xs font-medium text-slate-300">Nenhum backup restaurado recentemente</div>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                        Ao clicar em <strong className="text-slate-300">"Selecionar Arquivo JSON de Backup"</strong> e carregar um arquivo, ele será registrado aqui.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* TWO MAIN BACKUP OPTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* OPTION 1: DATA BACKUP */}
            <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/70 border border-blue-200 rounded-xl p-5 flex flex-col justify-between shadow-2xs">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-blue-600 text-white rounded-lg shadow-xs">
                    <Database className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      1. Backup da Base de Dados (JSON)
                    </h3>
                    <span className="text-[11px] text-blue-700 font-semibold">
                      Todos os registros cadastrados
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Exporta todos os frequentadores cadastrados, planos individuais, familiares e especiais, histórico de reservas de churrasqueiras, procedimentos POP, logs e configurações de layout.
                </p>

                <div className="bg-white/90 border border-blue-200 rounded-lg p-2.5 space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Padrão exato da nomenclatura de arquivo:
                  </div>
                  <div className="font-mono text-xs text-blue-900 font-bold bg-blue-50 px-2 py-1 rounded border border-blue-200 truncate">
                    {previewDbFilename}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    * Registra data (DDMMAA) e horário exato (hora, minutos e segundos).
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleDownloadData}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Backup de Dados (.json)</span>
                </button>
              </div>
            </div>

            {/* OPTION 2: FULL ARCHITECTURE & SOURCE CODE BACKUP */}
            <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/70 border border-emerald-200 rounded-xl p-5 flex flex-col justify-between shadow-2xs">
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-emerald-600 text-white rounded-lg shadow-xs">
                    <Layers className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      2. Backup da Estrutura e Arquitetura Completa
                    </h3>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      Alma, estrutura, scripts e código
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Exporta o pacote completo de engenharia da plataforma: toda a árvore de arquivos, scripts de compilação, dependências (package.json), schemas de dados, tipos TypeScript, guias de implantação e snapshot integral.
                </p>

                <div className="bg-white/90 border border-emerald-200 rounded-lg p-2.5 space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Padrão de nomenclatura estrutural:
                  </div>
                  <div className="font-mono text-xs text-emerald-900 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200 truncate">
                    {previewArchFilename}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    * Pacote completo pronto para restauração ou reimplantação (GitHub, Vercel, Firebase).
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-2.5">
                {/* BOTÃO PRINCIPAL: ARQUIVO ZIP COMPLETO (PRONTO PARA GITHUB, VERCEL E FIREBASE) */}
                <button
                  type="button"
                  onClick={handleDownloadZip}
                  disabled={isZipping}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer"
                  title="Baixar arquivo ZIP com todo o código-fonte (src, configs, package.json) pronto para enviar ao GitHub e hospedar na Vercel ou Firebase"
                >
                  {isZipping ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                      <span>{zipProgressText || 'Empacotando projeto em .ZIP...'}</span>
                    </>
                  ) : (
                    <>
                      <FolderArchive className="w-4 h-4 text-emerald-200" />
                      <span>Baixar Código do Projeto Completo (.ZIP)</span>
                    </>
                  )}
                </button>
                <div className="text-[10px] text-emerald-800 font-semibold text-center leading-tight">
                  ★ Arquivo .ZIP real contendo src/, configs, package.json e README para GitHub e Vercel.
                </div>

                {/* SEÇÃO: ARQUIVOS ESPECÍFICOS PARA ATUALIZAR NO GITHUB */}
                <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-3 space-y-2">
                  <div className="text-[11px] font-bold text-slate-200 flex items-center justify-between">
                    <span>Baixar Arquivos Individuais Atualizados:</span>
                    <span className="text-[10px] text-emerald-400 font-mono">100% Sincronizados</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={handleDownloadPrintableCardFile}
                      className="w-full py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold flex items-center justify-between border border-slate-600 shadow-2xs transition-colors cursor-pointer"
                      title="Salvar em SISCOP/src/components/gda/PrintableCard.tsx"
                    >
                      <span className="truncate">PrintableCard.tsx</span>
                      <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadPrintSheetViewerFile}
                      className="w-full py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold flex items-center justify-between border border-slate-600 shadow-2xs transition-colors cursor-pointer"
                      title="Salvar em SISCOP/src/components/gda/PrintSheetViewerModal.tsx"
                    >
                      <span className="truncate">PrintSheetViewerModal.tsx</span>
                      <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1" />
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadAppContextFile}
                      className="w-full py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold flex items-center justify-between border border-slate-600 shadow-2xs transition-colors cursor-pointer"
                      title="Salvar em SISCOP/src/context/AppContext.tsx"
                    >
                      <span className="truncate">AppContext.tsx</span>
                      <Download className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-1" />
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadZipExporterFile}
                      className="w-full py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold flex items-center justify-between border border-slate-600 shadow-2xs transition-colors cursor-pointer"
                      title="Salvar em SISCOP/src/utils/zipExporter.ts"
                    >
                      <span className="truncate">zipExporter.ts</span>
                      <Download className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-1" />
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadFirestoreSyncFile}
                      className="w-full py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold flex items-center justify-between border border-slate-600 shadow-2xs transition-colors cursor-pointer"
                      title="Salvar em SISCOP/src/services/firestoreSync.ts"
                    >
                      <span className="truncate">firestoreSync.ts</span>
                      <Download className="w-3.5 h-3.5 text-teal-400 shrink-0 ml-1" />
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadImageOptimizerFile}
                      className="w-full py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold flex items-center justify-between border border-slate-600 shadow-2xs transition-colors cursor-pointer"
                      title="Salvar em SISCOP/src/services/imageOptimizer.ts"
                    >
                      <span className="truncate">imageOptimizer.ts</span>
                      <Download className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />
                    </button>
                  </div>
                </div>

                {/* BOTÃO SECUNDÁRIO: FORMATO JSON */}
                <button
                  type="button"
                  onClick={handleDownloadArchitecture}
                  className="w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 border border-slate-300 transition-colors cursor-pointer"
                  title="Exportar manifesto técnico descritivo em formato JSON"
                >
                  <FileCode className="w-3.5 h-3.5 text-slate-500" />
                  <span>Baixar Pacote Estrutural em JSON (.json)</span>
                </button>
              </div>
            </div>
          </div>

          {/* ================= SEÇÃO DE SINCRONIZAÇÃO EM NUVEM (FIREBASE FIRESTORE) ================= */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl p-5 border border-blue-800 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-blue-600 rounded-lg shadow-sm">
                  <Cloud className="w-5 h-5 text-white" />
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    Sincronização em Nuvem • Google Firebase Firestore
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 font-semibold">
                      ● Ativa
                    </span>
                  </h3>
                  <p className="text-xs text-blue-200">
                    Garante que cadastros e imagens inseridos em uma máquina fiquem disponíveis imediatamente em qualquer outro computador.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleManualCloudSync}
                disabled={isCloudSyncing}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
              >
                {isCloudSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                    <span>Sincronizando com Firestore...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 text-emerald-200" />
                    <span>Sincronizar Tudo com a Nuvem Agora</span>
                  </>
                )}
              </button>
            </div>

            {cloudSyncFeedback && cloudSyncFeedback.message && (
              <div
                className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 border ${
                  cloudSyncFeedback.type === 'success'
                    ? 'bg-emerald-950/80 text-emerald-200 border-emerald-700'
                    : 'bg-rose-950/80 text-rose-200 border-rose-700'
                }`}
              >
                {cloudSyncFeedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{cloudSyncFeedback.message}</span>
              </div>
            )}
          </div>

          {/* RESTORE SECTION */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-slate-700" />
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Restaurar Base de Dados a Partir de Arquivo de Backup (.json)
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              Selecione qualquer arquivo <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-300">Backup_DataBase_*.json</code> previamente exportado para recuperar cadastros, reservas e configurações.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 shadow-2xs transition-colors">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Selecionar Arquivo JSON de Backup</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleFactoryReset}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-700 hover:text-rose-900 hover:bg-rose-50 rounded-xl text-xs font-semibold border border-rose-200 transition-colors ml-auto cursor-pointer"
                title="Redefinir registros para o estado inicial"
              >
                <RefreshCw className="w-3.5 h-3.5 text-rose-600" />
                <span>Restaurar Padrões de Fábrica</span>
              </button>
            </div>
          </div>
        </div>

        {/* ================= MODAL FOOTER ================= */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Backups com integridade verificada, rastreamento ativo e auditoria automática</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
