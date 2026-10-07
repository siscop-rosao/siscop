import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  CardData,
  BarbecueReservation,
  AuditLog,
  CardLayoutConfig,
  ActionType,
  ModuleType,
  CategoryType,
  PlanType,
  PopProcedure,
  PlatformArchitectureBackup,
  PlatformSettings,
  BackupGenerationRecord,
  BackupRestoreRecord,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_CARDS,
  INITIAL_RESERVATIONS,
  INITIAL_LOGS,
  INITIAL_POP_PROCEDURES,
  DEFAULT_LAYOUT_CONFIG,
  DEFAULT_PLATFORM_SETTINGS,
  generateDefaultPaymentGrid,
} from '../data/initialData';

export const formatBackupFilename = (prefix = 'Backup_DataBase'): string => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const aa = String(now.getFullYear()).slice(-2);
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${prefix}_${dd}${mm}${aa}_${hh}${min}${ss}h.json`;
};

export const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export const formatBackupDate = (isoString?: string): string => {
  if (!isoString) return '--';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
};

interface AppContextType {
  // Auth & Session
  currentUser: User | null;
  users: User[];
  login: (username: string, pass: string) => boolean;
  logout: () => void;
  switchUser: (userId: string) => void;
  updateUserPassword: (userId: string, newPass: string) => void;

  // View Navigation
  currentView: 'DASHBOARD' | 'GDA' | 'GID' | 'POP' | 'LOGS' | 'USERS_ADMIN';
  setCurrentView: (view: 'DASHBOARD' | 'GDA' | 'GID' | 'POP' | 'LOGS' | 'USERS_ADMIN') => void;
  gidActiveTab: 'USUARIOS' | 'CHURRASQUEIRA';
  setGidActiveTab: (tab: 'USUARIOS' | 'CHURRASQUEIRA') => void;
  gidSubTab: 'PREFEITURA' | 'BOMBEIROS' | 'PLANO_INDIVIDUAL' | 'PLANO_FAMILIAR' | 'PLANO_ESPECIAL';
  setGidSubTab: (subTab: 'PREFEITURA' | 'BOMBEIROS' | 'PLANO_INDIVIDUAL' | 'PLANO_FAMILIAR' | 'PLANO_ESPECIAL') => void;
  gidSearchTerm: string;
  setGidSearchTerm: (term: string) => void;

  // GDA Selection
  selectedCardForGda: CardData | null;
  setSelectedCardForGda: (card: CardData | null) => void;
  openCardInGda: (card: CardData) => void;

  // Ficha Cadastral Global State
  fichaModalCard: CardData | null;
  fichaModalMode: 'VIEW' | 'EDIT';
  isFichaModalOpen: boolean;
  openFichaModal: (card: CardData, mode?: 'VIEW' | 'EDIT') => void;
  closeFichaModal: () => void;

  // Cards
  cards: CardData[];
  addCard: (cardData: Partial<CardData>) => CardData;
  updateCard: (id: string, updates: Partial<CardData>) => void;
  deleteCard: (id: string) => void;
  incrementPrintedCount: (id: string) => void;
  generateNextControlNumber: (category: CategoryType, isTitular?: boolean, familyBase?: string) => string;
  addFamilyMember: (titularId: string, dependentData: Partial<CardData>) => CardData;

  // Barbecue Reservations
  reservations: BarbecueReservation[];
  addReservation: (reservation: Omit<BarbecueReservation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
  updateReservation: (id: string, updates: Partial<BarbecueReservation>) => void;
  deleteReservation: (id: string) => void;

  // POP - Procedimentos Operacionais Padrão
  popProcedures: PopProcedure[];
  addPopProcedure: (procedure: Omit<PopProcedure, 'id' | 'updatedAt' | 'createdBy'>) => void;
  updatePopProcedure: (id: string, updates: Partial<PopProcedure>) => void;
  deletePopProcedure: (id: string) => void;
  togglePinPop: (id: string) => void;
  reorderPopProcedures: (newProcedures: PopProcedure[]) => void;

  // Logs
  logs: AuditLog[];
  addLog: (action: ActionType, module: ModuleType, details: string, targetId?: string, targetName?: string) => void;
  clearLogs: () => void;

  // Layout Configuration & Coat of Arms
  layoutConfig: CardLayoutConfig;
  updateLayoutConfig: (updates: Partial<CardLayoutConfig>) => void;
  resetLayoutConfig: () => void;
  updateCoatOfArms: (dataUrl: string) => void;
  resetCoatOfArms: () => void;

  // Platform Settings & Visual Identity (Setup)
  platformSettings: PlatformSettings;
  updatePlatformSettings: (updates: Partial<PlatformSettings>) => void;
  resetPlatformSettings: () => void;
  uploadNavbarLogo: (dataUrl: string) => void;
  uploadDashboardBanner: (dataUrl: string) => void;

  // Backup & Restore
  exportDatabaseJson: () => { filename: string; json: string };
  exportArchitectureJson: () => { filename: string; json: string };
  downloadDatabaseBackup: () => string;
  downloadArchitectureBackup: () => string;
  downloadProjectZipBackup: (onProgress?: (percent: number, message: string) => void) => Promise<string>;
  importDatabaseJson: (jsonString: string, originalFilename?: string, fileSize?: number) => boolean;
  resetAllToFactoryDefaults: () => void;
  lastGeneratedBackup: BackupGenerationRecord | null;
  lastRestoredBackup: BackupRestoreRecord | null;
  recordGeneratedBackup: (record: BackupGenerationRecord) => void;
  recordRestoredBackup: (record: BackupRestoreRecord) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'pmpa_users_v2',
  CURRENT_USER: 'pmpa_current_user_v2',
  CARDS: 'pmpa_cards_v2',
  RESERVATIONS: 'pmpa_reservations_v2',
  LOGS: 'pmpa_logs_v2',
  LAYOUT: 'pmpa_layout_v2',
  POP: 'pmpa_pop_v2',
  SETTINGS: 'siscop_platform_settings_v2',
  LAST_GENERATED_BACKUP: 'pmpa_last_generated_backup_v2',
  LAST_RESTORED_BACKUP: 'pmpa_last_restored_backup_v2',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Users state
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  // Current session
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) return JSON.parse(saved);
      return INITIAL_USERS[0]; // Default Carlos Alberto
    } catch {
      return INITIAL_USERS[0];
    }
  });

  // Navigation states
  const [currentView, setCurrentView] = useState<'DASHBOARD' | 'GDA' | 'GID' | 'POP' | 'LOGS' | 'USERS_ADMIN'>('DASHBOARD');
  const [gidActiveTab, setGidActiveTab] = useState<'USUARIOS' | 'CHURRASQUEIRA'>('USUARIOS');
  const [gidSubTab, setGidSubTab] = useState<
    'PREFEITURA' | 'BOMBEIROS' | 'PLANO_INDIVIDUAL' | 'PLANO_FAMILIAR' | 'PLANO_ESPECIAL'
  >('PLANO_FAMILIAR');
  const [gidSearchTerm, setGidSearchTerm] = useState<string>('');

  // GDA Active Card
  const [selectedCardForGda, setSelectedCardForGda] = useState<CardData | null>(null);

  // Ficha Cadastral Global State
  const [fichaModalCard, setFichaModalCard] = useState<CardData | null>(null);
  const [fichaModalMode, setFichaModalMode] = useState<'VIEW' | 'EDIT'>('VIEW');
  const [isFichaModalOpen, setIsFichaModalOpen] = useState(false);

  // Cards State (Always ensure payment cells in back grids are blank!)
  const [cards, setCards] = useState<CardData[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CARDS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_CARDS.length) {
          // Normalize so all back grids have blank datePaid and signature
          return parsed.map((c: CardData) => ({
            ...c,
            grid1: generateDefaultPaymentGrid(),
            grid2: generateDefaultPaymentGrid(),
          }));
        }
      }
      return INITIAL_CARDS;
    } catch {
      return INITIAL_CARDS;
    }
  });

  // Reservations State
  const [reservations, setReservations] = useState<BarbecueReservation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RESERVATIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= INITIAL_RESERVATIONS.length) {
          return parsed;
        }
      }
      return INITIAL_RESERVATIONS;
    } catch {
      return INITIAL_RESERVATIONS;
    }
  });

  // POP Procedures State
  const [popProcedures, setPopProcedures] = useState<PopProcedure[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POP);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Garante que o POP com as tabelas de valores sempre esteja presente
          const hasPricingPop = parsed.some((p: PopProcedure) => p.id === 'pop-tab-valores');
          if (!hasPricingPop) {
            return [INITIAL_POP_PROCEDURES[0], ...parsed];
          }
          return parsed;
        }
      }
      return INITIAL_POP_PROCEDURES;
    } catch {
      return INITIAL_POP_PROCEDURES;
    }
  });

  // Audit Logs State
  const [logs, setLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      return saved ? JSON.parse(saved) : INITIAL_LOGS;
    } catch {
      return INITIAL_LOGS;
    }
  });

  // Card Layout Configuration
  const [layoutConfig, setLayoutConfig] = useState<CardLayoutConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LAYOUT);
      if (saved) {
        const parsed = JSON.parse(saved);
        if ((parsed.cardWidthMm === 98 && parsed.cardHeightMm === 68) || (parsed.cardWidthMm === 99 && parsed.cardHeightMm === 69)) {
          return { ...DEFAULT_LAYOUT_CONFIG, ...parsed, cardWidthMm: 100, cardHeightMm: 70 };
        }
        return { ...DEFAULT_LAYOUT_CONFIG, ...parsed };
      }
      return DEFAULT_LAYOUT_CONFIG;
    } catch {
      return DEFAULT_LAYOUT_CONFIG;
    }
  });

  // Platform Settings & Visual Identity (Setup)
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? { ...DEFAULT_PLATFORM_SETTINGS, ...JSON.parse(saved) } : DEFAULT_PLATFORM_SETTINGS;
    } catch {
      return DEFAULT_PLATFORM_SETTINGS;
    }
  });

  // Last Backup Records (Generated & Restored)
  const [lastGeneratedBackup, setLastGeneratedBackup] = useState<BackupGenerationRecord | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LAST_GENERATED_BACKUP);
      if (saved) return JSON.parse(saved);
      const savedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
      const parsedLogs: AuditLog[] = savedLogs ? JSON.parse(savedLogs) : INITIAL_LOGS;
      const backupLog = parsedLogs.find(
        (l) => l.action === 'EXPORTAR_BACKUP_DADOS' || l.action === 'EXPORTAR_BACKUP_ARQUITETURA'
      );
      if (backupLog) {
        const isArch = backupLog.action === 'EXPORTAR_BACKUP_ARQUITETURA';
        const match = backupLog.details?.match(/Backup_[A-Za-z0-9_]+\.json/);
        return {
          filename: match ? match[0] : (isArch ? 'Backup_Arquitetura_Completa.json' : 'Backup_DataBase.json'),
          type: isArch ? 'ARCHITECTURE' : 'DATA',
          typeLabel: isArch
            ? 'Baixar Pacote de Arquitetura & Código (.json)'
            : 'Baixar Backup de Dados (.json)',
          timestamp: backupLog.timestamp || new Date().toISOString(),
          sizeBytes: isArch ? 245000 : 125000,
        };
      }
      return null;
    } catch {
      return null;
    }
  });

  const [lastRestoredBackup, setLastRestoredBackup] = useState<BackupRestoreRecord | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LAST_RESTORED_BACKUP);
      if (saved) return JSON.parse(saved);
      const savedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
      const parsedLogs: AuditLog[] = savedLogs ? JSON.parse(savedLogs) : INITIAL_LOGS;
      const restoreLog = parsedLogs.find((l) => l.action === 'RESTAURAR_BACKUP');
      if (restoreLog) {
        const match = restoreLog.details?.match(/Backup_[A-Za-z0-9_]+\.json/);
        return {
          filename: match ? match[0] : 'Backup_DataBase_Recente.json',
          timestamp: restoreLog.timestamp || new Date().toISOString(),
          success: true,
          sizeBytes: 125000,
        };
      }
      return null;
    } catch {
      return null;
    }
  });

  const recordGeneratedBackup = (record: BackupGenerationRecord) => {
    setLastGeneratedBackup(record);
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_GENERATED_BACKUP, JSON.stringify(record));
    } catch (e) {
      console.error('Falha ao salvar último backup gerado:', e);
    }
  };

  const recordRestoredBackup = (record: BackupRestoreRecord) => {
    setLastRestoredBackup(record);
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_RESTORED_BACKUP, JSON.stringify(record));
    } catch (e) {
      console.error('Falha ao salvar último backup restaurado:', e);
    }
  };

  // Persistence Effects
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (e) {
      console.warn('Failed saving users to localStorage:', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } catch (e) {
      console.warn('Failed saving current user to localStorage:', e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
    } catch (e) {
      console.warn('Failed saving cards to localStorage:', e);
    }
  }, [cards]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RESERVATIONS, JSON.stringify(reservations));
    } catch (e) {
      console.warn('Failed saving reservations to localStorage:', e);
    }
  }, [reservations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.POP, JSON.stringify(popProcedures));
    } catch (e) {
      console.warn('Failed saving POP to localStorage:', e);
    }
  }, [popProcedures]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    } catch (e) {
      console.warn('Failed saving logs to localStorage:', e);
    }
  }, [logs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LAYOUT, JSON.stringify(layoutConfig));
    } catch (e) {
      console.warn('Failed saving layout config to localStorage:', e);
    }
  }, [layoutConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(platformSettings));
    } catch (e) {
      console.warn('Failed saving platform settings to localStorage:', e);
    }
  }, [platformSettings]);

  // Log Generator
  const addLog = (
    action: ActionType,
    module: ModuleType,
    details: string,
    targetId?: string,
    targetName?: string
  ) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id || 'sys',
      userName: currentUser?.name || 'Sistema Operacional',
      userRole: currentUser?.role || 'sistema',
      action,
      module,
      details,
      targetId,
      targetName,
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  // Auth methods
  const login = (username: string, pass: string): boolean => {
    const found = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.active
    );
    if (found && (!found.password || found.password === pass)) {
      const updatedUser = { ...found, lastLogin: new Date().toISOString() };
      setCurrentUser(updatedUser);
      setUsers((prev) => prev.map((u) => (u.id === found.id ? updatedUser : u)));
      
      const newLog: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: found.id,
        userName: found.name,
        userRole: found.role,
        action: 'LOGIN',
        module: 'AUTH',
        details: `Login efetuado com sucesso pelo usuário ${found.name} (${found.username}).`,
      };
      setLogs((prev) => [newLog, ...prev]);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (currentUser) {
      addLog('LOGOUT', 'AUTH', `Usuário ${currentUser.name} encerrou a sessão.`);
    }
    setCurrentUser(null);
  };

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      addLog('LOGIN', 'AUTH', `Troca rápida de sessão para ${target.name} (${target.cargo}).`);
    }
  };

  const updateUserPassword = (userId: string, newPass: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPass } : u))
    );
    addLog('LOGIN', 'AUTH', `Senha alterada para o usuário ID ${userId}.`);
  };

  // Control number generation
  const generateNextControlNumber = (
    category: CategoryType,
    isTitular = true,
    familyBase?: string
  ): string => {
    const currentYear = new Date().getFullYear();
    
    if (category === 'PLANO_FAMILIAR') {
      if (!isTitular && familyBase) {
        const count = cards.filter(
          (c) => c.familyHeadId === familyBase || c.controlNumber.startsWith(familyBase)
        ).length;
        return `${familyBase}-${String(count + 1).padStart(2, '0')}`;
      } else {
        const famCards = cards.filter((c) => c.category === 'PLANO_FAMILIAR' && c.isTitular);
        const nextNum = famCards.length + 1;
        return `FAM-${currentYear}-${String(nextNum).padStart(4, '0')}-01`;
      }
    }

    if (category === 'PLANO_ESPECIAL') {
      const espCards = cards.filter((c) => c.category === 'PLANO_ESPECIAL');
      const nextNum = espCards.length + 1;
      return `ESP-${currentYear}-${String(nextNum).padStart(4, '0')}`;
    }

    let prefix = 'IND';
    if (category === 'PREFEITURA') prefix = 'PMPA';
    if (category === 'BOMBEIROS') prefix = 'CBMMG';

    const catCards = cards.filter((c) => c.category === category);
    const nextNum = catCards.length + 1;
    return `${prefix}-${currentYear}-${String(nextNum).padStart(4, '0')}`;
  };

  // Card Operations
  const addCard = (cardData: Partial<CardData>): CardData => {
    const currentYear = new Date().getFullYear().toString();
    const nextYear = (new Date().getFullYear() + 1).toString();
    const category = cardData.category || 'PLANO_INDIVIDUAL';
    
    let planType: PlanType = 'INDIVIDUAL';
    if (category === 'PLANO_FAMILIAR') planType = 'FAMILIAR';
    if (category === 'PLANO_ESPECIAL') planType = 'ESPECIAL';

    const isTitular = cardData.isTitular !== undefined ? cardData.isTitular : true;
    const isSpecialExempt = category === 'PLANO_ESPECIAL' ? true : (cardData.isSpecialExempt || false);

    const controlNumber = cardData.controlNumber || generateNextControlNumber(category, isTitular);

    const newCard: CardData = {
      id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      controlNumber,
      planType,
      category,
      familyHeadId: cardData.familyHeadId,
      isTitular,
      familyName: cardData.familyName || (isTitular ? `Família de ${cardData.name || 'Titular'}` : undefined),
      name: cardData.name || 'Novo Frequentador',
      birthDate: cardData.birthDate || '',
      rgOrCpf: cardData.rgOrCpf || '',
      photoUrl: '', // Foto física é colada no quadro
      directorLabel: cardData.directorLabel || layoutConfig.directorLabel || 'Diretor',
      directorName: cardData.directorName || 'Prof. Marcos Vinícius',
      isSpecialExempt,
      specialCondition: cardData.specialCondition || (category === 'PLANO_ESPECIAL' ? 'PCD / Isento' : undefined),
      medicalReportInfo: cardData.medicalReportInfo || '',
      year1: cardData.year1 || currentYear,
      year2: cardData.year2 || nextYear,
      // Verso sempre limpo com células em branco para inserção manual
      grid1: generateDefaultPaymentGrid(),
      grid2: generateDefaultPaymentGrid(),
      notesHtml: cardData.notesHtml || '',
      emissionDate: cardData.emissionDate || new Date().toLocaleDateString('pt-BR'),
      printedCount: 0,
      phone: cardData.phone || '',
      address: cardData.address || '',
      status: cardData.status || 'ATIVO',
      medicalExamValidUntil: cardData.medicalExamValidUntil || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastEditedBy: currentUser?.name,
    };

    setCards((prev) => [newCard, ...prev]);
    addLog(
      'CRIAR_USUARIO_GID',
      'GID_USUARIOS',
      `Cadastrado novo registro: ${newCard.name} (Nº ${newCard.controlNumber}) - ${newCard.category}.`,
      newCard.id,
      newCard.name
    );

    return newCard;
  };

  const addFamilyMember = (titularId: string, dependentData: Partial<CardData>): CardData => {
    const titular = cards.find((c) => c.id === titularId);
    if (!titular) throw new Error('Titular não localizado.');

    const familyBase = titular.controlNumber.replace(/-\d+$/, '');
    const nextDepNum = generateNextControlNumber('PLANO_FAMILIAR', false, familyBase);

    const newDep: CardData = {
      id: `card-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      controlNumber: nextDepNum,
      planType: 'FAMILIAR',
      category: 'PLANO_FAMILIAR',
      familyHeadId: titular.id,
      isTitular: false,
      familyName: titular.familyName,
      name: dependentData.name || 'Dependente Familiar',
      birthDate: dependentData.birthDate || '',
      rgOrCpf: dependentData.rgOrCpf || '',
      photoUrl: '',
      directorLabel: titular.directorLabel || 'Diretor',
      directorName: titular.directorName || 'Prof. Marcos Vinícius',
      year1: titular.year1,
      year2: titular.year2,
      grid1: generateDefaultPaymentGrid(),
      grid2: generateDefaultPaymentGrid(),
      notesHtml: dependentData.notesHtml || `<div>Dependente de ${titular.name}</div>`,
      emissionDate: new Date().toLocaleDateString('pt-BR'),
      printedCount: 0,
      phone: titular.phone,
      address: titular.address,
      status: 'ATIVO',
      medicalExamValidUntil: titular.medicalExamValidUntil,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastEditedBy: currentUser?.name,
    };

    setCards((prev) => [...prev, newDep]);
    addLog(
      'CRIAR_USUARIO_GID',
      'GID_USUARIOS',
      `Adicionado dependente ${newDep.name} ao plano familiar de ${titular.name} (Nº ${newDep.controlNumber}).`,
      newDep.id,
      newDep.name
    );

    return newDep;
  };

  const updateCard = (id: string, updates: Partial<CardData>) => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated: CardData = {
            ...c,
            ...updates,
            grid1: updates.grid1 !== undefined ? updates.grid1 : (c.grid1 || generateDefaultPaymentGrid()),
            grid2: updates.grid2 !== undefined ? updates.grid2 : (c.grid2 || generateDefaultPaymentGrid()),
            updatedAt: new Date().toISOString(),
            lastEditedBy: currentUser?.name || c.lastEditedBy || 'Carlos Alberto',
          };
          return updated;
        }
        return c;
      })
    );

    if (updates.notesHtml !== undefined) {
      addLog(
        'SALVAR_BLOCO_NOTAS',
        'GID_USUARIOS',
        `Atualizou o bloco de notas de informações do frequentador ID ${id}.`,
        id
      );
    } else {
      addLog(
        'ATUALIZAR_USUARIO_GID',
        'GID_USUARIOS',
        `Atualizou os dados de cadastro/carteirinha do frequentador ID ${id}.`,
        id
      );
    }
  };

  const deleteCard = (id: string) => {
    const target = cards.find((c) => c.id === id);
    setCards((prev) => prev.filter((c) => c.id !== id && c.familyHeadId !== id));
    addLog(
      'EXCLUIR_USUARIO_GID',
      'GID_USUARIOS',
      `Removeu o registro do frequentador ${target?.name || id} (Nº ${target?.controlNumber}).`,
      id,
      target?.name
    );
  };

  const incrementPrintedCount = (id: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, printedCount: (c.printedCount || 0) + 1 } : c))
    );
    const target = cards.find((c) => c.id === id);
    addLog(
      'IMPRIMIR_CARTEIRINHA',
      'GDA',
      `Emissão impressa da carteirinha de acesso às piscinas para: ${target?.name} (Nº ${target?.controlNumber}).`,
      id,
      target?.name
    );
  };

  const openCardInGda = (card: CardData) => {
    setSelectedCardForGda(card);
    setCurrentView('GDA');
    addLog(
      'EMITIR_CARTEIRINHA',
      'GDA',
      `Abriu layout de montagem/impressão de carteirinha para ${card.name} (Nº ${card.controlNumber}).`,
      card.id,
      card.name
    );
  };

  const openFichaModal = (card: CardData, mode: 'VIEW' | 'EDIT' = 'VIEW') => {
    setFichaModalCard(card);
    setFichaModalMode(mode);
    setIsFichaModalOpen(true);
    addLog(
      mode === 'EDIT' ? 'ATUALIZAR_USUARIO_GID' : 'CONSULTAR_GID',
      'GID_USUARIOS',
      `${mode === 'EDIT' ? 'Acessou edição da Ficha Cadastral' : 'Visualizou Ficha Cadastral'} de ${card.name} (Nº ${card.controlNumber}).`,
      card.id,
      card.name
    );
  };

  const closeFichaModal = () => {
    setIsFichaModalOpen(false);
    setFichaModalCard(null);
  };

  // Barbecue operations
  const addReservation = (
    data: Omit<BarbecueReservation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ) => {
    const newRes: BarbecueReservation = {
      ...data,
      id: `res-${Date.now()}`,
      createdBy: currentUser?.name || 'Operador',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setReservations((prev) => [newRes, ...prev]);
    addLog(
      'RESERVA_CHURRASQUEIRA',
      'GID_CHURRASQUEIRA',
      `Nova reserva de Churrasqueira nº ${newRes.kioskNumber} para ${newRes.responsibleName} na data ${newRes.date}.`,
      newRes.id,
      `Quiosque ${newRes.kioskNumber}`
    );
  };

  const updateReservation = (id: string, updates: Partial<BarbecueReservation>) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r))
    );
    addLog(
      'ATUALIZAR_RESERVA',
      'GID_CHURRASQUEIRA',
      `Atualizou dados da reserva de churrasqueira ID ${id}.`,
      id
    );
  };

  const deleteReservation = (id: string) => {
    const target = reservations.find((r) => r.id === id);
    setReservations((prev) => prev.filter((r) => r.id !== id));
    addLog(
      'CANCELAR_RESERVA',
      'GID_CHURRASQUEIRA',
      `Cancelou/excluiu a reserva do Quiosque nº ${target?.kioskNumber} do dia ${target?.date} (${target?.responsibleName}).`,
      id
    );
  };

  // POP Operations
  const addPopProcedure = (procedure: Omit<PopProcedure, 'id' | 'updatedAt' | 'createdBy'>) => {
    const newPop: PopProcedure = {
      ...procedure,
      id: `pop-${Date.now()}`,
      createdBy: currentUser?.name || 'Diretoria',
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setPopProcedures((prev) => [newPop, ...prev]);
    addLog(
      'CRIAR_POP',
      'POP',
      `Cadastrou novo procedimento operacional: ${newPop.code} - ${newPop.title}.`,
      newPop.id,
      newPop.title
    );
  };

  const updatePopProcedure = (id: string, updates: Partial<PopProcedure>) => {
    setPopProcedures((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, ...updates, updatedAt: new Date().toISOString().split('T')[0] }
          : p
      )
    );
    addLog(
      'ATUALIZAR_POP',
      'POP',
      `Atualizou procedimento operacional ID ${id}.`,
      id
    );
  };

  const deletePopProcedure = (id: string) => {
    const target = popProcedures.find((p) => p.id === id);
    setPopProcedures((prev) => prev.filter((p) => p.id !== id));
    addLog(
      'EXCLUIR_POP',
      'POP',
      `Excluiu procedimento operacional: ${target?.code || id}.`,
      id,
      target?.title
    );
  };

  const togglePinPop = (id: string) => {
    setPopProcedures((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isPinned: !p.isPinned } : p))
    );
  };

  const reorderPopProcedures = (newProcedures: PopProcedure[]) => {
    setPopProcedures(newProcedures);
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('EXPORTAR_BACKUP_DADOS', 'SISTEMA', 'Histórico de logs foi reiniciado pelo administrador.');
  };

  // Layout configuration & Coat of Arms
  const updateLayoutConfig = (updates: Partial<CardLayoutConfig>) => {
    setLayoutConfig((prev) => ({ ...prev, ...updates }));
    addLog('CONFIGURAR_LAYOUT', 'GDA', 'Ajustou parâmetros do layout customizável de impressão da carteirinha.');
  };

  const resetLayoutConfig = () => {
    setLayoutConfig(DEFAULT_LAYOUT_CONFIG);
  };

  const updateCoatOfArms = (dataUrl: string) => {
    setLayoutConfig((prev) => ({ ...prev, customCoatOfArmsUrl: dataUrl }));
    addLog('ATUALIZAR_BRASAO', 'GDA', 'Carregou e fixou nova imagem oficial do Brasão da Prefeitura na carteirinha.');
  };

  const resetCoatOfArms = () => {
    setLayoutConfig((prev) => ({ ...prev, customCoatOfArmsUrl: '' }));
    addLog('ATUALIZAR_BRASAO', 'GDA', 'Restaurou Brasão oficial vetorial de Pouso Alegre na carteirinha.');
  };

  // Platform Settings & Visual Identity (Setup)
  const updatePlatformSettings = (updates: Partial<PlatformSettings>) => {
    setPlatformSettings((prev) => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed saving settings to localStorage:', e);
      }
      return updated;
    });
    addLog('CONFIGURAR_LAYOUT', 'SISTEMA', 'Atualizou configurações da plataforma e identidade visual no Setup.');
  };

  const resetPlatformSettings = () => {
    setPlatformSettings(DEFAULT_PLATFORM_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    } catch (e) {
      console.warn('Failed removing settings from localStorage:', e);
    }
    addLog('CONFIGURAR_LAYOUT', 'SISTEMA', 'Restaurou padrões oficiais do Setup da plataforma.');
  };

  const uploadNavbarLogo = (dataUrl: string) => {
    updatePlatformSettings({ navbarLogoUrl: dataUrl });
    addLog('ATUALIZAR_BRASAO', 'SISTEMA', 'Carregou nova imagem de Brasão para a barra fixa superior da plataforma.');
  };

  const uploadDashboardBanner = (dataUrl: string) => {
    updatePlatformSettings({ dashboardBannerUrl: dataUrl });
    addLog('CONFIGURAR_LAYOUT', 'SISTEMA', 'Carregou nova imagem de alta resolução para o painel superior do Dashboard.');
  };

  // ================= BACKUP DA BASE DE DADOS (JSON) =================
  // Nome obrigatório: Backup_DataBase_DDMMAA_HHMMSS[h].json (ex: Backup_DataBase_240926_004115h.json)
  const exportDatabaseJson = (): { filename: string; json: string } => {
    const filename = formatBackupFilename('Backup_DataBase');
    const backup = {
      system: 'Praça de Esportes Pref. Alvarim Vieira Rios - Pouso Alegre/MG',
      modules: ['GDA', 'GID', 'POP'],
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser?.name,
      statistics: {
        totalUsers: users.length,
        totalCards: cards.length,
        totalReservations: reservations.length,
        totalLogs: logs.length,
        totalPopProcedures: popProcedures.length,
      },
      data: {
        users,
        cards,
        reservations,
        popProcedures,
        logs,
        layoutConfig,
      },
    };
    addLog('EXPORTAR_BACKUP_DADOS', 'BACKUP', `Exportou backup da base de dados: ${filename}`);
    return {
      filename,
      json: JSON.stringify(backup, null, 2),
    };
  };

  // ================= BACKUP COMPLETO DA ARQUITETURA E CÓDIGO-FONTE =================
  // Exporta toda a arquitetura, manifests, scripts, dependências, schemas e código-fonte
  const exportArchitectureJson = (): { filename: string; json: string } => {
    const filename = formatBackupFilename('Backup_Arquitetura_Completa');
    const dbData = exportDatabaseJson();

    const fullArchitecture: PlatformArchitectureBackup = {
      metadata: {
        systemName: 'Praça de Esportes Alvarim Vieira Rios - Plataforma GDA, GID & POP',
        version: '2.0.0-PROD',
        backupType: 'COMPLETE_PLATFORM_ARCHITECTURE_AND_SOURCE',
        generatedAt: new Date().toISOString(),
        generatedBy: currentUser?.name || 'Administrador',
        targetDeployments: ['Google Cloud Run', 'GitHub Pages', 'Vercel', 'Firebase Hosting', 'Node.js Local'],
      },
      configurationFiles: {
        'package.json': JSON.stringify({
          name: 'praca-esportes-pouso-alegre',
          version: '2.0.0',
          private: true,
          type: 'module',
          scripts: {
            dev: 'vite',
            build: 'tsc -b && vite build',
            preview: 'vite preview',
            lint: 'tsc --noEmit',
          },
          dependencies: {
            react: '^19.0.0',
            'react-dom': '^19.0.0',
            'lucide-react': '^1.16.0',
            tailwindcss: '^4.0.0',
            '@tailwindcss/vite': '^4.0.0',
          },
          devDependencies: {
            '@types/react': '^19.0.0',
            '@types/react-dom': '^19.0.0',
            typescript: '~5.7.0',
            vite: '^6.2.0',
          },
        }, null, 2),
        'metadata.json': JSON.stringify({
          name: 'Praça de Esportes Pouso Alegre - GDA, GID & POP',
          description: 'Sistema Integrado de Gestão de Documentos de Acesso (GDA), Informações Diversas (GID) e Procedimentos Operacionais (POP).',
          version: '2.0.0',
        }, null, 2),
      },
      sourceCodeTree: {
        'src/types/index.ts': 'Definição completa de tipos TypeScript (Cards, Reservas, POP, Layout, Logs, Usuários)',
        'src/context/AppContext.tsx': 'Gestão global de estado reativo, persistência, banco de dados local e backups',
        'src/data/initialData.ts': 'Carga inicial, registros do Plano Especial, POPs e configurações de layout',
        'src/components/gda/GdaModule.tsx': 'Módulo GDA de montagem, personalização e emissão de carteirinhas',
        'src/components/gda/PrintableCard.tsx': 'Renderizador fiel de carteirinha em cartolina (frente com foto física e verso em branco para anotação manual)',
        'src/components/gda/PrintSheetViewerModal.tsx': 'Visualizador interativo de folhas A4 Paisagem (4 carteirinhas por folha, paginação para famílias e corte)',
        'src/components/gid/GidModule.tsx': 'Módulo GID com Plano Especial (PCD / Idoso / TEA), Plano Familiar, Individual, Prefeitura, Bombeiros e Churrasqueiras',
        'src/components/gid/AnnualChurrasqueiraCalendar.tsx': 'Calendário Anual das Churrasqueiras com 12 meses em 3 linhas x 4 meses e marcações por cor',
        'src/components/pop/PopModule.tsx': 'Módulo POP com procedimentos da Secretaria, Piscinas, Exames, Churrasqueiras e Conduta',
        'src/components/backup/BackupManagerModal.tsx': 'Gerenciador de backup da base de dados e da arquitetura completa',
        'src/components/navigation/Navbar.tsx': 'Barra superior fixa com relógio digital em tempo real, data, dia da semana e navegação',
      },
      databaseSnapshot: {
        usersCount: users.length,
        cardsCount: cards.length,
        reservationsCount: reservations.length,
        logsCount: logs.length,
        proceduresCount: popProcedures.length,
        dataJsonString: dbData.json,
      },
      deploymentGuide: `# Manual de Implantação e Restauração da Plataforma
## 1. Requisitos
- Node.js 18+ ou 20+
- npm ou pnpm
- Navegador moderno com suporte a HTML5 / CSS Grid

## 2. Instalação e Execução
\`\`\`bash
git clone <repositorio>
cd praca-esportes-pouso-alegre
npm install
npm run dev
\`\`\`

## 3. Implantação em Produção
\`\`\`bash
npm run build
# Os arquivos estáticos estarão na pasta dist/
\`\`\`
`,
    };

    addLog('EXPORTAR_BACKUP_ARQUITETURA', 'BACKUP', `Exportou pacote completo de arquitetura e código-fonte: ${filename}`);
    return {
      filename,
      json: JSON.stringify(fullArchitecture, null, 2),
    };
  };

  // Disparadores de download direto no navegador
  const downloadDatabaseBackup = (): string => {
    const { filename, json } = exportDatabaseJson();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    recordGeneratedBackup({
      filename,
      type: 'DATA',
      typeLabel: 'Baixar Backup de Dados (.json)',
      timestamp: new Date().toISOString(),
      sizeBytes: blob.size,
      recordsCount: {
        cards: cards.length,
        reservations: reservations.length,
        popProcedures: popProcedures.length,
        logs: logs.length,
        users: users.length,
      },
    });

    return filename;
  };

  const downloadArchitectureBackup = (): string => {
    const { filename, json } = exportArchitectureJson();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    recordGeneratedBackup({
      filename,
      type: 'ARCHITECTURE',
      typeLabel: 'Baixar Pacote de Arquitetura & Código (.json)',
      timestamp: new Date().toISOString(),
      sizeBytes: blob.size,
      recordsCount: {
        cards: cards.length,
        reservations: reservations.length,
        popProcedures: popProcedures.length,
        logs: logs.length,
        users: users.length,
      },
    });

    return filename;
  };

  const downloadProjectZipBackup = async (onProgress?: (percent: number, message: string) => void): Promise<string> => {
    try {
      // Import dinâmico seguro para evitar quebra de compilação caso o arquivo não esteja no repositório
      const zipModule = await import('../utils/zipExporter');
      if (zipModule && typeof zipModule.downloadProjectZip === 'function') {
        const filename = await zipModule.downloadProjectZip(onProgress);
        recordGeneratedBackup({
          filename,
          type: 'ZIP',
          typeLabel: 'Baixar Código-Fonte Completo (.ZIP)',
          timestamp: new Date().toISOString(),
          recordsCount: {
            cards: cards.length,
            reservations: reservations.length,
            popProcedures: popProcedures.length,
            logs: logs.length,
            users: users.length,
          },
        });
        addLog('EXPORTAR_BACKUP_ZIP', 'SISTEMA', `Exportou código-fonte completo compactado em ZIP: ${filename}`);
        return filename;
      }
    } catch (err) {
      console.warn('zipExporter não encontrado ou falhou ao empacotar, usando fallback JSON:', err);
    }
    // Fallback seguro: gera o backup completo de arquitetura e código em formato JSON
    return downloadArchitectureBackup();
  };

  const importDatabaseJson = (jsonString: string, originalFilename?: string, fileSize?: number): boolean => {
    try {
      const data = JSON.parse(jsonString);
      // Se for formato simples ou formato aninhado
      const db = data.data || data;
      let countCards = cards.length;
      let countRes = reservations.length;
      let countPop = popProcedures.length;
      let countLogs = logs.length;

      if (db.cards && Array.isArray(db.cards)) {
        countCards = db.cards.length;
        setCards(
          db.cards.map((c: CardData) => ({
            ...c,
            grid1: generateDefaultPaymentGrid(),
            grid2: generateDefaultPaymentGrid(),
          }))
        );
      }
      if (db.reservations && Array.isArray(db.reservations)) {
        countRes = db.reservations.length;
        setReservations(db.reservations);
      }
      if (db.popProcedures && Array.isArray(db.popProcedures)) {
        countPop = db.popProcedures.length;
        setPopProcedures(db.popProcedures);
      }
      if (db.logs && Array.isArray(db.logs)) {
        countLogs = db.logs.length;
        setLogs(db.logs);
      }
      if (db.layoutConfig) {
        setLayoutConfig(db.layoutConfig);
      }

      const inferredFilename = originalFilename || data.metadata?.filename || data.filename || 'Backup_DataBase_Restaurado.json';
      const inferredSize = fileSize || new Blob([jsonString]).size;

      recordRestoredBackup({
        filename: inferredFilename,
        timestamp: new Date().toISOString(),
        sizeBytes: inferredSize,
        success: true,
        restoredItemsCount: {
          cards: countCards,
          reservations: countRes,
          popProcedures: countPop,
          logs: countLogs,
        },
      });

      addLog('RESTAURAR_BACKUP', 'BACKUP', `Base de dados restaurada com sucesso a partir de "${inferredFilename}".`);
      return true;
    } catch (e) {
      console.error('Falha ao importar backup:', e);
      return false;
    }
  };

  const resetAllToFactoryDefaults = () => {
    setCards(INITIAL_CARDS);
    setReservations(INITIAL_RESERVATIONS);
    setPopProcedures(INITIAL_POP_PROCEDURES);
    setLogs(INITIAL_LOGS);
    setUsers(INITIAL_USERS);
    setLayoutConfig(DEFAULT_LAYOUT_CONFIG);
    localStorage.clear();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        login,
        logout,
        switchUser,
        updateUserPassword,

        currentView,
        setCurrentView,
        gidActiveTab,
        setGidActiveTab,
        gidSubTab,
        setGidSubTab,
        gidSearchTerm,
        setGidSearchTerm,

        selectedCardForGda,
        setSelectedCardForGda,
        openCardInGda,

        fichaModalCard,
        fichaModalMode,
        isFichaModalOpen,
        openFichaModal,
        closeFichaModal,

        cards,
        addCard,
        updateCard,
        deleteCard,
        incrementPrintedCount,
        generateNextControlNumber,
        addFamilyMember,

        reservations,
        addReservation,
        updateReservation,
        deleteReservation,

        popProcedures,
        addPopProcedure,
        updatePopProcedure,
        deletePopProcedure,
        togglePinPop,
        reorderPopProcedures,

        logs,
        addLog,
        clearLogs,

        layoutConfig,
        updateLayoutConfig,
        resetLayoutConfig,
        updateCoatOfArms,
        resetCoatOfArms,

        platformSettings,
        updatePlatformSettings,
        resetPlatformSettings,
        uploadNavbarLogo,
        uploadDashboardBanner,

        exportDatabaseJson,
        exportArchitectureJson,
        downloadDatabaseBackup,
        downloadArchitectureBackup,
        downloadProjectZipBackup,
        importDatabaseJson,
        resetAllToFactoryDefaults,
        lastGeneratedBackup,
        lastRestoredBackup,
        recordGeneratedBackup,
        recordRestoredBackup,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
