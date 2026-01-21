/**
 * OpenPeople op-tag utilities.
 *
 * Provides helpers to consistently tag data payloads, metadata, and logs
 * with the canonical `op` flag.
 */

export const OP_TAG_KEY = "op";
export const OP_TAG_VALUE = true;
export const OP_OBJECT_META_KEY = "op-tag";
export const OP_OBJECT_META_VALUE = "true";

/**
 * Attach the op flag to a payload object.
 */
export function withOpTag<T extends Record<string, any>>(payload: T): T & {
  [OP_TAG_KEY]: boolean;
} {
  return {
    ...payload,
    [OP_TAG_KEY]: OP_TAG_VALUE,
  };
}

/**
 * Merge op flag into a meta record.
 */
export function withOpMeta(meta?: Record<string, any>): Record<string, any> {
  return {
    ...(meta || {}),
    [OP_TAG_KEY]: OP_TAG_VALUE,
  };
}

/**
 * Attach op flag to object storage metadata.
 */
export function withOpObjectMetadata(
  metadata?: Record<string, string>
): Record<string, string> {
  return {
    ...(metadata || {}),
    [OP_OBJECT_META_KEY]: OP_OBJECT_META_VALUE,
  };
}

/**
 * Detect whether a record is already tagged.
 */
export function isOpTagged(meta?: Record<string, any>): boolean {
  if (!meta) return false;
  const value = meta[OP_TAG_KEY];
  return value === true || value === "true";
}
