import { FieldValue, Timestamp } from 'firebase/firestore';

// ---- (de)serialisation: Timestamps and serverTimestamp() survive localStorage --

export function encode(value: unknown): unknown {
  if (value instanceof Timestamp) return { __ts: value.toMillis() };
  if (value instanceof FieldValue) return { __ts: Date.now() }; // serverTimestamp() sentinel
  if (Array.isArray(value)) return value.map(encode);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, encode(v)])
    );
  }
  return value;
}

export function decode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decode);
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    if (keys.length === 1 && keys[0] === '__ts' && typeof obj.__ts === 'number') return Timestamp.fromMillis(obj.__ts);
    return Object.fromEntries(keys.map((k) => [k, decode(obj[k])]));
  }
  return value;
}

