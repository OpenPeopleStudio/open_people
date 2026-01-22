import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ═══════════════════════════════════════════════════════════════════════════
   POST /api/chat/actions/edit
   Generate a diff/patch from an edit instruction
   ═══════════════════════════════════════════════════════════════════════════ */

interface EditRequest {
  file_content: string;
  file_name: string;
  instruction: string;
  conversation_id?: string;
}

interface EditResponse {
  original_content: string;
  edited_content: string;
  diff: string;
  summary: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body: EditRequest = await request.json();
    const { file_content, file_name, instruction } = body;
    
    if (!file_content) {
      return NextResponse.json({ error: "File content is required" }, { status: 400 });
    }
    
    if (!instruction?.trim()) {
      return NextResponse.json({ error: "Edit instruction is required" }, { status: 400 });
    }
    
    // Generate the edited version
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a code editor assistant. Apply the requested edit to the provided file content.

Return JSON with:
{
  "edited_content": "The full edited file content",
  "summary": "Brief summary of what was changed (1-2 sentences)"
}

Important:
- Return the COMPLETE file content, not just the changed parts
- Make minimal changes to accomplish the instruction
- Preserve formatting, indentation, and style
- If the instruction is unclear, make reasonable assumptions`,
        },
        {
          role: "user",
          content: `File: ${file_name}\n\nContent:\n\`\`\`\n${file_content}\n\`\`\`\n\nInstruction: ${instruction}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 4000,
    });
    
    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    if (!result.edited_content) {
      return NextResponse.json({ error: "Failed to generate edit" }, { status: 500 });
    }
    
    // Generate a unified diff
    const diff = generateUnifiedDiff(
      file_name,
      file_content,
      result.edited_content
    );
    
    const editResponse: EditResponse = {
      original_content: file_content,
      edited_content: result.edited_content,
      diff,
      summary: result.summary || "Edit applied",
    };
    
    return NextResponse.json(editResponse);
    
  } catch (error) {
    console.error("Edit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Generate a unified diff between two strings
 */
function generateUnifiedDiff(
  fileName: string,
  original: string,
  modified: string
): string {
  const originalLines = original.split("\n");
  const modifiedLines = modified.split("\n");
  
  const diff: string[] = [
    `--- a/${fileName}`,
    `+++ b/${fileName}`,
  ];
  
  // Simple line-by-line diff (not a true unified diff algorithm, but good enough for display)
  let i = 0;
  let j = 0;
  let hunkStart = -1;
  let hunkLines: string[] = [];
  let originalCount = 0;
  let modifiedCount = 0;
  
  function flushHunk() {
    if (hunkLines.length > 0 && hunkStart >= 0) {
      diff.push(`@@ -${hunkStart + 1},${originalCount} +${hunkStart + 1},${modifiedCount} @@`);
      diff.push(...hunkLines);
      hunkLines = [];
      originalCount = 0;
      modifiedCount = 0;
      hunkStart = -1;
    }
  }
  
  while (i < originalLines.length || j < modifiedLines.length) {
    const originalLine = i < originalLines.length ? originalLines[i] : undefined;
    const modifiedLine = j < modifiedLines.length ? modifiedLines[j] : undefined;
    
    if (originalLine === modifiedLine) {
      // Context line - include if we're in a hunk
      if (hunkLines.length > 0) {
        hunkLines.push(` ${originalLine || ""}`);
        originalCount++;
        modifiedCount++;
        
        // Check if we should flush the hunk (3+ context lines without changes)
        const recentChanges = hunkLines.slice(-4).some(l => l.startsWith("+") || l.startsWith("-"));
        if (!recentChanges && hunkLines.length > 6) {
          flushHunk();
        }
      }
      i++;
      j++;
    } else {
      // Start a new hunk if needed
      if (hunkStart === -1) {
        hunkStart = Math.max(0, i - 3);
        // Add context lines before the change
        for (let c = hunkStart; c < i; c++) {
          hunkLines.push(` ${originalLines[c]}`);
          originalCount++;
          modifiedCount++;
        }
      }
      
      // Check if it's a modification, addition, or deletion
      const originalExists = originalLine !== undefined;
      const modifiedExists = modifiedLine !== undefined;
      
      // Look ahead to find if lines match later (simple heuristic)
      let matchFoundO = false;
      let matchFoundM = false;
      
      if (originalExists && modifiedExists) {
        // Check if original line appears soon in modified
        for (let k = j; k < Math.min(j + 5, modifiedLines.length); k++) {
          if (modifiedLines[k] === originalLine) {
            matchFoundO = true;
            break;
          }
        }
        // Check if modified line appears soon in original
        for (let k = i; k < Math.min(i + 5, originalLines.length); k++) {
          if (originalLines[k] === modifiedLine) {
            matchFoundM = true;
            break;
          }
        }
      }
      
      if (matchFoundO && !matchFoundM) {
        // Modified line is an insertion
        hunkLines.push(`+${modifiedLine}`);
        modifiedCount++;
        j++;
      } else if (matchFoundM && !matchFoundO) {
        // Original line was deleted
        hunkLines.push(`-${originalLine}`);
        originalCount++;
        i++;
      } else {
        // Line was modified (or both added and deleted)
        if (originalExists) {
          hunkLines.push(`-${originalLine}`);
          originalCount++;
          i++;
        }
        if (modifiedExists) {
          hunkLines.push(`+${modifiedLine}`);
          modifiedCount++;
          j++;
        }
      }
    }
  }
  
  flushHunk();
  
  return diff.join("\n");
}
