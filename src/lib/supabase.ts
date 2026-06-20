import { createClient } from '@supabase/supabase-js';

// Load Supabase credentials from environment
const supabaseUrl = import.meta.env?.NEXT_PUBLIC_SUPABASE_URL || (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_SUPABASE_URL : '') || '';
const supabaseAnonKey = import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY : '') || '';

export const isMockActive = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('faithconnect_mock_active') === 'true' || !supabaseUrl || !supabaseAnonKey;
};

// Initialize Supabase Client
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

export const db = {};

// Mock Auth Listener tracker
interface AuthListener {
  id: string;
  callback: (user: any) => void;
}
const mockAuthListeners: AuthListener[] = [];

export const triggerMockAuthChange = (user: any) => {
  mockAuthListeners.forEach(l => l.callback(user));
};

export const auth = {
  get currentUser() {
    if (isMockActive()) {
      const isMock = localStorage.getItem('faithconnect_mock_active') === 'true';
      if (isMock) {
        const role = localStorage.getItem('faithconnect_mock_role') || 'member';
        return {
          uid: `demo-${role}-123`,
          email: `demo-${role}@faithconnect.org`,
          displayName: role === 'admin' ? 'Pastor Michael' : role === 'leader' ? 'Sarah Leader' : 'John Member',
          photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'
        };
      }
      return null;
    }
    // Synchronous currentUser fallback for Supabase
    if (typeof window !== 'undefined') {
      const sessionStr = localStorage.getItem('sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token');
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          const user = session.user;
          if (user) {
            return {
              uid: user.id,
              email: user.email || '',
              displayName: user.user_metadata?.full_name || user.user_metadata?.name || 'Member',
              photoURL: user.user_metadata?.avatar_url || ''
            };
          }
        } catch (e) {
          // ignore
        }
      }
    }
    return null;
  }
};

export const onAuthStateChanged = (authObj: any, callback: (user: any) => void) => {
  if (isMockActive()) {
    const listenerId = Math.random().toString(36).substring(2);
    mockAuthListeners.push({ id: listenerId, callback });
    
    // Invoke immediately with current state
    const current = auth.currentUser;
    setTimeout(() => callback(current), 0);
    
    return () => {
      const idx = mockAuthListeners.findIndex(l => l.id === listenerId);
      if (idx !== -1) mockAuthListeners.splice(idx, 1);
    };
  }

  // Real Supabase Auth listener
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      callback({
        uid: session.user.id,
        email: session.user.email || '',
        displayName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Member',
        photoURL: session.user.user_metadata?.avatar_url || ''
      });
    } else {
      callback(null);
    }
  });

  return () => {
    subscription.unsubscribe();
  };
};

export const signInWithPopup = async (authObj: any, provider: any) => {
  if (isMockActive()) return;
  return supabase.auth.signInWithOAuth({
    provider: 'google',
  });
};

export const signOut = async (authObj: any) => {
  if (isMockActive()) return;
  return supabase.auth.signOut();
};

export const GoogleAuthProvider = class {};

// Mock local storage simulation logic
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
                if (valA < valB) comparison = -1;
                if (valA > valB) comparison = 1;
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

// Database Query Wrappers
export const collection = (firestore: any, path: string) => {
  return { type: 'collection', path };
};

export const doc = (parent: any, path?: string) => {
  if (parent.type === 'collection') {
    return { type: 'doc', path: parent.path + '/' + path };
  }
  return { type: 'doc', path };
};

export const query = (queryRef: any, ...queryConstraints: any[]) => {
  return {
    type: 'query',
    ref: queryRef,
    constraints: queryConstraints
  };
};

export const where = (fieldPath: string, opStr: any, value: any) => {
  return { type: 'where', field: fieldPath, op: opStr, value };
};

export const orderBy = (fieldPath: string, directionStr?: 'asc' | 'desc') => {
  return { type: 'orderBy', field: fieldPath, direction: directionStr || 'asc' };
};

export const getDoc = async (docRef: any) => {
  const parts = docRef.path.split('/');
  const table = parts[0];
  const id = parts.slice(1).join('/');

  if (isMockActive()) {
    const items = getLocalCollection(table);
    const item = items.find(i => i.id === id);
    const revived = reviveTimestamps(item);
    return {
      exists: () => !!item,
      id,
      data: () => revived
    };
  }

  const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return {
    exists: () => !!data,
    id,
    data: () => data
  };
};

export const getDocs = async (queryRef: any) => {
  const colRef = queryRef.type === 'query' ? queryRef.ref : queryRef;
  const parts = colRef.path.split('/');
  const table = parts[0];

  if (isMockActive()) {
    const items = getLocalCollection(table);
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

  let builder = supabase.from(table).select('*');
  if (queryRef.type === 'query' && queryRef.constraints) {
    queryRef.constraints.forEach((c: any) => {
      if (c.type === 'where') {
        const op = c.op === '==' ? 'eq' : c.op === '!=' ? 'neq' : c.op === 'array-contains' ? 'cs' : 'eq';
        builder = (builder as any)[op](c.field, c.value);
      } else if (c.type === 'orderBy') {
        builder = builder.order(c.field, { ascending: c.direction === 'asc' });
      }
    });
  }

  const { data, error } = await builder;
  if (error) throw error;

  return {
    docs: (data || []).map((item: any) => ({
      id: item.id,
      data: () => item
    })),
    empty: !data || data.length === 0,
    size: data?.length || 0,
    forEach: (cb: any) => data?.forEach((item: any, idx: number) => cb({ id: item.id, data: () => item }, idx))
  };
};

export const onSnapshot = (ref: any, onNext: any, onError?: any) => {
  const colRef = ref.type === 'query' ? ref.ref : ref;
  const parts = colRef.path.split('/');
  const table = parts[0];
  const docId = parts.length > 1 ? parts.slice(1).join('/') : undefined;

  if (isMockActive()) {
    const listenerId = Math.random().toString(36).substring(2);
    listeners.push({
      id: listenerId,
      colName: table,
      docId,
      callback: onNext,
      queryRef: ref.type === 'query' ? ref : undefined
    });
    
    setTimeout(() => {
      if (docId) {
        const items = getLocalCollection(table);
        const item = items.find(i => i.id === docId) || null;
        onNext({
          exists: () => !!item,
          id: docId,
          data: () => reviveTimestamps(item)
        });
      } else {
        getDocs(ref).then(onNext).catch(onError);
      }
    }, 0);
    
    return () => {
      const idx = listeners.findIndex(l => l.id === listenerId);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }

  // Real Supabase Realtime Listener
  if (docId) {
    getDoc(ref).then(onNext).catch(onError);
  } else {
    getDocs(ref).then(onNext).catch(onError);
  }

  const channel = supabase.channel(`realtime:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: table }, async () => {
      try {
        if (docId) {
          const snap = await getDoc(ref);
          onNext(snap);
        } else {
          const snap = await getDocs(ref);
          onNext(snap);
        }
      } catch (err) {
        if (onError) onError(err);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

const resolveWriteData = (data: any) => {
  const resolved = { ...data };
  for (const key in resolved) {
    const val = resolved[key];
    if (val && val._type === 'serverTimestamp') {
      resolved[key] = new Date().toISOString();
    }
  }
  return resolved;
};

export const setDoc = async (docRef: any, data: any) => {
  const parts = docRef.path.split('/');
  const table = parts[0];
  const id = parts.slice(1).join('/');

  if (isMockActive()) {
    const items = getLocalCollection(table);
    const resolvedData = resolveWriteData(data);
    const existingIdx = items.findIndex(i => i.id === id);
    if (existingIdx !== -1) {
      items[existingIdx] = { ...items[existingIdx], ...resolvedData, id };
    } else {
      items.push({ ...resolvedData, id });
    }
    saveLocalCollection(table, items);
    return;
  }

  const resolved = resolveWriteData(data);
  const { error } = await supabase.from(table).upsert({ id, ...resolved });
  if (error) throw error;
};

export const addDoc = async (colRef: any, data: any) => {
  const table = colRef.path;

  if (isMockActive()) {
    const items = getLocalCollection(table);
    const newId = Math.random().toString(36).substring(2, 15);
    const resolvedData = resolveWriteData(data);
    items.push({ ...resolvedData, id: newId });
    saveLocalCollection(table, items);
    return { id: newId };
  }

  const resolved = resolveWriteData(data);
  const { data: inserted, error } = await supabase.from(table).insert(resolved).select('id').single();
  if (error) throw error;
  return { id: inserted.id };
};

export const updateDoc = async (docRef: any, data: any) => {
  const parts = docRef.path.split('/');
  const table = parts[0];
  const id = parts.slice(1).join('/');

  if (isMockActive()) {
    const items = getLocalCollection(table);
    const existingIdx = items.findIndex(i => i.id === id);
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
          resolvedData[key] = new Date().toISOString();
        }
      }
      items[existingIdx] = { ...items[existingIdx], ...resolvedData };
      saveLocalCollection(table, items);
    }
    return;
  }

  const { data: current, error: getErr } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
  if (getErr) throw getErr;

  const resolved = { ...data };
  if (current) {
    for (const key in resolved) {
      const val = resolved[key];
      if (val && val._type === 'arrayUnion') {
        const currentArr = Array.isArray(current[key]) ? current[key] : [];
        resolved[key] = [...new Set([...currentArr, ...val.elements])];
      } else if (val && val._type === 'arrayRemove') {
        const currentArr = Array.isArray(current[key]) ? current[key] : [];
        resolved[key] = currentArr.filter((el: any) => !val.elements.includes(el));
      } else if (val && val._type === 'serverTimestamp') {
        resolved[key] = new Date().toISOString();
      }
    }
  }

  const { error } = await supabase.from(table).update(resolved).eq('id', id);
  if (error) throw error;
};

export const deleteDoc = async (docRef: any) => {
  const parts = docRef.path.split('/');
  const table = parts[0];
  const id = parts.slice(1).join('/');

  if (isMockActive()) {
    const items = getLocalCollection(table);
    const filtered = items.filter(i => i.id !== id);
    saveLocalCollection(table, filtered);
    return;
  }

  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
};

export const serverTimestamp = () => {
  return { _type: 'serverTimestamp' };
};

export const arrayUnion = (...elements: any[]) => {
  return { _type: 'arrayUnion', elements };
};

export const arrayRemove = (...elements: any[]) => {
  return { _type: 'arrayRemove', elements };
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error('Supabase/DB Operation Error: ', error);
  throw error;
}
