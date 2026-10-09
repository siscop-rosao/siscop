import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { CardData, BarbecueReservation, AuditLog, PopProcedure } from '../types';

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
