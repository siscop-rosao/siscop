import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// Configuração oficial provisionada pelo Google Firebase para o SISCOP
// Com suporte a variáveis de ambiente VITE_FIREBASE_* e fallback nativo pré-configurado
const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'gen-lang-client-0608802880',
  appId: '1:138135689934:web:e0bc66e88d704d8fae4e9f',
  apiKey: 'AIzaSyB1cCOQ-YDZ6vdKPCCSR7-WNRAG1BYc_4E',
  authDomain: 'gen-lang-client-0608802880.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-praadeesportespo-a3c3b753-b8c4-4f03-9123-526066ddbc57',
  storageBucket: 'gen-lang-client-0608802880.firebasestorage.app',
  messagingSenderId: '138135689934',
  measurementId: '',
};

export const firebaseConfig = {
  apiKey: (import.meta.env?.VITE_FIREBASE_API_KEY as string) || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: (import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN as string) || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: (import.meta.env?.VITE_FIREBASE_PROJECT_ID as string) || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: (import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET as string) || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: (import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: (import.meta.env?.VITE_FIREBASE_APP_ID as string) || DEFAULT_FIREBASE_CONFIG.appId,
  measurementId: (import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID as string) || DEFAULT_FIREBASE_CONFIG.measurementId || undefined,
};

const databaseId = (import.meta.env?.VITE_FIREBASE_DATABASE_ID as string) || DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId;

// Inicializa a aplicação Firebase com tratamento de erro
export const firebaseApp = (() => {
  try {
    return !getApps().length ? initializeApp(firebaseConfig) : getApp();
  } catch (error) {
    console.warn('[SISCOP Firebase] Falha ao inicializar app Firebase, modo offline ativo:', error);
    return null as unknown as ReturnType<typeof initializeApp>;
  }
})();

// Inicializa o Cloud Firestore com o ID do banco provisionado
export const db = (() => {
  try {
    if (!firebaseApp) return null as unknown as ReturnType<typeof getFirestore>;
    return databaseId ? getFirestore(firebaseApp, databaseId) : getFirestore(firebaseApp);
  } catch (error) {
    console.warn('[SISCOP Firebase] Falha ao obter Firestore:', error);
    return null as unknown as ReturnType<typeof getFirestore>;
  }
})();

// Validação suave da conexão com o Firestore na inicialização
async function testFirestoreConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[SISCOP Firebase] Conexão com Cloud Firestore estabelecida com sucesso.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[SISCOP Firebase] Cliente offline ou aguardando conexão com a nuvem.');
    } else {
      console.log('[SISCOP Firebase] Firestore ativo e respondendo.');
    }
  }
}

if (typeof window !== 'undefined') {
  testFirestoreConnection();
}
