"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  vaultKeyManager,
  encryptFileForUpload,
  decryptFileForDownload,
  computeHash,
} from "@/lib/vault/client-crypto";
import type { VaultSpace } from "@/types/vault";

/* ═══════════════════════════════════════════════════════════════════════════
   Vault Context
   Global state management for vault session and encryption
   ═══════════════════════════════════════════════════════════════════════════ */

interface VaultContextValue {
  // State
  isLoading: boolean;
  isUnlocked: boolean;
  vault: VaultSpace | null;
  sessionId: string | null;
  error: string | null;
  
  // Actions
  checkStatus: () => Promise<void>;
  unlock: (password: string, deviceName?: string) => Promise<boolean>;
  lock: () => Promise<void>;
  
  // Encryption helpers
  encryptFile: (file: File) => Promise<{
    encryptedBlob: Blob;
    iv: string;
    contentHash: string;
  }>;
  decryptFile: (
    encryptedData: ArrayBuffer,
    ivBase64: string,
    contentType: string
  ) => Promise<Blob>;
  
  // Session
  refreshSession: () => void;
  getSessionHeaders: () => Record<string, string>;
}

const VaultContext = createContext<VaultContextValue | null>(null);

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error("useVault must be used within a VaultProvider");
  }
  return context;
}

interface VaultProviderProps {
  children: ReactNode;
}

export function VaultProvider({ children }: VaultProviderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [vault, setVault] = useState<VaultSpace | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Check vault status and restore session on mount
  useEffect(() => {
    checkStatus();
  }, []);
  
  // Check for existing session and vault status
  const checkStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Try to restore existing session
      const restored = await vaultKeyManager.restore();
      
      if (restored) {
        const sid = vaultKeyManager.getSessionId();
        
        // Verify session is still valid with server
        const verifyRes = await fetch("/api/vault/files?limit=1", {
          headers: { "x-vault-session": sid || "" },
        });
        
        if (verifyRes.ok) {
          // Session is valid, fetch vault info
          const statusRes = await fetch("/api/vault/status");
          if (statusRes.ok) {
            const data = await statusRes.json();
            setVault(data.vault);
            setSessionId(sid);
            setIsUnlocked(true);
            return;
          }
        }
        
        // Session invalid, clear it
        vaultKeyManager.clear();
      }
      
      // Check if vault exists
      const statusRes = await fetch("/api/vault/status");
      
      if (statusRes.status === 404) {
        // No vault exists
        setVault(null);
        setIsUnlocked(false);
      } else if (statusRes.ok) {
        const data = await statusRes.json();
        setVault(data.vault);
        setIsUnlocked(false);
      } else {
        throw new Error("Failed to check vault status");
      }
      
    } catch (err) {
      console.error("Vault status error:", err);
      setError(err instanceof Error ? err.message : "Failed to check vault status");
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Unlock vault with password
  const unlock = useCallback(async (password: string, deviceName?: string): Promise<boolean> => {
    try {
      setError(null);
      
      const res = await fetch("/api/vault/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          device_name: deviceName || getDeviceName(),
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Failed to unlock vault");
        return false;
      }
      
      // Initialize key manager with session data
      await vaultKeyManager.initialize(
        data.session_id,
        data.encryption_key,
        new Date(data.expires_at)
      );
      
      setSessionId(data.session_id);
      setIsUnlocked(true);
      
      // Fetch vault info if not already loaded
      if (!vault) {
        const statusRes = await fetch("/api/vault/status");
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setVault(statusData.vault);
        }
      }
      
      return true;
      
    } catch (err) {
      console.error("Unlock error:", err);
      setError(err instanceof Error ? err.message : "Failed to unlock vault");
      return false;
    }
  }, [vault]);
  
  // Lock vault
  const lock = useCallback(async () => {
    try {
      const sid = vaultKeyManager.getSessionId();
      
      if (sid) {
        // Notify server
        await fetch("/api/vault/unlock", {
          method: "DELETE",
          headers: { "x-vault-session": sid },
        });
      }
    } catch (err) {
      console.error("Lock error:", err);
    } finally {
      // Clear local state regardless of server response
      vaultKeyManager.clear();
      setSessionId(null);
      setIsUnlocked(false);
    }
  }, []);
  
  // Encrypt file for upload
  const encryptFile = useCallback(async (file: File) => {
    if (!vaultKeyManager.isUnlocked()) {
      throw new Error("Vault is locked");
    }
    
    return encryptFileForUpload(file);
  }, []);
  
  // Decrypt file after download
  const decryptFile = useCallback(async (
    encryptedData: ArrayBuffer,
    ivBase64: string,
    contentType: string
  ) => {
    if (!vaultKeyManager.isUnlocked()) {
      throw new Error("Vault is locked");
    }
    
    return decryptFileForDownload(encryptedData, ivBase64, contentType);
  }, []);
  
  // Refresh session expiry
  const refreshSession = useCallback(() => {
    const newExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    vaultKeyManager.refresh(newExpiry);
  }, []);
  
  // Get headers for API requests
  const getSessionHeaders = useCallback((): Record<string, string> => {
    const sid = vaultKeyManager.getSessionId();
    return sid ? { "x-vault-session": sid } : ({} as Record<string, string>);
  }, []);
  
  const value: VaultContextValue = {
    isLoading,
    isUnlocked,
    vault,
    sessionId,
    error,
    checkStatus,
    unlock,
    lock,
    encryptFile,
    decryptFile,
    refreshSession,
    getSessionHeaders,
  };
  
  return (
    <VaultContext.Provider value={value}>
      {children}
    </VaultContext.Provider>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Helper Functions
   ═══════════════════════════════════════════════════════════════════════════ */

function getDeviceName(): string {
  if (typeof navigator === "undefined") return "Unknown Device";
  
  const ua = navigator.userAgent;
  
  if (ua.includes("Mac")) return "Mac";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("iPhone")) return "iPhone";
  if (ua.includes("iPad")) return "iPad";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("Linux")) return "Linux";
  
  return "Unknown Device";
}
