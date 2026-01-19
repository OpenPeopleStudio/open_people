'use client'

import { useState, useRef, KeyboardEvent, useEffect } from 'react'

interface MessageInputProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onAttach?: (file: File) => void
  disabled?: boolean
  sending?: boolean
  placeholder?: string
  pendingFile?: File | null
  onCancelFile?: () => void
}

export default function MessageInput({
  value,
  onChange,
  onSend,
  onAttach,
  disabled,
  sending,
  placeholder = 'iMessage',
  pendingFile,
  onCancelFile,
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [value])

  // Handle keyboard appearing on mobile
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        // Get the visual viewport to account for mobile keyboard
        const visualViewport = window.visualViewport
        if (visualViewport) {
          const offsetBottom = window.innerHeight - visualViewport.height
          containerRef.current.style.transform = `translateY(-${offsetBottom}px)`
        }
      }
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
      window.visualViewport.addEventListener('scroll', handleResize)
      
      return () => {
        window.visualViewport?.removeEventListener('resize', handleResize)
        window.visualViewport?.removeEventListener('scroll', handleResize)
      }
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      
      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setFilePreview(null)
      }
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSendFile = () => {
    if (selectedFile && onAttach) {
      onAttach(selectedFile)
      setSelectedFile(null)
      setFilePreview(null)
    }
  }

  const handleCancelFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
    onCancelFile?.()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (type: string): string => {
    if (type.startsWith('image/')) return '🖼️'
    if (type.startsWith('video/')) return '🎬'
    if (type.includes('pdf')) return '📄'
    if (type.includes('document') || type.includes('word')) return '📝'
    return '📎'
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (but allow Shift+Enter for new lines)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled && !sending) {
        onSend()
      }
    }
  }

  const handleSend = () => {
    if (value.trim() && !disabled && !sending) {
      onSend()
    }
  }

  const hasMessage = value.trim().length > 0

  return (
    <div 
      ref={containerRef}
      className="fixed bottom-0 left-0 right-0 lg:left-64 bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border-t border-[var(--glass-border)] shadow-[0_-4px_24px_rgba(0,0,0,0.3)] z-[100] px-3 py-2 md:px-4 md:py-3 transition-transform duration-150 ease-out"
      style={{ willChange: 'transform' }}
    >
      {/* File Preview */}
      {selectedFile && (
        <div className="max-w-7xl mx-auto mb-2">
          <div className="inline-flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-primary)] max-w-sm">
            {/* Preview or Icon */}
            {filePreview ? (
              <img 
                src={filePreview} 
                alt="Preview" 
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center text-2xl flex-shrink-0">
                {getFileIcon(selectedFile.type)}
              </div>
            )}
            
            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Cancel */}
              <button
                onClick={handleCancelFile}
                disabled={sending}
                className="p-1.5 rounded-full hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--error)] transition-colors disabled:opacity-50"
                title="Cancel"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Send */}
              <button
                onClick={handleSendFile}
                disabled={sending || disabled}
                className="p-1.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send file"
              >
                {sending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Encryption indicator */}
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--success)]">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>File will be encrypted end-to-end</span>
          </div>
        </div>
      )}

      <div className="flex items-end gap-1.5 max-w-7xl mx-auto">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept="image/*,video/*,.pdf,.doc,.docx"
          className="hidden"
        />

        {/* Left Actions Group */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Attachment button */}
          {onAttach && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--bg-tertiary)] active:bg-[var(--bg-primary)] transition-all text-[var(--accent-blue)] disabled:opacity-50 disabled:cursor-not-allowed"
              title="Attach photo or file"
            >
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
              </svg>
            </button>
          )}

          {/* Camera button */}
          {onAttach && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[var(--bg-tertiary)] active:bg-[var(--bg-primary)] transition-all text-[var(--accent-blue)] disabled:opacity-50 disabled:cursor-not-allowed"
              title="Take photo"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        {/* Text Input Container - iMessage style */}
        <div className={`flex-1 max-w-[calc(100%-140px)] relative transition-all duration-200 ${
          isFocused ? 'transform scale-[1.01]' : ''
        }`}>
          <div className={`relative rounded-[20px] bg-[var(--bg-elevated)]/80 backdrop-blur-md border transition-all duration-200 ${
            isFocused 
              ? 'border-[var(--accent)]/50 shadow-[0_0_0_3px_rgba(168,85,247,0.1)]' 
              : 'border-[var(--border-primary)]'
          }`}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={disabled}
              placeholder={placeholder}
              rows={1}
              className="w-full px-4 py-2.5 bg-transparent text-[var(--text-primary)] rounded-[20px] focus:outline-none resize-none text-[15px] leading-[20px] placeholder:text-[var(--text-muted)]"
              style={{
                minHeight: '36px',
                maxHeight: '120px',
              }}
            />
          </div>
        </div>

        {/* Send Button - iMessage style */}
        <button
          onClick={handleSend}
          disabled={disabled || !hasMessage || sending}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 transform ${
            hasMessage && !disabled && !sending
              ? 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white scale-100 shadow-[0_2px_8px_rgba(168,85,247,0.3)]'
              : 'bg-transparent text-[var(--accent)] scale-90 opacity-40 cursor-not-allowed'
          }`}
          title="Send"
        >
          {sending ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg 
              className="w-6 h-6 -rotate-45 translate-x-[1px] translate-y-[-1px]" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
