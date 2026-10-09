import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { CardData, BarbecueReservation, AuditLog } from '../types';

/**
 * Salva ou atualiza uma carteirinha no Cloud Firestore
 */
export async function syncCardToFirestore(card: CardData): Promise<void> {
  if (!db) return;
  try {
    const cardRef = doc(db, 'cards', card.id);
    await setDoc(cardRef, card, { merge: true });
  } catch (error) {
    console.warn('[Firestore] Falha ao sincronizar carteirinha na nuvem:', error);
  }
}

/**
 * Remove uma carteirinha do Cloud Firestore
 */
export async function deleteCardFromFirestore(cardId: string): Promise<void> {
  if (!db) return;
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
  if (!db) return;
  try {
    const resRef = doc(db, 'reservations', reservation.id);
    await setDoc(resRef, reservation, { merge: true });
  } catch (error) {
    console.warn('[Firestore] Falha ao sincronizar reserva na nuvem:', error);
  }
}

/**
 * Salva log de auditoria no Cloud Firestore
 */
export async function syncLogToFirestore(log: AuditLog): Promise<void> {
  if (!db) return;
  try {
    const logRef = doc(db, 'auditLogs', log.id);
    await setDoc(logRef, log, { merge: true });
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
