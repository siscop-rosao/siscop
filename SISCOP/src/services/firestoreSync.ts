import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  CardData,
  BarbecueReservation,
  AuditLog,
  PopProcedure,
  User,
  PlatformSettings,
  CardLayoutConfig,
} from '../types';

/**
 * Remove recursivamente todas as propriedades com valor `undefined`
 * para evitar que o Firebase Firestore rejeite a gravação com o erro:
 * "Unsupported field value: undefined"
 */
export function sanitizeForFirestore<T>(data: T): any {
  if (data === undefined || data === null) {
    return null;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item));
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(data as Record<string, any>)) {
      if (val !== undefined) {
        cleaned[key] = sanitizeForFirestore(val);
      }
    }
    return cleaned;
  }
  return data;
}

/**
 * Salva ou atualiza uma carteirinha no Cloud Firestore
 */
export async function syncCardToFirestore(card: CardData): Promise<void> {
  if (!db || !card || !card.id) return;
  try {
    const cardRef = doc(db, 'cards', card.id);
    const sanitized = sanitizeForFirestore(card);
    await setDoc(cardRef, sanitized, { merge: true });
  } catch (error) {
    console.warn('[Firestore] Falha ao sincronizar carteirinha na nuvem:', error);
  }
}

/**
 * Sincroniza em lote uma lista inteira de carteirinhas para a nuvem
 */
export async function syncAllCardsToFirestore(cards: CardData[]): Promise<void> {
  if (!db || !Array.isArray(cards)) return;
  try {
    for (const card of cards) {
      if (card && card.id) {
        await syncCardToFirestore(card);
      }
    }
    console.log(`[Firestore] Sincronização em lote concluída: ${cards.length} carteirinhas.`);
  } catch (error) {
    console.warn('[Firestore] Falha na sincronização em lote de carteirinhas:', error);
  }
}

/**
 * Remove uma carteirinha do Cloud Firestore
 */
export async function deleteCardFromFirestore(cardId: string): Promise<void> {
  if (!db || !cardId) return;
  try {
    await deleteDoc(doc(db, 'cards', cardId));
  } catch (error) {
    console.warn('[Firestore] Falha ao excluir carteirinha na nuvem:', error);
  }
}

/**
 * Salva ou atualiza uma reserva de churrasqueira no Cloud Firestore
 */
export async function syncReservationToFirestore(reservation: BarbecueReservation): Promise<void> {
  if (!db || !reservation || !reservation.id) return;
  try {
    const resRef = doc(db, 'reservations', reservation.id);
    const sanitized = sanitizeForFirestore(reservation);
    await setDoc(resRef, sanitized, { merge: true });
  } catch (error) {
    console.warn('[Firestore] Falha ao sincronizar reserva na nuvem:', error);
  }
}

/**
 * Sincroniza todas as reservas para o Firestore
 */
export async function syncAllReservationsToFirestore(reservations: BarbecueReservation[]): Promise<void> {
  if (!db || !Array.isArray(reservations)) return;
  try {
    for (const res of reservations) {
      if (res && res.id) {
        await syncReservationToFirestore(res);
      }
    }
  } catch (error) {
    console.warn('[Firestore] Falha ao sincronizar reservas em lote:', error);
  }
}

/**
 * Salva log de auditoria no Cloud Firestore
 */
export async function syncLogToFirestore(log: AuditLog): Promise<void> {
  if (!db || !log || !log.id) return;
  try {
    const logRef = doc(db, 'auditLogs', log.id);
    const sanitized = sanitizeForFirestore(log);
    await setDoc(logRef, sanitized, { merge: true });
  } catch (error) {
    console.warn('[Firestore] Falha ao registrar log na nuvem:', error);
  }
}

/**
 * Salva ou atualiza um usuário / operador no Cloud Firestore
 */
export async function syncUserToFirestore(user: User): Promise<void> {
  if (!db || !user || !user.id) return;
  try {
    const userRef = doc(db, 'users', user.id);
    const sanitized = sanitizeForFirestore(user);
    await setDoc(userRef, sanitized, { merge: true });
  } catch (error) {
    console.warn('[Firestore] Falha ao sincronizar usuário no Firestore:', error);
  }
}

/**
 * Sincroniza todos os usuários para o Firestore
 */
export async function syncAllUsersToFirestore(users: User[]): Promise<void> {
  if (!db || !Array.isArray(users)) return;
  try {
    for (const u of users) {
      if (u && u.id) {
        await syncUserToFirestore(u);
      }
    }
  } catch (error) {
    console.warn('[Firestore] Falha ao sincronizar usuários em lote:', error);
  }
}

/**
 * Remove um usuário do Cloud Firestore
 */
export async function deleteUserFromFirestore(userId: string): Promise<void> {
  if (!db || !userId) return;
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    console.warn('[Firestore] Falha ao excluir usuário no Firestore:', error);
  }
}

/**
 * Salva ou atualiza as configurações da plataforma (Brasão, Banner, Títulos) no Firestore
 */
export async function syncPlatformSettingsToFirestore(settings: PlatformSettings): Promise<void> {
  if (!db || !settings) return;
  try {
    const settingsRef = doc(db, 'settings', 'global');
    const sanitized = sanitizeForFirestore(settings);
    await setDoc(settingsRef, sanitized, { merge: true });
  } catch (error) {
    console.warn('[Firestore] Falha ao sincronizar configurações da plataforma no Firestore:', error);
  }
}

/**
 * Salva ou atualiza o layout da carteirinha no Firestore
 */
export async function syncLayoutConfigToFirestore(layout: CardLayoutConfig): Promise<void> {
  if (!db || !layout) return;
  try {
    const layoutRef = doc(db, 'layoutConfig', 'global');
    const sanitized = sanitizeForFirestore(layout);
    await setDoc(layoutRef, sanitized, { merge: true });
  } catch (error) {
    console.warn('[Firestore] Falha ao sincronizar layout de impressão no Firestore:', error);
  }
}

/**
 * Inscreve um ouvinte em tempo real para sincronização de carteirinhas
 */
export function subscribeToCards(onUpdate: (cards: CardData[]) => void): () => void {
  if (!db) return () => {};
  try {
    const cardsCol = collection(db, 'cards');
    return onSnapshot(
      cardsCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const cardsList: CardData[] = [];
          snapshot.forEach((d) => {
            cardsList.push(d.data() as CardData);
          });
          onUpdate(cardsList);
        }
      },
      (err) => {
        console.warn('[Firestore] Listener de carteirinhas offline/erro:', err);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Falha ao registrar listener de carteirinhas:', err);
    return () => {};
  }
}

/**
 * Inscreve um ouvinte em tempo real para reservas de churrasqueira
 */
export function subscribeToReservations(onUpdate: (res: BarbecueReservation[]) => void): () => void {
  if (!db) return () => {};
  try {
    const resCol = collection(db, 'reservations');
    return onSnapshot(
      resCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: BarbecueReservation[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as BarbecueReservation);
          });
          onUpdate(list);
        }
      },
      (err) => {
        console.warn('[Firestore] Listener de reservas offline/erro:', err);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Falha ao registrar listener de reservas:', err);
    return () => {};
  }
}

/**
 * Inscreve um ouvinte em tempo real para usuários do sistema
 */
export function subscribeToUsers(onUpdate: (users: User[]) => void): () => void {
  if (!db) return () => {};
  try {
    const usersCol = collection(db, 'users');
    return onSnapshot(
      usersCol,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: User[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as User);
          });
          onUpdate(list);
        }
      },
      (err) => {
        console.warn('[Firestore] Listener de usuários offline/erro:', err);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Falha ao registrar listener de usuários:', err);
    return () => {};
  }
}

/**
 * Inscreve um ouvinte em tempo real para configurações da plataforma (Brasão, Banner, Títulos)
 */
export function subscribeToPlatformSettings(onUpdate: (settings: PlatformSettings) => void): () => void {
  if (!db) return () => {};
  try {
    const settingsDoc = doc(db, 'settings', 'global');
    return onSnapshot(
      settingsDoc,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data() as PlatformSettings);
        }
      },
      (err) => {
        console.warn('[Firestore] Listener de configurações offline/erro:', err);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Falha ao registrar listener de configurações:', err);
    return () => {};
  }
}

/**
 * Inscreve um ouvinte em tempo real para layout da carteirinha
 */
export function subscribeToLayoutConfig(onUpdate: (layout: CardLayoutConfig) => void): () => void {
  if (!db) return () => {};
  try {
    const layoutDoc = doc(db, 'layoutConfig', 'global');
    return onSnapshot(
      layoutDoc,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate(snapshot.data() as CardLayoutConfig);
        }
      },
      (err) => {
        console.warn('[Firestore] Listener de layout offline/erro:', err);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Falha ao registrar listener de layout:', err);
    return () => {};
  }
}

/**
 * Força a sincronização integral de todos os dados locais para o Firestore
 * (Carteirinhas, Usuários, Reservas, Configurações e Layout de Impressão)
 */
export async function syncFullDatabaseToFirestore(params: {
  cards: CardData[];
  users: User[];
  reservations: BarbecueReservation[];
  settings: PlatformSettings;
  layoutConfig: CardLayoutConfig;
}): Promise<{ success: boolean; count: number; error?: string }> {
  if (!db) {
    return { success: false, count: 0, error: 'Firebase Firestore não inicializado.' };
  }

  try {
    let syncedCount = 0;

    // 1. Sincroniza todas as carteirinhas
    for (const card of params.cards) {
      if (card && card.id) {
        await syncCardToFirestore(card);
        syncedCount++;
      }
    }

    // 2. Sincroniza todos os usuários
    for (const user of params.users) {
      if (user && user.id) {
        await syncUserToFirestore(user);
        syncedCount++;
      }
    }

    // 3. Sincroniza todas as reservas
    for (const res of params.reservations) {
      if (res && res.id) {
        await syncReservationToFirestore(res);
        syncedCount++;
      }
    }

    // 4. Sincroniza configurações e layout
    if (params.settings) {
      await syncPlatformSettingsToFirestore(params.settings);
      syncedCount++;
    }
    if (params.layoutConfig) {
      await syncLayoutConfigToFirestore(params.layoutConfig);
      syncedCount++;
    }

    // 5. Registra ping de integridade
    const pingDoc = doc(db, 'systemStatus', 'lastSync');
    await setDoc(pingDoc, {
      syncedAt: new Date().toISOString(),
      totalRecords: syncedCount,
    }, { merge: true });

    return { success: true, count: syncedCount };
  } catch (err: any) {
    console.error('[Firestore] Erro na sincronização integral:', err);
    return {
      success: false,
      count: 0,
      error: err?.message || 'Falha ao sincronizar com o banco de dados.',
    };
  }
}
