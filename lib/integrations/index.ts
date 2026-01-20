/* ═══════════════════════════════════════════════════════════════════════════
   Integrations Module
   Device-bound auth and context minimization for enterprise plugins
   ═══════════════════════════════════════════════════════════════════════════ */

export {
  // Device auth types
  type DevicePlatform,
  type DeviceAttestation,
  type PluginToken,
  type PluginTokenRequest,
  type PluginTokenValidation,
  type DeviceRegistration,
  // Token functions
  generatePluginToken,
  validatePluginToken,
  revokePluginToken,
  revokeAllDeviceTokens,
  revokeAllUserTokens,
  refreshPluginToken,
  // Device functions
  listUserDevices,
  untrustDevice,
  cleanupExpiredTokens,
} from "./device-auth";

export {
  // Context filter types
  type ContextMinimizationConfig,
  type ContextItem,
  type FilteredContext,
  // Filter functions
  filterContext,
  loadContextConfig,
  checkContextAllowed,
  DEFAULT_CONTEXT_CONFIG,
} from "./context-filter";
