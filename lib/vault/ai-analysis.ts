import OpenAI from "openai";
import type { AICategory, AIExtractedData } from "@/types/vault";

/**
 * Vault AI Document Analysis
 * 
 * Uses OpenAI GPT-4o for document analysis including:
 * - Document classification (invoice, receipt, contract, etc.)
 * - Data extraction (amounts, dates, vendors, etc.)
 * - Content summarization
 * - Tag suggestions
 * - Duplicate detection suggestions
 */

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const SUPPORTED_DOCUMENT_TYPES = [
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/json",
  "text/markdown",
];

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface AnalysisResult {
  category: AICategory;
  summary: string;
  tags: string[];
  extractedData: AIExtractedData | null;
  confidence: number;
  suggestedFilename?: string;
  suggestedFolder?: string;
}

export interface DocumentContext {
  filename: string;
  contentType: string;
  sizeBytes: number;
  textContent?: string;
  imageBase64?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Analysis Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Analyze a document and extract structured information
 */
export async function analyzeDocument(
  context: DocumentContext
): Promise<AnalysisResult> {
  // Determine analysis method based on content type
  if (SUPPORTED_IMAGE_TYPES.includes(context.contentType) && context.imageBase64) {
    return analyzeImage(context);
  }
  
  if (context.textContent) {
    return analyzeText(context);
  }
  
  // Fallback for unsupported types
  return analyzeByFilename(context);
}

/**
 * Analyze an image document using GPT-4o Vision
 */
async function analyzeImage(context: DocumentContext): Promise<AnalysisResult> {
  const systemPrompt = `You are a document analysis AI. Analyze the provided image and extract structured information.

Respond with a JSON object containing:
{
  "category": one of ["invoice", "receipt", "contract", "legal", "financial", "medical", "identity", "correspondence", "report", "image", "other"],
  "summary": "A 1-2 sentence summary of the document",
  "tags": ["array", "of", "relevant", "tags"],
  "extractedData": {
    // For invoices/receipts:
    "vendor": "Company name",
    "amount": 123.45,
    "currency": "USD",
    "date": "2024-01-15",
    "invoiceNumber": "INV-123",
    "dueDate": "2024-02-15",
    "lineItems": [{"description": "Item", "quantity": 1, "unitPrice": 100, "total": 100}],
    
    // For contracts:
    "parties": ["Party A", "Party B"],
    "effectiveDate": "2024-01-01",
    "expirationDate": "2025-01-01",
    "contractType": "Service Agreement",
    
    // For identity documents:
    "documentType": "Passport",
    "name": "John Doe",
    "documentNumber": "AB123456",
    "expirationDate": "2030-01-01",
    
    // Include any other relevant structured data
  },
  "confidence": 0.95,
  "suggestedFilename": "vendor-invoice-2024-01.pdf",
  "suggestedFolder": "Invoices/2024"
}

Only include extractedData fields that are clearly visible in the document. Set null for fields you cannot determine.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this document. Filename: ${context.filename}, Size: ${formatBytes(context.sizeBytes)}`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${context.contentType};base64,${context.imageBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    return parseAnalysisResponse(content);
  } catch (error) {
    console.error("Image analysis error:", error);
    return getDefaultAnalysis(context, "image");
  }
}

/**
 * Analyze a text-based document
 */
async function analyzeText(context: DocumentContext): Promise<AnalysisResult> {
  const systemPrompt = `You are a document analysis AI. Analyze the provided text content and extract structured information.

Respond with a JSON object containing:
{
  "category": one of ["invoice", "receipt", "contract", "legal", "financial", "medical", "identity", "correspondence", "report", "image", "other"],
  "summary": "A 1-2 sentence summary of the document",
  "tags": ["array", "of", "relevant", "tags"],
  "extractedData": {
    // Include relevant structured data based on document type
    // For invoices: vendor, amount, currency, date, invoiceNumber, lineItems
    // For contracts: parties, effectiveDate, expirationDate, contractType
    // For correspondence: sender, recipient, date, subject
    // For financial: accountNumber, balance, transactions, period
  },
  "confidence": 0.95,
  "suggestedFilename": "descriptive-filename.ext",
  "suggestedFolder": "Category/Subcategory"
}

Only include extractedData fields that are clearly present in the document.`;

  // Truncate very long text
  const truncatedText = context.textContent!.slice(0, 15000);
  const wasTruncated = context.textContent!.length > 15000;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Analyze this document.
Filename: ${context.filename}
Content Type: ${context.contentType}
Size: ${formatBytes(context.sizeBytes)}
${wasTruncated ? "(Content truncated for analysis)" : ""}

Content:
${truncatedText}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    return parseAnalysisResponse(content);
  } catch (error) {
    console.error("Text analysis error:", error);
    return getDefaultAnalysis(context, "other");
  }
}

/**
 * Analyze based on filename when content is not available
 */
async function analyzeByFilename(context: DocumentContext): Promise<AnalysisResult> {
  const systemPrompt = `You are a document analysis AI. Based on the filename and file type, suggest a category and tags.

Respond with a JSON object:
{
  "category": one of ["invoice", "receipt", "contract", "legal", "financial", "medical", "identity", "correspondence", "report", "image", "other"],
  "summary": "Best guess description based on filename",
  "tags": ["array", "of", "relevant", "tags"],
  "extractedData": null,
  "confidence": 0.3,
  "suggestedFolder": "Category"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Categorize this file: ${context.filename} (${context.contentType}, ${formatBytes(context.sizeBytes)})`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    return parseAnalysisResponse(content);
  } catch (error) {
    console.error("Filename analysis error:", error);
    return getDefaultAnalysis(context, "other");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Suggestion Functions
// ═══════════════════════════════════════════════════════════════════════════

export interface SuggestionContext {
  files: Array<{
    id: string;
    filename: string;
    category: AICategory | null;
    contentHash: string;
    sizeBytes: number;
    summary: string | null;
    extractedData: AIExtractedData | null;
    createdAt: string;
  }>;
  folders: Array<{
    id: string;
    name: string;
    path: string;
  }>;
}

export interface VaultSuggestion {
  type: "consolidate" | "organize" | "rename" | "duplicate" | "archive";
  title: string;
  description: string;
  fileIds: string[];
  suggestedAction: Record<string, unknown>;
  confidence: number;
}

/**
 * Generate vault organization suggestions
 */
export async function generateSuggestions(
  context: SuggestionContext
): Promise<VaultSuggestion[]> {
  if (context.files.length < 3) {
    return [];
  }

  const systemPrompt = `You are a file organization AI assistant. Analyze the user's vault files and suggest improvements.

Generate suggestions for:
1. consolidate: Group related files together (e.g., multiple invoices from same vendor)
2. organize: Move files to more appropriate folders
3. rename: Suggest better filenames for clarity
4. duplicate: Flag potential duplicate files
5. archive: Suggest old files that could be archived

Respond with a JSON object:
{
  "suggestions": [
    {
      "type": "consolidate",
      "title": "Group Snow White Laundry invoices",
      "description": "You have 5 invoices from Snow White Laundry. Consider creating a dedicated folder.",
      "fileIds": ["file-id-1", "file-id-2"],
      "suggestedAction": { "createFolder": "Vendors/Snow White Laundry", "moveFiles": true },
      "confidence": 0.9
    }
  ]
}

Limit to 5 most impactful suggestions. Only suggest actions with high confidence.`;

  // Prepare file summary for analysis
  const fileSummary = context.files.map(f => ({
    id: f.id,
    filename: f.filename,
    category: f.category,
    size: formatBytes(f.sizeBytes),
    summary: f.summary,
    vendor: f.extractedData?.vendor_name,
    date: f.extractedData?.document_date,
    created: f.createdAt,
  }));

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Analyze these vault files and suggest organization improvements:

Files (${context.files.length} total):
${JSON.stringify(fileSummary, null, 2)}

Existing Folders:
${context.folders.map(f => f.path).join("\n")}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return [];
    }

    const parsed = JSON.parse(content);
    return parsed.suggestions || [];
  } catch (error) {
    console.error("Suggestion generation error:", error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Duplicate Detection
// ═══════════════════════════════════════════════════════════════════════════

export interface DuplicateGroup {
  files: Array<{
    id: string;
    filename: string;
    contentHash: string;
    sizeBytes: number;
    createdAt: string;
  }>;
  matchType: "exact" | "similar";
  similarity: number;
}

/**
 * Detect duplicate or similar files
 */
export function detectDuplicates(
  files: Array<{
    id: string;
    filename: string;
    contentHash: string;
    sizeBytes: number;
    createdAt: string;
  }>
): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const hashGroups = new Map<string, typeof files>();

  // Group by content hash (exact duplicates)
  for (const file of files) {
    if (!file.contentHash) continue;
    
    const existing = hashGroups.get(file.contentHash);
    if (existing) {
      existing.push(file);
    } else {
      hashGroups.set(file.contentHash, [file]);
    }
  }

  // Convert hash groups to duplicate groups
  for (const [, groupFiles] of hashGroups) {
    if (groupFiles.length > 1) {
      groups.push({
        files: groupFiles,
        matchType: "exact",
        similarity: 1.0,
      });
    }
  }

  return groups;
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

function parseAnalysisResponse(content: string): AnalysisResult {
  try {
    const parsed = JSON.parse(content);
    
    return {
      category: validateCategory(parsed.category),
      summary: parsed.summary || "No summary available",
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      extractedData: parsed.extractedData || null,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      suggestedFilename: parsed.suggestedFilename,
      suggestedFolder: parsed.suggestedFolder,
    };
  } catch {
    return {
      category: "other",
      summary: "Analysis failed",
      tags: [],
      extractedData: null,
      confidence: 0,
    };
  }
}

function validateCategory(category: string): AICategory {
  const validCategories: AICategory[] = [
    "invoice",
    "receipt",
    "contract",
    "statement",
    "id_document",
    "tax_document",
    "correspondence",
    "report",
    "image",
    "other",
  ];
  
  return validCategories.includes(category as AICategory)
    ? (category as AICategory)
    : "other";
}

function getDefaultAnalysis(context: DocumentContext, category: AICategory): AnalysisResult {
  return {
    category,
    summary: `File: ${context.filename}`,
    tags: [],
    extractedData: null,
    confidence: 0.1,
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Batch Processing
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Process multiple files in a batch with rate limiting
 */
export async function batchAnalyze(
  documents: DocumentContext[],
  onProgress?: (completed: number, total: number) => void
): Promise<Map<string, AnalysisResult>> {
  const results = new Map<string, AnalysisResult>();
  const concurrency = 3;
  let completed = 0;

  // Process in batches
  for (let i = 0; i < documents.length; i += concurrency) {
    const batch = documents.slice(i, i + concurrency);
    
    const batchResults = await Promise.all(
      batch.map(async (doc) => {
        const result = await analyzeDocument(doc);
        completed++;
        onProgress?.(completed, documents.length);
        return { filename: doc.filename, result };
      })
    );

    for (const { filename, result } of batchResults) {
      results.set(filename, result);
    }

    // Rate limiting delay between batches
    if (i + concurrency < documents.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}
