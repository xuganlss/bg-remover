// Firestore REST API helper — no Firebase SDK, fully compatible with Cloudflare Workers

const PROJECT_ID = 'bg-remover-f38d1';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const FIREBASE_API_KEY = 'AIzaSyBH2JKsNhD3Eb3mRH7hf-7Nv6JpI4-3hzs';

type FirestoreValue =
  | { stringValue: string }
  | { integerValue: string }
  | { booleanValue: boolean }
  | { timestampValue: string }
  | { nullValue: null }
  | { mapValue: { fields: FirestoreFields } };

type FirestoreFields = Record<string, FirestoreValue>;

function toFields(obj: Record<string, unknown>): FirestoreFields {
  const fields: FirestoreFields = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) {
      fields[k] = { nullValue: null };
    } else if (typeof v === 'string') {
      fields[k] = { stringValue: v };
    } else if (typeof v === 'number') {
      fields[k] = { integerValue: String(Math.round(v)) };
    } else if (typeof v === 'boolean') {
      fields[k] = { booleanValue: v };
    } else if (v === SERVER_TIMESTAMP) {
      fields[k] = { timestampValue: new Date().toISOString() };
    }
  }
  return fields;
}

function fromFields(fields: FirestoreFields): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if ('stringValue' in v) obj[k] = v.stringValue;
    else if ('integerValue' in v) obj[k] = Number(v.integerValue);
    else if ('booleanValue' in v) obj[k] = v.booleanValue;
    else if ('timestampValue' in v) obj[k] = v.timestampValue;
    else if ('nullValue' in v) obj[k] = null;
    else if ('mapValue' in v) obj[k] = fromFields(v.mapValue.fields ?? {});
  }
  return obj;
}

export const SERVER_TIMESTAMP = Symbol('serverTimestamp');

export interface DocRef {
  collection: string;
  id: string;
}

export function docRef(collection: string, id: string): DocRef {
  return { collection, id };
}

export async function getDoc(ref: DocRef, accessToken?: string): Promise<{ exists: () => boolean; data: () => Record<string, unknown> }> {
  const url = `${FIRESTORE_BASE}/${ref.collection}/${ref.id}${accessToken ? '' : `?key=${FIREBASE_API_KEY}`}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  
  const res = await fetch(url, { headers });
  if (res.status === 404) {
    return { exists: () => false, data: () => ({}) };
  }
  if (!res.ok) throw new Error(`Firestore getDoc failed: ${res.status}`);
  const json = await res.json() as { fields?: FirestoreFields };
  const fields = json.fields ?? {};
  return {
    exists: () => true,
    data: () => fromFields(fields),
  };
}

export async function setDoc(ref: DocRef, data: Record<string, unknown>, accessToken?: string): Promise<void> {
  const url = `${FIRESTORE_BASE}/${ref.collection}/${ref.id}${accessToken ? '' : `?key=${FIREBASE_API_KEY}`}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  
  const res = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ fields: toFields(data) }),
  });
  if (!res.ok) throw new Error(`Firestore setDoc failed: ${res.status}`);
}

export async function updateDoc(ref: DocRef, data: Record<string, unknown>, accessToken?: string): Promise<void> {
  const incrementFields: string[] = [];
  const regularData: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(data)) {
    if (v instanceof IncrementValue) {
      incrementFields.push(k);
    } else {
      regularData[k] = v;
    }
  }

  const transforms = incrementFields.map((field) => {
    const val = data[field] as IncrementValue;
    return {
      fieldPath: field,
      increment: { integerValue: String(val.n) },
    };
  });

  // Use the database-level commit endpoint
  const commitUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:commit${accessToken ? '' : `?key=${FIREBASE_API_KEY}`}`;
  
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const writes: unknown[] = [];

  if (Object.keys(regularData).length > 0) {
    const docPath = `projects/${PROJECT_ID}/databases/(default)/documents/${ref.collection}/${ref.id}`;
    writes.push({
      update: {
        name: docPath,
        fields: toFields(regularData),
      },
      updateMask: { fieldPaths: Object.keys(regularData) },
    });
  }

  if (transforms.length > 0) {
    const docPath = `projects/${PROJECT_ID}/databases/(default)/documents/${ref.collection}/${ref.id}`;
    writes.push({
      transform: {
        document: docPath,
        fieldTransforms: transforms,
      },
    });
  }

  const res = await fetch(commitUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ writes }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firestore updateDoc failed: ${res.status} ${err}`);
  }
}

class IncrementValue {
  constructor(public n: number) {}
}

export function increment(n: number): IncrementValue {
  return new IncrementValue(n);
}

export function serverTimestamp(): typeof SERVER_TIMESTAMP {
  return SERVER_TIMESTAMP;
}

/**
 * Firestore Timestamp wrapper
 */
export class Timestamp {
  constructor(public seconds: number, public nanoseconds: number = 0) {}
  
  toMillis(): number {
    return this.seconds * 1000 + Math.floor(this.nanoseconds / 1000000);
  }
  
  toDate(): Date {
    return new Date(this.toMillis());
  }
  
  static fromDate(date: Date): Timestamp {
    const millis = date.getTime();
    return new Timestamp(Math.floor(millis / 1000), (millis % 1000) * 1000000);
  }
  
  static now(): Timestamp {
    const now = Date.now();
    return new Timestamp(Math.floor(now / 1000), (now % 1000) * 1000000);
  }
}

/**
 * Convert Firestore timestamp to Timestamp object
 */
function fromTimestampValue(v: { timestampValue?: string }): Timestamp | null {
  if (!v.timestampValue) return null;
  const date = new Date(v.timestampValue);
  return Timestamp.fromDate(date);
}

/**
 * Update fromFields to handle timestamps
 */
function fromFieldsWithTimestamps(fields: FirestoreFields): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if ('stringValue' in v) obj[k] = v.stringValue;
    else if ('integerValue' in v) obj[k] = Number(v.integerValue);
    else if ('booleanValue' in v) obj[k] = v.booleanValue;
    else if ('timestampValue' in v) obj[k] = fromTimestampValue(v);
    else if ('nullValue' in v) obj[k] = null;
    else if ('mapValue' in v) obj[k] = fromFieldsWithTimestamps(v.mapValue.fields ?? {});
  }
  return obj;
}

// Re-export getDoc with timestamp support
export async function getDocWithTimestamps(ref: DocRef, accessToken?: string): Promise<{ exists: () => boolean; data: () => Record<string, unknown> }> {
  const url = `${FIRESTORE_BASE}/${ref.collection}/${ref.id}${accessToken ? '' : `?key=${FIREBASE_API_KEY}`}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  
  const res = await fetch(url, { headers });
  if (res.status === 404) {
    return { exists: () => false, data: () => ({}) };
  }
  if (!res.ok) throw new Error(`Firestore getDoc failed: ${res.status}`);
  const json = await res.json() as { fields?: FirestoreFields };
  const fields = json.fields ?? {};
  return {
    exists: () => true,
    data: () => fromFieldsWithTimestamps(fields),
  };
}

/**
 * Create a new document with auto-generated ID
 * Returns the generated document ID
 */
export async function createDoc(collection: string, data: Record<string, unknown>, accessToken?: string): Promise<string> {
  const commitUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:commit${accessToken ? '' : `?key=${FIREBASE_API_KEY}`}`;
  
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  // Generate a unique ID
  const docId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const docPath = `projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;

  const writes: unknown[] = [{
    update: {
      name: docPath,
      fields: toFields(data),
    },
  }];

  const res = await fetch(commitUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ writes }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firestore createDoc failed: ${res.status} ${err}`);
  }

  return docId;
}

/**
 * Collection reference
 */
export interface CollectionRef {
  collection: string;
}

export function collection(name: string): CollectionRef {
  return { collection: name };
}

/**
 * Query constraints (simplified for REST API)
 */
export interface QueryConstraint {
  type: 'where' | 'orderBy' | 'limit';
  field?: string;
  op?: '<' | '<=' | '==' | '>=' | '>';
  value?: unknown;
  direction?: 'asc' | 'desc';
  limit?: number;
}

export function where(field: string, op: string, value: unknown): QueryConstraint {
  return { type: 'where', field, op: op as QueryConstraint['op'], value };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): QueryConstraint {
  return { type: 'orderBy', field, direction };
}

export function limit(n: number): QueryConstraint {
  return { type: 'limit', limit: n };
}

/**
 * Query reference
 */
export interface QueryRef {
  collection: string;
  constraints: QueryConstraint[];
}

export function query(ref: CollectionRef, ...constraints: QueryConstraint[]): QueryRef {
  return { collection: ref.collection, constraints };
}

/**
 * Get documents from a collection with query
 * Note: Firestore REST API has limitations on complex queries
 * This is a simplified implementation
 */
export async function getDocs(ref: QueryRef, accessToken?: string): Promise<{ forEach: (cb: (doc: { id: string; data: () => Record<string, unknown> }) => void) => void }> {
  // Build query URL
  const baseUrl = `${FIRESTORE_BASE}/${ref.collection}`;
  const params = new URLSearchParams();
  
  // For now, we'll fetch all and filter client-side
  // Production should use proper Firestore queries via Admin SDK
  const url = `${baseUrl}${accessToken ? '' : `?key=${FIREBASE_API_KEY}`}`;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  
  const res = await fetch(url, { headers });
  if (!res.ok) {
    // Return empty if collection doesn't exist
    if (res.status === 404) {
      return { forEach: () => {} };
    }
    throw new Error(`Firestore getDocs failed: ${res.status}`);
  }
  
  const json = await res.json() as { documents?: Array<{ name: string; fields?: FirestoreFields }> };
  const documents = json.documents ?? [];
  
  // Apply constraints client-side
  let results = documents.map(doc => {
    const id = doc.name.split('/').pop() || '';
    const fields = doc.fields ?? {};
    return {
      id,
      data: () => fromFieldsWithTimestamps(fields),
    };
  });
  
  // Apply where filters
  const whereConstraint = ref.constraints.find(c => c.type === 'where');
  if (whereConstraint && whereConstraint.field && whereConstraint.op === '==' && whereConstraint.value !== undefined) {
    results = results.filter(doc => {
      const data = doc.data();
      return data[whereConstraint.field!] === whereConstraint.value;
    });
  }
  
  // Apply orderBy (sort)
  const orderByConstraint = ref.constraints.find(c => c.type === 'orderBy');
  if (orderByConstraint && orderByConstraint.field) {
    results.sort((a, b) => {
      const aVal = (a.data()[orderByConstraint.field!] as any)?.toMillis?.() ?? a.data()[orderByConstraint.field!];
      const bVal = (b.data()[orderByConstraint.field!] as any)?.toMillis?.() ?? b.data()[orderByConstraint.field!];
      if (aVal < bVal) return orderByConstraint.direction === 'desc' ? 1 : -1;
      if (aVal > bVal) return orderByConstraint.direction === 'desc' ? -1 : 1;
      return 0;
    });
  }
  
  // Apply limit
  const limitConstraint = ref.constraints.find(c => c.type === 'limit');
  if (limitConstraint && limitConstraint.limit) {
    results = results.slice(0, limitConstraint.limit);
  }
  
  return {
    forEach: (cb) => {
      results.forEach(cb);
    },
  };
}

/**
 * Create document in a subcollection (e.g., creditLedger)
 */
export async function createDocInSubcollection(parentCollection: string, parentId: string, subCollection: string, data: Record<string, unknown>, accessToken?: string): Promise<string> {
  const commitUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:commit${accessToken ? '' : `?key=${FIREBASE_API_KEY}`}`;
  
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const docId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const docPath = `projects/${PROJECT_ID}/databases/(default)/documents/${parentCollection}/${parentId}/${subCollection}/${docId}`;

  const writes: unknown[] = [{
    update: {
      name: docPath,
      fields: toFields(data),
    },
  }];

  const res = await fetch(commitUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ writes }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firestore createDoc failed: ${res.status} ${err}`);
  }

  return docId;
}
