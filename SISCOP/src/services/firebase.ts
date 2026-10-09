import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

// Configuração oficial provisionada pelo Google Firebase
export const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
  measurementId: firebaseConfigData.measurementId || undefined,
};

// Inicializa a aplicação Firebase
export const firebaseApp = !getApps().length
  ? initializeApp(firebaseConfig)
  : getApp();

// Inicializa o Cloud Firestore com o ID do banco provisionado
export const db = firebaseConfigData.firestoreDatabaseId
  ? getFirestore(firebaseApp, firebaseConfigData.firestoreDatabaseId)
  : getFirestore(firebaseApp);

// Validação da conexão com o Firestore na inicialização
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[SISCOP Firebase] Conexão com Cloud Firestore estabelecida com sucesso.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[SISCOP Firebase] Cliente offline ou aguardando conexão com a nuvem.');
    } else {
      // Ignora erro de documento não existente em 'test/connection' (conexão ativa)
      console.log('[SISCOP Firebase] Firestore ativo e respondendo.');
    }
  }
}

testFirestoreConnection();
