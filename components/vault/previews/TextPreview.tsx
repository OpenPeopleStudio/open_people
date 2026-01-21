"use client";

import { useState } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   Text/Code Preview Component
   Displays decrypted text files with syntax highlighting
   ═══════════════════════════════════════════════════════════════════════════ */

interface TextPreviewProps {
  content: string;
  filename: string;
}

export function TextPreview({ content, filename }: TextPreviewProps) {
  const [wrapText, setWrapText] = useState(true);

  function getLanguageFromFilename(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();

    switch (ext) {
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'tsx': return 'typescript';
      case 'jsx': return 'javascript';
      case 'py': return 'python';
      case 'java': return 'java';
      case 'cpp':
      case 'cc':
      case 'cxx': return 'cpp';
      case 'c': return 'c';
      case 'h':
      case 'hpp': return 'cpp';
      case 'cs': return 'csharp';
      case 'php': return 'php';
      case 'rb': return 'ruby';
      case 'go': return 'go';
      case 'rs': return 'rust';
      case 'swift': return 'swift';
      case 'kt': return 'kotlin';
      case 'scala': return 'scala';
      case 'sql': return 'sql';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'scss': return 'scss';
      case 'less': return 'less';
      case 'json': return 'json';
      case 'xml': return 'xml';
      case 'yaml':
      case 'yml': return 'yaml';
      case 'md': return 'markdown';
      case 'txt': return 'text';
      case 'sh':
      case 'bash':
      case 'zsh': return 'bash';
      case 'ps1': return 'powershell';
      default: return 'text';
    }
  }

  const language = getLanguageFromFilename(filename);
  const lineCount = content.split('\n').length;
  const charCount = content.length;

  return (
    <div className="p-4">
      {/* Controls */}
      <div className="flex items-center justify-between mb-4 p-3 bg-[var(--surface-1)] rounded-lg">
        <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
          <span>{language.toUpperCase()}</span>
          <span>{lineCount} lines</span>
          <span>{charCount} characters</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={wrapText}
              onChange={(e) => setWrapText(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border-subtle)] bg-[var(--surface-2)] text-[var(--electric-lime)] focus:ring-[var(--electric-lime)] focus:ring-offset-0"
            />
            Wrap text
          </label>
        </div>
      </div>

      {/* Text Content */}
      <div className="bg-[var(--surface-1)] rounded-lg border border-[var(--border-subtle)] overflow-hidden">
        <pre
          className={`p-4 text-sm leading-relaxed overflow-auto max-h-[600px] ${
            wrapText ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
          }`}
          style={{
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            tabSize: 2,
          }}
        >
          <code className={`language-${language}`}>
            {content}
          </code>
        </pre>
      </div>
    </div>
  );
}