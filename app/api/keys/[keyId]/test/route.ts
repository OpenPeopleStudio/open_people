import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ApiKeysEncryptionConfigError, decryptApiKey } from "@/lib/api-keys/encryption";

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/keys/[keyId]/test
   Test if an API key is valid by making a simple API call
   ═══════════════════════════════════════════════════════════════════════════ */

export async function POST(request: Request, context: any) {
  try {
    const { keyId } = context.params;
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get the key with encrypted data
    const { data: key, error: keyError } = await supabase
      .from("api_keys")
      .select("id, owner_id, provider, encrypted_key, encryption_iv")
      .eq("id", keyId)
      .eq("owner_id", user.id)
      .single();
    
    if (keyError || !key) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }
    
    // Decrypt the key
    let decryptedKey: string;
    try {
      decryptedKey = decryptApiKey({
        encryptedKey: key.encrypted_key,
        iv: key.encryption_iv,
      });
    } catch (decryptError) {
      if (decryptError instanceof ApiKeysEncryptionConfigError) {
        return NextResponse.json(
          { error: decryptError.message, code: "API_KEYS_ENCRYPTION_NOT_CONFIGURED" },
          { status: 503 }
        );
      }
      console.error("Failed to decrypt key:", decryptError);
      return NextResponse.json({ error: "Failed to decrypt key" }, { status: 500 });
    }
    
    // Test the key based on provider
    const testResult = await testApiKey(key.provider, decryptedKey);
    
    // Log the test
    await supabase
      .from("api_key_usage")
      .insert({
        key_id: keyId,
        action: "tested",
        source: "web",
        ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        user_agent: request.headers.get("user-agent"),
        success: testResult.valid,
        error_message: testResult.error,
        metadata: { provider: key.provider },
      });
    
    return NextResponse.json(testResult);
    
  } catch (error) {
    console.error("Key test error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Provider-specific test functions
   ═══════════════════════════════════════════════════════════════════════════ */

interface TestResult {
  valid: boolean;
  message: string;
  error?: string;
  details?: Record<string, unknown>;
}

async function testApiKey(provider: string, key: string): Promise<TestResult> {
  try {
    switch (provider) {
      case "openai":
        return await testOpenAI(key);
      case "anthropic":
        return await testAnthropic(key);
      case "cloudflare":
        return await testCloudflare(key);
      case "stripe":
        return await testStripe(key);
      case "resend":
        return await testResend(key);
      case "github":
        return await testGitHub(key);
      case "vercel":
        return await testVercel(key);
      default:
        return {
          valid: true,
          message: "Key format appears valid (no provider-specific test available)",
        };
    }
  } catch (error) {
    return {
      valid: false,
      message: "Test failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function testOpenAI(key: string): Promise<TestResult> {
  const response = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${key}` },
  });
  
  if (response.ok) {
    const data = await response.json();
    return {
      valid: true,
      message: "OpenAI key is valid",
      details: { models_count: data.data?.length || 0 },
    };
  }
  
  const error = await response.json().catch(() => ({}));
  return {
    valid: false,
    message: "OpenAI key is invalid",
    error: error.error?.message || `HTTP ${response.status}`,
  };
}

async function testAnthropic(key: string): Promise<TestResult> {
  // Anthropic doesn't have a simple test endpoint, so we make a minimal request
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-haiku-20240307",
      max_tokens: 1,
      messages: [{ role: "user", content: "Hi" }],
    }),
  });
  
  if (response.ok || response.status === 400) {
    // 400 might mean invalid request but valid key
    return { valid: true, message: "Anthropic key is valid" };
  }
  
  if (response.status === 401) {
    return { valid: false, message: "Anthropic key is invalid", error: "Unauthorized" };
  }
  
  return { valid: true, message: "Anthropic key appears valid" };
}

async function testCloudflare(key: string): Promise<TestResult> {
  const response = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
    headers: { Authorization: `Bearer ${key}` },
  });
  
  const data = await response.json();
  
  if (data.success) {
    return {
      valid: true,
      message: "Cloudflare token is valid",
      details: { status: data.result?.status },
    };
  }
  
  return {
    valid: false,
    message: "Cloudflare token is invalid",
    error: data.errors?.[0]?.message || "Unknown error",
  };
}

async function testStripe(key: string): Promise<TestResult> {
  const response = await fetch("https://api.stripe.com/v1/balance", {
    headers: { Authorization: `Bearer ${key}` },
  });
  
  if (response.ok) {
    return { valid: true, message: "Stripe key is valid" };
  }
  
  const error = await response.json().catch(() => ({}));
  return {
    valid: false,
    message: "Stripe key is invalid",
    error: error.error?.message || `HTTP ${response.status}`,
  };
}

async function testResend(key: string): Promise<TestResult> {
  const response = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${key}` },
  });
  
  if (response.ok) {
    const data = await response.json();
    return {
      valid: true,
      message: "Resend key is valid",
      details: { domains_count: data.data?.length || 0 },
    };
  }
  
  return {
    valid: false,
    message: "Resend key is invalid",
    error: `HTTP ${response.status}`,
  };
}

async function testGitHub(key: string): Promise<TestResult> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${key}`,
      "User-Agent": "OpenPeople-KeyTest",
    },
  });
  
  if (response.ok) {
    const data = await response.json();
    return {
      valid: true,
      message: "GitHub token is valid",
      details: { login: data.login },
    };
  }
  
  return {
    valid: false,
    message: "GitHub token is invalid",
    error: `HTTP ${response.status}`,
  };
}

async function testVercel(key: string): Promise<TestResult> {
  const response = await fetch("https://api.vercel.com/v2/user", {
    headers: { Authorization: `Bearer ${key}` },
  });
  
  if (response.ok) {
    const data = await response.json();
    return {
      valid: true,
      message: "Vercel token is valid",
      details: { username: data.user?.username },
    };
  }
  
  return {
    valid: false,
    message: "Vercel token is invalid",
    error: `HTTP ${response.status}`,
  };
}
