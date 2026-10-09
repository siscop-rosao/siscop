export type UserRole = 'admin' | 'operador' | 'supervisor' | 'diretor';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password?: string;
  cargo: string;
  matriculaOrCpf?: string;
  orgaoOrEmpresa?: string;
  active: boolean;
  avatarColor: string;
  lastLogin?: string;
  failedLoginAttempts?: number;
  isLocked?: boolean;
  lockedAt?: string;
}

export interface LoginResult {
  success: boolean;
  isLocked?: boolean;
  remainingAttempts?: number;
  message?: string;
}

export type ModuleType = 'AUTH' | 'GDA' | 'GID_USUARIOS' | 'GID_CHURRASQUEIRA' | 'POP' | 'BACKUP' | 'SISTEMA';

export type ActionType = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'EMITIR_CARTEIRINHA' 
  | 'IMPRIMIR_CARTEIRINHA'
  | 'EDITAR_CARTEIRINHA' 
  | 'EXCLUIR_CARTEIRINHA' 
  | 'CRIAR_USUARIO_GID' 
  | 'ATUALIZAR_USUARIO_GID' 
  | 'CONSULTAR_GID'
  | 'EXCLUIR_USUARIO_GID' 
  | 'SALVAR_BLOCO_NOTAS'
  | 'RESERVA_CHURRASQUEIRA' 
  | 'ATUALIZAR_RESERVA' 
  | 'CANCELAR_RESERVA' 
  | 'CONFIGURAR_LAYOUT'
  | 'ATUALIZAR_BRASAO'
  | 'CRIAR_POP'
  | 'ATUALIZAR_POP'
  | 'EXCLUIR_POP'
  | 'EXPORTAR_BACKUP_DADOS'
  | 'EXPORTAR_BACKUP_ARQUITETURA'
  | 'EXPORTAR_BACKUP_ZIP'
  | 'RESTAURAR_BACKUP'
  | 'CRIAR_USUARIO_SISTEMA'
  | 'ATUALIZAR_USUARIO_SISTEMA'
  | 'EXCLUIR_USUARIO_SISTEMA'
  | 'DESTRAVAR_USUARIO_SISTEMA'
  | 'BLOQUEIO_TENTATIVAS_LOGIN'
  | 'MUDAR_SENHA_USUARIO';

export interface AuditLog {
  id: string;
  timestamp: string; // ISO string
  userId: string;
  userName: string;
  userRole: string;
  action: ActionType;
  module: ModuleType;
  details: string;
  targetId?: string;
  targetName?: string;
}

export type PlanType = 'INDIVIDUAL' | 'FAMILIAR' | 'ESPECIAL';
export type CategoryType = 'PREFEITURA' | 'BOMBEIROS' | 'PLANO_INDIVIDUAL' | 'PLANO_FAMILIAR' | 'PLANO_ESPECIAL';

export interface CalculationRecord {
  id: string;
  timestamp: string; // ISO string
  associateId?: string;
  associateName?: string;
  startDate: string;
  endDate: string;
  totalMonths: number;
  monthlyRateSelected: number;
  subtotalMensalidades: number;
  subtotalInscricao: number;
  subtotalCarteirinha: number;
  qtyCarteirinha?: number;
  subtotalSegundaCarteirinha: number;
  qtySegundaCarteirinha?: number;
  totalGeral: number;
  summary: string;
}

export interface MonthPayment {
  month: string; // "JAN", "FEV", etc.
  datePaid: string;
  signature: string;
  paymentMethod?: 'Pix' | 'Boleto' | 'Lotérica' | string;
  payingBank?: string; // e.g. "Banco do Brasil - 001"
  payingBankIcon?: string; // Custom logo url or icon
  referenceId?: string; // Campo livre para referência de comprovante / identificador
}

export interface CardData {
  id: string;
  controlNumber: string; // e.g. "IND-2026-0102", "FAM-2026-0042-01", "ESP-2026-0010"
  planType: PlanType;
  category: CategoryType;
  familyHeadId?: string; // If dependent, links to titular ID
  isTitular: boolean;
  familyName?: string;
  name: string;
  birthDate: string; // DD/MM/AAAA
  rgOrCpf?: string;
  photoUrl?: string; // (Mantido para compatibilidade, foto física colada no quadro)
  directorLabel?: string; // default "Diretor"
  directorName?: string;
  physicalArchiveLocation?: string; // Código da pasta física (ex: 10-C = Armário 10, Gaveta C)
  
  // Specific for Plano Especial
  isSpecialExempt?: boolean; // Excluído de pagamento (Isenção integral)
  specialCondition?: string; // "PCD", "Idoso (60+)", "Autista (TEA)", "Síndrome de Down", "Outro"
  medicalReportInfo?: string; // Número do laudo / CIPTEA
  
  // Back grid configuration
  year1: string; // e.g., "2026"
  year2: string; // e.g., "2027"
  grid1: MonthPayment[];
  grid2: MonthPayment[];
  
  notesHtml?: string; // Rich text Observações
  internalInfoHtml?: string; // Rich text Informações Internas
  includeNotesInPrint?: boolean; // Checkbox para impressão de Observações
  includeInternalInfoInPrint?: boolean; // Checkbox para impressão de Informações Internas
  
  emissionDate: string;
  printedCount: number;
  phone?: string;
  address?: string;
  status: 'ATIVO' | 'SUSPENSO' | 'INATIVO';
  medicalExamValidUntil?: string; // Exame médico para piscina
  createdAt: string;
  updatedAt: string;
  lastEditedBy?: string;
  calculationHistory?: CalculationRecord[]; // Histórico de cálculos/acertos realizados
}

export interface BarbecueReservation {
  id: string;
  kioskNumber: number; // 1 a 6
  date: string; // YYYY-MM-DD
  timeSlot: 'MANHA_TARDE' | 'INTEGRAL' | 'NOITE';
  responsibleName: string;
  responsiblePhone: string;
  responsiblePlanNumber?: string;
  responsibleCategory: CategoryType;
  participantsList: string[]; // Nomes dos convidados
  observations: string; // Campo dedicado para observações da reserva
  status: 'CONFIRMADA' | 'PENDENTE' | 'CANCELADA' | 'CONCLUIDA';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CardLayoutConfig {
  foldOrientation: 'horizontal' | 'vertical'; // side-by-side or top-bottom
  cardWidthMm: number; // default ~100mm
  cardHeightMm: number; // default ~70mm
  showBorder: boolean;
  borderColor: string;
  borderWidth: number;
  fontFamily: 'Inter' | 'Courier' | 'Serif';
  fontSizeBase: number;
  showCoatOfArms: boolean;
  coatOfArmsSize: number; // in px
  customCoatOfArmsUrl?: string; // Custom uploaded coat of arms base64 or URL
  customHeaderTitle: string;
  customHeaderSubtitle: string;
  directorLabel: string;
  showPhotoBox: boolean;
  photoBorderDashed: boolean;
  showCutGuides: boolean;
  showFoldGuideline: boolean;
  cardBackground: string; // default "#ffffff"
  rotateVerso180: boolean; // flip back 180 degrees if required by specific printer/folding feed
}

// Configurações Globais da Plataforma e Identidade Visual (Setup)
export interface PlatformSettings {
  navbarLogoUrl?: string; // Imagem customizada do brasão para a barra fixa superior
  dashboardBannerUrl?: string; // Imagem customizada de grande resolução para o topo do Dashboard
  dashboardTitle: string; // "SISCOP - Sistema de Controle Operacional"
  dashboardSubtitle: string; // "Plataforma informatizada para emissão de carteirinhas e gestão de processos"
  systemName: string; // "SISCOP"
  subsystemName: string; // "Sistema de Controle Operacional"
  unitName: string; // "Praça de Esportes Pref. Alvarim Vieira Rios"
  citySealName: string; // "Prefeitura Municipal de Pouso Alegre"
}

// Procedimento Operacional Padrão (POP)
export type PopCategory = 'SECRETARIA' | 'PISCINAS' | 'CARTEIRINHAS' | 'PLANO_ESPECIAL' | 'CHURRASQUEIRA' | 'CONDUTA';

export interface PopPricingTables {
  eventsTable: {
    event: string;
    familiar: string;
    individual: string;
  }[];
  familyQuantityTable: {
    familyCount: string;
    firstPaymentValue: string;
  }[];
  infoNotes: {
    label: string;
    value: string;
  }[];
}

export interface PopProcedure {
  id: string;
  code: string; // Ex: "POP-SEC-01", "POP-ESP-01"
  title: string;
  category: PopCategory;
  objective: string;
  targetAudience: string; // Público Alvo
  responsible: string; // Responsável pela execução
  prerequisites?: string[]; // Pré-requisitos / Documentos
  steps: string[]; // Passo a passo operacional detalhado
  importantNotes?: string; // Atenção / Observações críticas
  legalBasis?: string; // Base legal / Lei Municipal
  isPinned?: boolean; // Fixado com PIN
  orderIndex?: number; // Ordem de arrasto e posicionamento
  pricingTables?: PopPricingTables; // Tabelas de taxas e valores editáveis
  updatedAt: string;
  createdBy: string;
}

// Full Platform Architecture Backup Structure
export interface PlatformArchitectureBackup {
  metadata: {
    systemName: string;
    version: string;
    backupType: 'COMPLETE_PLATFORM_ARCHITECTURE_AND_SOURCE';
    generatedAt: string;
    generatedBy: string;
    targetDeployments: string[]; // ["GitHub", "Vercel", "Firebase"]
  };
  configurationFiles: Record<string, string>;
  sourceCodeTree: Record<string, string>;
  databaseSnapshot: {
    usersCount: number;
    cardsCount: number;
    reservationsCount: number;
    logsCount: number;
    proceduresCount: number;
    dataJsonString: string;
  };
  deploymentGuide: string;
}

// Registro informativo do último arquivo de backup gerado
export interface BackupGenerationRecord {
  filename: string;
  type: 'DATA' | 'ARCHITECTURE' | 'ZIP';
  typeLabel: string;
  timestamp: string;
  sizeBytes?: number;
  recordsCount?: {
    cards: number;
    reservations: number;
    popProcedures: number;
    logs: number;
    users: number;
  };
}

// Registro informativo do último arquivo de backup restaurado
export interface BackupRestoreRecord {
  filename: string;
  timestamp: string;
  sizeBytes?: number;
  success: boolean;
  restoredItemsCount?: {
    cards: number;
    reservations: number;
    popProcedures: number;
    logs: number;
  };
}
