/* ═══════════════════════════════════════════════════════════════════════════
   Cache Module
   Exports for semantic caching with scoped keys
   ═══════════════════════════════════════════════════════════════════════════ */

export {
  // Core cache functions
  lookupCache,
  storeInCache,
  loadCacheConfig,
  getCacheStats,
  getPromptVersion,
  getKnowledgeBaseVersion,
  // Types
  type CacheStrategy,
  type CacheScope,
  type CachePolicy,
  type CacheEntry,
  type CacheLookupResult,
  type CacheStoreResult,
} from "./semantic-cache";

export {
  // Invalidation functions
  invalidateCache,
  onPromptUpdated,
  onKnowledgeBaseUpdated,
  onModelDeprecated,
  onPolicyChanged,
  cleanupExpiredEntries,
  invalidateByCacheKey,
  invalidateByPrefix,
  loadInvalidationRules,
  executeInvalidationRule,
  // Types
  type InvalidationTrigger,
  type InvalidationScope,
  type InvalidationResult,
  type InvalidationRule,
} from "./invalidation";
