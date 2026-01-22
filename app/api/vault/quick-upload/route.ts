import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { hashToken, isValidTokenFormat, parseClientType, isContentTypeAllowed } from "@/lib/quick-share/tokens";
import { analyzeDocument } from "@/lib/vault/ai-analysis";
import { encryptSecret, serializeEnvelope } from "@/lib/secrets/kms";
import crypto from "crypto";

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/vault/quick-upload
   
   Quick upload endpoint for external clients (CLI, extension, mobile)
   
   Authentication: x-vault-token header (long-lived upload token)
   
   Body: multipart/form-data with file
   
   Returns: { success, file_id, ai_summary, suggested_folder }
   ═══════════════════════════════════════════════════════════════════════════ */

// Use service role for this endpoint (no user session)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_VAULT_UPLOAD_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const ALLOWED_ORIGINS = (process.env.VAULT_QUICK_UPLOAD_ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim().toLowerCase())
  .filter(Boolean);

function buildCorsHeaders(originHeader: string | null): Record<string, string> | null {
  if (!originHeader) return {};

  try {
    const origin = new URL(originHeader).origin.toLowerCase();
    if (ALLOWED_ORIGINS.length > 0 && !ALLOWED_ORIGINS.includes(origin)) {
      return null;
    }
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-vault-token",
      "Access-Control-Max-Age": "3600",
      Vary: "Origin",
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const origin = request.headers.get("origin");
  const corsHeaders = buildCorsHeaders(origin);
  const withCors = (response: NextResponse) => {
    if (corsHeaders) {
      Object.entries(corsHeaders).forEach(([key, value]) =>
        response.headers.set(key, value)
      );
    }
    return response;
  };
  
  try {

    if (origin && corsHeaders === null) {
      return withCors(
        NextResponse.json(
          { success: false, error: "Origin not allowed" },
          { status: 403 }
        )
      );
    }
    
    // Extract token from header
    const token = request.headers.get("x-vault-token");
    
    if (!token || !isValidTokenFormat(token)) {
      return withCors(
        NextResponse.json(
          { success: false, error: "Missing or invalid x-vault-token header" },
          { status: 401 }
        )
      );
    }
    
    // Hash token to look up
    const tokenHash = hashToken(token);
    
    // Find the token
    const { data: tokenRecord, error: tokenError } = await supabase
      .from("vault_upload_tokens")
      .select("*, vault:vault_spaces(*)")
      .eq("token_hash", tokenHash)
      .eq("is_active", true)
      .single();
    
    if (tokenError || !tokenRecord) {
      return withCors(
        NextResponse.json(
          { success: false, error: "Invalid or inactive token" },
          { status: 401 }
        )
      );
    }
    
    // Check expiration
    if (tokenRecord.expires_at && new Date(tokenRecord.expires_at) < new Date()) {
      return withCors(
        NextResponse.json(
          { success: false, error: "Token has expired" },
          { status: 401 }
        )
      );
    }

    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;

    const allowedIps = Array.isArray(tokenRecord.permissions?.allowed_ips)
      ? tokenRecord.permissions.allowed_ips
      : [];
    if (allowedIps.length > 0 && (!clientIp || !allowedIps.includes(clientIp))) {
      return withCors(
        NextResponse.json(
          { success: false, error: "Token not valid for this IP" },
          { status: 403 }
        )
      );
    }

    const userAgent = request.headers.get("user-agent") || "";
    const allowedUserAgents = Array.isArray(tokenRecord.permissions?.allowed_user_agents)
      ? tokenRecord.permissions.allowed_user_agents
      : [];
    if (
      allowedUserAgents.length > 0 &&
      !allowedUserAgents.some((ua: string) =>
        userAgent.toLowerCase().includes(ua.toLowerCase())
      )
    ) {
      return withCors(
        NextResponse.json(
          { success: false, error: "Token not valid for this device" },
          { status: 403 }
        )
      );
    }

    const ttlMinutes = Number(tokenRecord.permissions?.ttl_minutes) || null;
    if (ttlMinutes && tokenRecord.created_at) {
      const createdAt = new Date(tokenRecord.created_at).getTime();
      if (Date.now() > createdAt + ttlMinutes * 60_000) {
        return withCors(
          NextResponse.json(
            { success: false, error: "Token TTL exceeded" },
            { status: 401 }
          )
        );
      }
    }
    
    // Check rate limit
    const { data: rateLimitOk } = await supabase
      .rpc("check_token_rate_limit", { p_token_id: tokenRecord.id });
    
    if (!rateLimitOk) {
      return withCors(
        NextResponse.json(
          { success: false, error: "Rate limit exceeded" },
          { status: 429 }
        )
      );
    }
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return withCors(
        NextResponse.json(
          { success: false, error: "No file provided" },
          { status: 400 }
        )
      );
    }
    
    // Check file size
    const maxBytes = tokenRecord.max_file_size_mb * 1024 * 1024;
    if (file.size > maxBytes) {
      await logUsage(tokenRecord.id, null, file.name, file.size, file.type, false, 
        `File too large (max ${tokenRecord.max_file_size_mb}MB)`, request);
      return withCors(
        NextResponse.json(
          { success: false, error: `File too large. Maximum size is ${tokenRecord.max_file_size_mb}MB` },
          { status: 400 }
        )
      );
    }
    
    // Check content type
    if (!isContentTypeAllowed(file.type, tokenRecord.allowed_types || [])) {
      await logUsage(tokenRecord.id, null, file.name, file.size, file.type, false,
        "File type not allowed", request);
      return withCors(
        NextResponse.json(
          { success: false, error: "File type not allowed for this token" },
          { status: 400 }
        )
      );
    }
    
    // Read file content
    const fileBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);
    
    // Generate encryption key and IV for this file
    const encryptionKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(12);
    
    // Encrypt the file
    const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, iv);
    const encrypted = Buffer.concat([
      cipher.update(fileBytes),
      cipher.final(),
      cipher.getAuthTag(),
    ]);
    
    // Generate R2 key
    const fileId = crypto.randomUUID();
    const r2Key = `vault/${tokenRecord.vault_id}/${fileId}`;
    
    // Upload to R2
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: r2Key,
      Body: encrypted,
      ContentType: "application/octet-stream", // Encrypted data
      Metadata: {
        "original-name": encodeURIComponent(file.name),
        "original-type": file.type,
      },
    }));
    
    // Hash content for deduplication
    const contentHash = crypto.createHash("sha256").update(fileBytes).digest("hex");
    
    // Determine folder
    const folderId = tokenRecord.default_folder_id || null;

    // Wrap the DEK with KMS/local KEK before storing
    let dekEnvelope;
    try {
      dekEnvelope = serializeEnvelope(
        await encryptSecret(encryptionKey.toString("base64"))
      );
    } catch (encryptionError) {
      console.error("Failed to wrap DEK:", encryptionError);
      return withCors(
        NextResponse.json(
          { success: false, error: "Encryption service unavailable" },
          { status: 503 }
        )
      );
    }
    
    // Create file record
    const { error: fileError } = await supabase
      .from("vault_files")
      .insert({
        id: fileId,
        vault_id: tokenRecord.vault_id,
        folder_id: folderId,
        filename: file.name,
        content_type: file.type,
        size_bytes: file.size,
        r2_key: r2Key,
        encryption_iv: iv.toString("base64"),
        content_hash: contentHash,
        upload_source: "quick_share",
        metadata: {
          upload_token_id: tokenRecord.id,
          upload_token_name: tokenRecord.name,
        client_type: parseClientType(request.headers.get("user-agent")),
        dek_envelope: dekEnvelope,
      },
      })
      .select()
      .single();
    
    if (fileError) {
      console.error("Failed to create file record:", fileError);
      return withCors(
        NextResponse.json(
          { success: false, error: "Failed to save file" },
          { status: 500 }
        )
      );
    }
    
    await supabase
      .from("vault_encryption_keys")
      .insert({
        vault_id: tokenRecord.vault_id,
        file_id: fileId,
        encrypted_dek: JSON.stringify(dekEnvelope),
        key_version: 1,
      });
    
    // Run AI analysis
    let aiResult = null;
    try {
      aiResult = await analyzeDocument({
        filename: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      });
      
      // Update file with AI metadata
      await supabase
        .from("vault_files")
        .update({
          ai_category: aiResult.category,
          ai_summary: aiResult.summary,
          ai_tags: aiResult.tags,
          ai_analyzed_at: new Date().toISOString(),
        })
        .eq("id", fileId);
    } catch (aiError) {
      console.error("AI analysis failed:", aiError);
      // Continue without AI - not critical
    }
    
    // Check auto-approve setting
    const autoApprove = tokenRecord.permissions?.auto_approve === true;
    
    if (!autoApprove) {
      // Add to quick share inbox for review
      await supabase
        .from("vault_quick_share_inbox")
        .insert({
          vault_id: tokenRecord.vault_id,
          file_id: fileId,
          token_id: tokenRecord.id,
          suggested_folder_id: folderId,
          suggested_folder_path: aiResult?.suggestedFolder,
          ai_category: aiResult?.category,
          ai_summary: aiResult?.summary,
          ai_tags: aiResult?.tags,
          confidence_score: aiResult?.confidence,
          source_device: tokenRecord.name,
          source_ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
        });
    }
    
    // Log successful upload
    await logUsage(
      tokenRecord.id,
      fileId,
      file.name,
      file.size,
      file.type,
      true,
      null,
      request,
      aiResult
    );
    
    const duration = Date.now() - startTime;
    
    return withCors(
      NextResponse.json({
        success: true,
        file_id: fileId,
        filename: file.name,
        size_bytes: file.size,
        ai_summary: aiResult?.summary,
        ai_category: aiResult?.category,
        ai_tags: aiResult?.tags,
        suggested_folder: aiResult?.suggestedFolder,
        auto_approved: autoApprove,
        duration_ms: duration,
      })
    );
    
  } catch (error) {
    console.error("Quick upload error:", error);
    return withCors(
      NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      )
    );
  }
}

async function logUsage(
  tokenId: string,
  fileId: string | null,
  filename: string,
  fileSize: number,
  contentType: string,
  success: boolean,
  errorMessage: string | null,
  request: NextRequest,
  aiResult?: { suggestedFolder?: string; category?: string; tags?: string[] } | null
) {
  await supabase
    .from("vault_upload_token_usage")
    .insert({
      token_id: tokenId,
      file_id: fileId,
      filename,
      file_size_bytes: fileSize,
      content_type: contentType,
      success,
      error_message: errorMessage,
      ai_suggested_folder: aiResult?.suggestedFolder,
      ai_category: aiResult?.category,
      ai_tags: aiResult?.tags,
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
      user_agent: request.headers.get("user-agent"),
      client_type: parseClientType(request.headers.get("user-agent")),
    });
}

/* ═══════════════════════════════════════════════════════════════════════════
   OPTIONS - CORS preflight
   ═══════════════════════════════════════════════════════════════════════════ */

export async function OPTIONS(request: NextRequest) {
  const corsHeaders = buildCorsHeaders(request.headers.get("origin"));
  if (request.headers.get("origin") && corsHeaders === null) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      ...(corsHeaders || {}),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-vault-token",
      "Access-Control-Max-Age": "3600",
    },
  });
}
