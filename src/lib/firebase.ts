import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

console.log("Firebase Init - DB ID:", firebaseConfig.firestoreDatabaseId);

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Error Handling Infrastructure
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    message: "IMPORTANT: Firestore Permission Error. Potential causes: 1. Rules not deployed to the correct database ID. 2. App Check is enabled. 3. Mismatch in project configuration.",
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    projectInfo: {
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId,
    },
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    }
  };
  console.group("🔥 Detailed Firestore Error Report");
  console.error("Context:", errInfo.message);
  console.error("Config Database ID:", firebaseConfig.firestoreDatabaseId);
  console.error("Current User:", auth.currentUser?.email || "Not logged in");
  console.error("Full Details:", JSON.stringify(errInfo, null, 2));
  console.groupEnd();
}

// Simple connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase Connection Check Passed");
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'test/connection');
  }
}

testConnection();
