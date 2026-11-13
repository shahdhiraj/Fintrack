
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CollectionReference,
  DocumentReference,
  FirestoreError,
  Timestamp,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';
import { decode, encode } from './local-serialization';

/**
 * Firestore-first storage with an on-device fallback.
 *
 * Normally every read and write goes to Firestore in real time. If Firestore
 * refuses a collection (typically `permission-denied` because the security
 * rules for it haven't been deployed yet) the collection switches to
 * localStorage so the feature keeps working. As soon as Firestore accepts the
 * collection again, anything saved on the device is uploaded and the local
 * copy is cleared.
 */

const BATCH_LIMIT = 400;

function readLocal<T>(key: string | null, fallback: T): T {
  if (!key) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (decode(JSON.parse(raw)) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string | null, value: unknown) {
  if (!key) return;
  try {
    const isEmpty = value == null || (Array.isArray(value) && value.length === 0);
    if (isEmpty) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(encode(value)));
  } catch {
    /* storage full or blocked: data stays in memory for this session */
  }
}

const isPermissionDenied = (error: unknown) => (error as FirestoreError)?.code === 'permission-denied';

export type WriteFailure = (error: unknown) => void;
export type BulkOp = { id: string; data: Record<string, unknown> | null }; // null = delete

export interface SyncedCollection<T extends { id: string }> {
  data: T[];
  isLoading: boolean;
  /** True while this collection is being stored on this device only. */
  isLocal: boolean;
  newId: () => string;
  set: (id: string, data: Record<string, unknown>) => Promise<void>;
  update: (id: string, patch: Record<string, unknown>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  bulk: (ops: BulkOp[]) => Promise<void>;
}

export function useSyncedCollection<T extends { id: string }>(
  colRef: CollectionReference | null,
  storageKey: string | null,
  onFailure: WriteFailure
): SyncedCollection<T> {
  const remote = useCollection<Omit<T, 'id'>>(colRef as never, { suppressErrorEmit: true });
  const [forcedLocal, setForcedLocal] = useState(false);
  const [local, setLocal] = useState<T[]>([]);
  const migrating = useRef(false);

  // Reset when the signed-in user (storage key) changes.
  useEffect(() => {
    setLocal(readLocal<T[]>(storageKey, []));
    setForcedLocal(false);
  }, [storageKey]);

  const isLocal = Boolean(remote.error) || forcedLocal;

  const mutateLocal = useCallback(
    (fn: (items: T[]) => T[]) => {
      setLocal((prev) => {
        const next = fn(prev);
        writeLocal(storageKey, next);
        return next;
      });
    },
    [storageKey]
  );

  const localSet = useCallback(
    (id: string, data: Record<string, unknown>) =>
      mutateLocal((items) => [...items.filter((i) => i.id !== id), decode(encode({ ...data, id })) as T]),
    [mutateLocal]
  );
  const localUpdate = useCallback(
    (id: string, patch: Record<string, unknown>) =>
      mutateLocal((items) => items.map((i) => (i.id === id ? ({ ...i, ...(decode(encode(patch)) as object) } as T) : i))),
    [mutateLocal]
  );
  const localRemove = useCallback((id: string) => mutateLocal((items) => items.filter((i) => i.id !== id)), [mutateLocal]);

  /** Run a cloud write; on permission-denied fall back to the device. */
  const attempt = useCallback(
    async (cloud: () => Promise<void>, fallback: () => void) => {
      if (isLocal || !colRef) {
        fallback();
        return;
      }
      try {
        await cloud();
      } catch (error) {
        if (isPermissionDenied(error)) {
          setForcedLocal(true);
          fallback();
        } else {
          onFailure(error);
        }
      }
    },
    [isLocal, colRef, onFailure]
  );

  const set = useCallback(
    (id: string, data: Record<string, unknown>) =>
      attempt(() => setDoc(doc(colRef!, id), { ...data, id }), () => localSet(id, data)),
    [attempt, colRef, localSet]
  );

  const update = useCallback(
    (id: string, patch: Record<string, unknown>) => {
      // Records still waiting to upload live only on the device; edit them there.
      if (local.some((i) => i.id === id)) {
        localUpdate(id, patch);
        return Promise.resolve();
      }
      return attempt(() => updateDoc(doc(colRef!, id), patch), () => localUpdate(id, patch));
    },
    [attempt, colRef, local, localUpdate]
  );

  const remove = useCallback(
    (id: string) => {
      if (local.some((i) => i.id === id)) {
        localRemove(id);
        return Promise.resolve();
      }
      return attempt(() => deleteDoc(doc(colRef!, id)), () => localRemove(id));
    },
    [attempt, colRef, local, localRemove]
  );

  const applyLocal = useCallback(
    (ops: BulkOp[]) =>
      mutateLocal((items) => {
        let next = items;
        for (const op of ops) {
          next = next.filter((i) => i.id !== op.id);
          if (op.data) next = [...next, decode(encode({ ...op.data, id: op.id })) as T];
        }
        return next;
      }),
    [mutateLocal]
  );

  const bulk = useCallback(
    async (ops: BulkOp[]) => {
      if (ops.length === 0) return;
      const localIds = new Set(local.map((i) => i.id));
      const localOps = ops.filter((o) => localIds.has(o.id));
      const cloudOps = ops.filter((o) => !localIds.has(o.id));
      if (localOps.length) applyLocal(localOps);
      if (!cloudOps.length) return;
      await attempt(
        async () => {
          for (let i = 0; i < cloudOps.length; i += BATCH_LIMIT) {
            const batch = writeBatch(colRef!.firestore);
            for (const op of cloudOps.slice(i, i + BATCH_LIMIT)) {
              const ref = doc(colRef!, op.id);
              if (op.data) batch.set(ref, { ...op.data, id: op.id });
              else batch.delete(ref);
            }
            await batch.commit();
          }
        },
        () => applyLocal(cloudOps)
      );
    },
    [attempt, applyLocal, colRef, local]
  );

  // Upload device-only records once Firestore accepts this collection.
  useEffect(() => {
    if (isLocal || !colRef || remote.data === null || local.length === 0 || migrating.current) return;
    migrating.current = true;
    const pending = local;
    (async () => {
      try {
        for (let i = 0; i < pending.length; i += BATCH_LIMIT) {
          const batch = writeBatch(colRef.firestore);
          pending.slice(i, i + BATCH_LIMIT).forEach((item) => batch.set(doc(colRef, item.id), item));
          await batch.commit();
        }
        const uploaded = new Set(pending.map((p) => p.id));
        mutateLocal((items) => items.filter((i) => !uploaded.has(i.id)));
      } catch (error) {
        if (isPermissionDenied(error)) setForcedLocal(true);
      } finally {
        migrating.current = false;
      }
    })();
  }, [isLocal, colRef, remote.data, local, mutateLocal]);

  const data = useMemo(() => {
    if (isLocal) return local;
    const cloud = (remote.data ?? []) as unknown as T[];
    if (local.length === 0) return cloud;
    const ids = new Set(cloud.map((c) => c.id));
    return [...cloud, ...local.filter((l) => !ids.has(l.id))];
  }, [isLocal, local, remote.data]);

  const newId = useCallback(
    () => (colRef ? doc(colRef).id : `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`),
    [colRef]
  );

  return { data, isLoading: remote.isLoading, isLocal, newId, set, update, remove, bulk };
}

/** Single-document variant (used for preferences); writes merge. */
export function useSyncedDoc<T extends object>(
  docRef: DocumentReference | null,
  storageKey: string | null,
  onFailure: WriteFailure
): { data: Partial<T> | null; isLocal: boolean; merge: (patch: Partial<T>) => Promise<void> } {
  const remote = useDoc<T>(docRef as never, { suppressErrorEmit: true });
  const [forcedLocal, setForcedLocal] = useState(false);
  const [local, setLocal] = useState<Partial<T> | null>(null);
  const migrating = useRef(false);

  useEffect(() => {
    setLocal(readLocal<Partial<T> | null>(storageKey, null));
    setForcedLocal(false);
  }, [storageKey]);

  const isLocal = Boolean(remote.error) || forcedLocal;

  const mergeLocal = useCallback(
    (patch: Partial<T>) =>
      setLocal((prev) => {
        const next = { ...(prev ?? {}), ...patch };
        writeLocal(storageKey, next);
        return next;
      }),
    [storageKey]
  );

  const merge = useCallback(
    async (patch: Partial<T>) => {
      if (isLocal || !docRef) {
        mergeLocal(patch);
        return;
      }
      try {
        await setDoc(docRef, patch, { merge: true });
      } catch (error) {
        if (isPermissionDenied(error)) {
          setForcedLocal(true);
          mergeLocal(patch);
        } else onFailure(error);
      }
    },
    [isLocal, docRef, mergeLocal, onFailure]
  );

  useEffect(() => {
    if (isLocal || !docRef || remote.isLoading || !local || migrating.current) return;
    migrating.current = true;
    setDoc(docRef, local, { merge: true })
      .then(() => {
        setLocal(null);
        writeLocal(storageKey, null);
      })
      .catch((error) => isPermissionDenied(error) && setForcedLocal(true))
      .finally(() => {
        migrating.current = false;
      });
  }, [isLocal, docRef, remote.isLoading, local, storageKey]);

  const data = useMemo(() => {
    if (isLocal) return local;
    const cloud = remote.data ? (({ id: _id, ...rest }) => rest)(remote.data as T & { id: string }) : null;
    return local ? { ...(cloud ?? {}), ...local } : (cloud as Partial<T> | null);
  }, [isLocal, local, remote.data]);

  return { data, isLocal, merge };
}
