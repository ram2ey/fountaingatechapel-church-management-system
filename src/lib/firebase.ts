import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  getDocFromServer,
  collection as sdkCollection,
  doc as sdkDoc,
  query as sdkQuery,
  where as sdkWhere,
  orderBy as sdkOrderBy,
  onSnapshot as sdkOnSnapshot,
  getDocs as sdkGetDocs,
  getDoc as sdkGetDoc,
  setDoc as sdkSetDoc,
  addDoc as sdkAddDoc,
  updateDoc as sdkUpdateDoc,
  deleteDoc as sdkDeleteDoc,
  serverTimestamp as sdkServerTimestamp,
  arrayUnion as sdkArrayUnion,
  arrayRemove as sdkArrayRemove
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
// Using firestoreDatabaseId from config and enabling long polling for better connectivity in this environment
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, (firebaseConfig as any).firestoreDatabaseId || '(default)');
export const auth = getAuth(app);

// Mock Database implementation for local simulation
export const isMockActive = () => {
  return localStorage.getItem('faithconnect_mock_active') === 'true';
};

const getLocalCollection = (colName: string): any[] => {
  const data = localStorage.getItem(`fc_mock_col_${colName}`);
  return data ? JSON.parse(data) : [];
};

const saveLocalCollection = (colName: string, items: any[]) => {
  localStorage.setItem(`fc_mock_col_${colName}`, JSON.stringify(items));
  triggerListeners(colName);
};

interface MockListener {
  id: string;
  colName: string;
  docId?: string;
  callback: (snapshot: any) => void;
  queryRef?: any;
}

const listeners: MockListener[] = [];

const triggerListeners = (colName: string) => {
  listeners.forEach(listener => {
    if (listener.colName === colName) {
      if (listener.docId) {
        const items = getLocalCollection(colName);
        const item = items.find(i => i.id === listener.docId) || null;
        listener.callback({
          exists: () => !!item,
          id: listener.docId,
          data: () => reviveTimestamps(item)
        });
      } else {
        const items = getLocalCollection(colName);
        let filtered = [...items];
        
        if (listener.queryRef && listener.queryRef.constraints) {
          listener.queryRef.constraints.forEach((c: any) => {
            if (c.type === 'where') {
              const { field, op, value } = c;
              filtered = filtered.filter(item => {
                const itemVal = item[field];
                if (op === '==') return itemVal === value;
                if (op === '!=') return itemVal !== value;
                if (op === 'array-contains') return Array.isArray(itemVal) && itemVal.includes(value);
                return true;
              });
            } else if (c.type === 'orderBy') {
              const { field, direction } = c;
              filtered.sort((a, b) => {
                const valA = a[field];
                const valB = b[field];
                if (valA === undefined || valB === undefined) return 0;
                let comparison = 0;
                
                if (valA && typeof valA === 'object' && valA.seconds !== undefined) {
                  comparison = valA.seconds - (valB?.seconds || 0);
                } else if (valA instanceof Date) {
                  comparison = valA.getTime() - new Date(valB).getTime();
                } else {
                  if (valA < valB) comparison = -1;
                  if (valA > valB) comparison = 1;
                }
                return direction === 'desc' ? -comparison : comparison;
              });
            }
          });
        }
        
        const revivedDocs = reviveTimestamps(filtered);
        listener.callback({
          docs: revivedDocs.map(item => ({
            id: item.id,
            data: () => item
          })),
          empty: revivedDocs.length === 0,
          size: revivedDocs.length,
          forEach: (cb: any) => {
            revivedDocs.forEach((item, index) => {
              cb({
                id: item.id,
                data: () => item
              }, index);
            });
          }
        });
      }
    }
  });
};

const reviveTimestamps = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(reviveTimestamps);
  }
  if (typeof obj === 'object') {
    if (obj.toDate && typeof obj.toDate === 'function') return obj;
    
    if (obj.seconds !== undefined) {
      return {
        ...obj,
        toDate: function() { return new Date(obj.seconds * 1000); }
      };
    }
    
    const revived: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if ((key === 'createdAt' || key === 'timestamp' || key === 'date') && val) {
          if (typeof val === 'string') {
            revived[key] = {
              seconds: Math.floor(new Date(val).getTime() / 1000),
              toDate: function() { return new Date(val); }
            };
          } else if (typeof val === 'object' && val.seconds !== undefined) {
            revived[key] = {
              ...val,
              toDate: function() { return new Date(val.seconds * 1000); }
            };
          } else {
            revived[key] = val;
          }
        } else {
          revived[key] = reviveTimestamps(val);
        }
      }
    }
    return revived;
  }
  return obj;
};

// Wrapped Firestore functions
export const collection = (firestore: any, path: string, ...pathSegments: string[]) => {
  if (isMockActive()) {
    return { type: 'collection', path: [path, ...pathSegments].join('/') };
  }
  return sdkCollection(firestore, path, ...pathSegments);
};

export const doc = (parent: any, path?: string, ...pathSegments: string[]) => {
  if (isMockActive()) {
    if (parent.type === 'collection') {
      return { type: 'doc', path: parent.path + '/' + path };
    }
    return { type: 'doc', path: [parent, path, ...pathSegments].filter(Boolean).join('/') };
  }
  return sdkDoc(parent, path!, ...pathSegments);
};

export const query = (queryRef: any, ...queryConstraints: any[]) => {
  if (isMockActive()) {
    return {
      type: 'query',
      ref: queryRef,
      constraints: queryConstraints
    };
  }
  return sdkQuery(queryRef, ...queryConstraints);
};

export const where = (fieldPath: string, opStr: any, value: any) => {
  if (isMockActive()) {
    return { type: 'where', field: fieldPath, op: opStr, value };
  }
  return sdkWhere(fieldPath, opStr, value);
};

export const orderBy = (fieldPath: string, directionStr?: 'asc' | 'desc') => {
  if (isMockActive()) {
    return { type: 'orderBy', field: fieldPath, direction: directionStr || 'asc' };
  }
  return sdkOrderBy(fieldPath, directionStr);
};

export const getDoc = async (docRef: any) => {
  if (isMockActive()) {
    const parts = docRef.path.split('/');
    const colName = parts[0];
    const docId = parts.slice(1).join('/');
    const items = getLocalCollection(colName);
    const item = items.find(i => i.id === docId);
    const revived = reviveTimestamps(item);
    return {
      exists: () => !!item,
      id: docId,
      data: () => revived
    };
  }
  return sdkGetDoc(docRef);
};

export const getDocs = async (queryRef: any) => {
  if (isMockActive()) {
    const colRef = queryRef.type === 'query' ? queryRef.ref : queryRef;
    const parts = colRef.path.split('/');
    const colName = parts[0];
    const items = getLocalCollection(colName);
    let filtered = [...items];
    
    if (queryRef.type === 'query' && queryRef.constraints) {
      queryRef.constraints.forEach((c: any) => {
        if (c.type === 'where') {
          const { field, op, value } = c;
          filtered = filtered.filter(item => {
            const itemVal = item[field];
            if (op === '==') return itemVal === value;
            if (op === '!=') return itemVal !== value;
            if (op === 'array-contains') return Array.isArray(itemVal) && itemVal.includes(value);
            return true;
          });
        } else if (c.type === 'orderBy') {
          const { field, direction } = c;
          filtered.sort((a, b) => {
            const valA = a[field];
            const valB = b[field];
            if (valA === undefined || valB === undefined) return 0;
            let comparison = 0;
            if (valA < valB) comparison = -1;
            if (valA > valB) comparison = 1;
            return direction === 'desc' ? -comparison : comparison;
          });
        }
      });
    }
    
    const revivedDocs = reviveTimestamps(filtered);
    return {
      docs: revivedDocs.map((item: any) => ({
        id: item.id,
        data: () => item
      })),
      empty: revivedDocs.length === 0,
      size: revivedDocs.length,
      forEach: (cb: any) => {
        revivedDocs.forEach((item: any, index: number) => {
          cb({
            id: item.id,
            data: () => item
          }, index);
        });
      }
    };
  }
  return sdkGetDocs(queryRef);
};

export const onSnapshot = (ref: any, onNext: any, onError?: any) => {
  if (isMockActive()) {
    const colRef = ref.type === 'query' ? ref.ref : ref;
    const parts = colRef.path.split('/');
    const colName = parts[0];
    const docId = parts.length > 1 ? parts.slice(1).join('/') : undefined;
    
    const listenerId = Math.random().toString(36).substring(2);
    
    listeners.push({
      id: listenerId,
      colName,
      docId,
      callback: onNext,
      queryRef: ref.type === 'query' ? ref : undefined
    });
    
    // Send initial snapshot asynchronously
    setTimeout(() => {
      if (docId) {
        const items = getLocalCollection(colName);
        const item = items.find(i => i.id === docId) || null;
        const revived = reviveTimestamps(item);
        onNext({
          exists: () => !!item,
          id: docId,
          data: () => revived
        });
      } else {
        const items = getLocalCollection(colName);
        let filtered = [...items];
        
        if (ref.type === 'query' && ref.constraints) {
          ref.constraints.forEach((c: any) => {
            if (c.type === 'where') {
              const { field, op, value } = c;
              filtered = filtered.filter(item => {
                const itemVal = item[field];
                if (op === '==') return itemVal === value;
                if (op === '!=') return itemVal !== value;
                if (op === 'array-contains') return Array.isArray(itemVal) && itemVal.includes(value);
                return true;
              });
            } else if (c.type === 'orderBy') {
              const { field, direction } = c;
              filtered.sort((a, b) => {
                const valA = a[field];
                const valB = b[field];
                if (valA === undefined || valB === undefined) return 0;
                let comparison = 0;
                if (valA < valB) comparison = -1;
                if (valA > valB) comparison = 1;
                return direction === 'desc' ? -comparison : comparison;
              });
            }
          });
        }
        
        const revivedDocs = reviveTimestamps(filtered);
        onNext({
          docs: revivedDocs.map((item: any) => ({
            id: item.id,
            data: () => item
          })),
          empty: revivedDocs.length === 0,
          size: revivedDocs.length,
          forEach: (cb: any) => {
            revivedDocs.forEach((item: any, index: number) => {
              cb({
                id: item.id,
                data: () => item
              }, index);
            });
          }
        });
      }
    }, 0);
    
    return () => {
      const idx = listeners.findIndex(l => l.id === listenerId);
      if (idx !== -1) {
        listeners.splice(idx, 1);
      }
    };
  }
  return sdkOnSnapshot(ref, onNext, onError);
};

export const setDoc = async (docRef: any, data: any) => {
  if (isMockActive()) {
    const parts = docRef.path.split('/');
    const colName = parts[0];
    const docId = parts.slice(1).join('/');
    const items = getLocalCollection(colName);
    
    const resolvedData = { ...data };
    for (const key in resolvedData) {
      if (resolvedData[key] && resolvedData[key]._type === 'serverTimestamp') {
        resolvedData[key] = { seconds: Math.floor(Date.now() / 1000) };
      }
    }
    
    const existingIdx = items.findIndex(i => i.id === docId);
    if (existingIdx !== -1) {
      items[existingIdx] = { ...items[existingIdx], ...resolvedData, id: docId };
    } else {
      items.push({ ...resolvedData, id: docId });
    }
    saveLocalCollection(colName, items);
    return;
  }
  return sdkSetDoc(docRef, data);
};

export const addDoc = async (colRef: any, data: any) => {
  if (isMockActive()) {
    const parts = colRef.path.split('/');
    const colName = parts[0];
    const items = getLocalCollection(colName);
    const newId = Math.random().toString(36).substring(2, 15);
    
    const resolvedData = { ...data };
    for (const key in resolvedData) {
      if (resolvedData[key] && resolvedData[key]._type === 'serverTimestamp') {
        resolvedData[key] = { seconds: Math.floor(Date.now() / 1000) };
      }
    }
    
    const newItem = { ...resolvedData, id: newId };
    items.push(newItem);
    saveLocalCollection(colName, items);
    return { id: newId };
  }
  return sdkAddDoc(colRef, data);
};

export const updateDoc = async (docRef: any, data: any) => {
  if (isMockActive()) {
    const parts = docRef.path.split('/');
    const colName = parts[0];
    const docId = parts.slice(1).join('/');
    const items = getLocalCollection(colName);
    const existingIdx = items.findIndex(i => i.id === docId);
    if (existingIdx !== -1) {
      const resolvedData = { ...data };
      for (const key in resolvedData) {
        const val = resolvedData[key];
        if (val && val._type === 'arrayUnion') {
          const currentArr = Array.isArray(items[existingIdx][key]) ? items[existingIdx][key] : [];
          resolvedData[key] = [...new Set([...currentArr, ...val.elements])];
        } else if (val && val._type === 'arrayRemove') {
          const currentArr = Array.isArray(items[existingIdx][key]) ? items[existingIdx][key] : [];
          resolvedData[key] = currentArr.filter((el: any) => !val.elements.includes(el));
        } else if (val && val._type === 'serverTimestamp') {
          resolvedData[key] = { seconds: Math.floor(Date.now() / 1000) };
        }
      }
      items[existingIdx] = { ...items[existingIdx], ...resolvedData };
      saveLocalCollection(colName, items);
    }
    return;
  }
  return sdkUpdateDoc(docRef, data);
};

export const deleteDoc = async (docRef: any) => {
  if (isMockActive()) {
    const parts = docRef.path.split('/');
    const colName = parts[0];
    const docId = parts.slice(1).join('/');
    const items = getLocalCollection(colName);
    const filtered = items.filter(i => i.id !== docId);
    saveLocalCollection(colName, filtered);
    return;
  }
  return sdkDeleteDoc(docRef);
};

export const serverTimestamp = () => {
  if (isMockActive()) {
    return { _type: 'serverTimestamp', seconds: Math.floor(Date.now() / 1000) };
  }
  return sdkServerTimestamp();
};

export const arrayUnion = (...elements: any[]) => {
  if (isMockActive()) {
    return { _type: 'arrayUnion', elements };
  }
  return sdkArrayUnion(...elements);
};

export const arrayRemove = (...elements: any[]) => {
  if (isMockActive()) {
    return { _type: 'arrayRemove', elements };
  }
  return sdkArrayRemove(...elements);
};

async function testConnection() {
  if (isMockActive()) return;
  try {
    await getDocFromServer(sdkDoc(db, 'test', 'connection'));
    console.log('Firebase connection successful');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client appears to be offline.");
    } else {
      console.warn("Initial Firebase connection test failed (expected if collection 'test' is empty):", error);
    }
  }
}

testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
