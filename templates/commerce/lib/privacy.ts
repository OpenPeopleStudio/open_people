// Privacy configuration
export function isPrivacyStrict(): boolean {
  return process.env.PRIVACY_STRICT_LOGGING === 'true'
}

export function redactErrorMessage(message: string, fallback = 'Request failed'): string {
  return isPrivacyStrict() ? fallback : message
}

// PII Detection Patterns
const PII_PATTERNS = {
  // Email addresses
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // Phone numbers (various formats)
  phone: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  
  // Credit card numbers (basic pattern)
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  
  // Social Insurance Number (Canadian SIN)
  sin: /\b\d{3}[-\s]?\d{3}[-\s]?\d{3}\b/g,
  
  // IP addresses
  ipv4: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
  ipv6: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,
  
  // Postal codes (Canadian and US)
  postalCode: /\b[A-Z]\d[A-Z]\s?\d[A-Z]\d\b/gi,
  zipCode: /\b\d{5}(?:-\d{4})?\b/g,
  
  // Stripe tokens and IDs
  stripeToken: /\b(?:tok|src|card|cus|ch|pi|pm|ba|acct)_[A-Za-z0-9]{24,}\b/g,
  
  // JWT tokens
  jwt: /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
  
  // API keys (common patterns)
  apiKey: /\b(?:api[_-]?key|apikey|access[_-]?token)[:\s]*['"]*([A-Za-z0-9_-]{20,})['"]*\b/gi,
  
  // Passwords in common formats
  password: /\b(?:password|passwd|pwd)[:\s]*['"]*([^\s'"]{6,})['"]*\b/gi,
}

/**
 * Redact PII from a string
 */
export function redactPII(
  text: string,
  options: {
    redactEmails?: boolean
    redactPhones?: boolean
    redactCreditCards?: boolean
    redactIPs?: boolean
    redactTokens?: boolean
    redactPostalCodes?: boolean
    customPatterns?: RegExp[]
  } = {}
): string {
  const {
    redactEmails = true,
    redactPhones = true,
    redactCreditCards = true,
    redactIPs = isPrivacyStrict(),
    redactTokens = true,
    redactPostalCodes = false,
    customPatterns = [],
  } = options

  let redacted = text

  if (redactEmails) {
    redacted = redacted.replace(PII_PATTERNS.email, (match) => {
      const [localPart, domain] = match.split('@')
      const visibleChars = Math.min(2, localPart.length)
      return `${localPart.substring(0, visibleChars)}***@${domain}`
    })
  }

  if (redactPhones) {
    redacted = redacted.replace(PII_PATTERNS.phone, '***-***-****')
  }

  if (redactCreditCards) {
    redacted = redacted.replace(PII_PATTERNS.creditCard, (match) => {
      const cleaned = match.replace(/[-\s]/g, '')
      return `****-****-****-${cleaned.slice(-4)}`
    })
    // Also redact SIN numbers
    redacted = redacted.replace(PII_PATTERNS.sin, '***-***-***')
  }

  if (redactIPs) {
    redacted = redacted.replace(PII_PATTERNS.ipv4, '***.***.***.**')
    redacted = redacted.replace(PII_PATTERNS.ipv6, '****:****:****:****')
  }

  if (redactTokens) {
    redacted = redacted.replace(PII_PATTERNS.stripeToken, (match) => {
      const [prefix] = match.split('_')
      return `${prefix}_***REDACTED***`
    })
    redacted = redacted.replace(PII_PATTERNS.jwt, 'eyJ***REDACTED***')
    redacted = redacted.replace(PII_PATTERNS.apiKey, (match, key) => {
      return match.replace(key, '***REDACTED***')
    })
    redacted = redacted.replace(PII_PATTERNS.password, (match, pwd) => {
      return match.replace(pwd, '***REDACTED***')
    })
  }

  if (redactPostalCodes) {
    redacted = redacted.replace(PII_PATTERNS.postalCode, '***-***')
    redacted = redacted.replace(PII_PATTERNS.zipCode, '*****')
  }

  // Apply custom patterns
  for (const pattern of customPatterns) {
    redacted = redacted.replace(pattern, '***REDACTED***')
  }

  return redacted
}

/**
 * Redact PII from objects (recursively)
 */
export function redactObjectPII(
  obj: any,
  options?: Parameters<typeof redactPII>[1]
): any {
  if (typeof obj === 'string') {
    return redactPII(obj, options)
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactObjectPII(item, options))
  }

  if (obj && typeof obj === 'object') {
    const redacted: any = {}
    for (const [key, value] of Object.entries(obj)) {
      // Completely redact known sensitive fields
      if (['password', 'secret', 'token', 'apiKey', 'privateKey'].includes(key)) {
        redacted[key] = '***REDACTED***'
      } else {
        redacted[key] = redactObjectPII(value, options)
      }
    }
    return redacted
  }

  return obj
}

/**
 * Hash email for analytics (GDPR-compliant pseudonymization)
 */
export async function hashEmail(email: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(email.toLowerCase().trim())
  
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
  
  // Fallback for Node.js environment
  const nodeCrypto = require('crypto')
  return nodeCrypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex')
}

/**
 * Anonymize IP address (keep first 3 octets for IPv4, first 4 groups for IPv6)
 */
export function anonymizeIP(ip: string): string {
  // IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.')
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`
    }
  }
  
  // IPv6
  if (ip.includes(':')) {
    const parts = ip.split(':')
    if (parts.length >= 4) {
      return `${parts.slice(0, 4).join(':')}:0:0:0:0`
    }
  }
  
  return '0.0.0.0'
}

/**
 * Check if a string contains PII
 */
export function containsPII(text: string): boolean {
  return (
    PII_PATTERNS.email.test(text) ||
    PII_PATTERNS.phone.test(text) ||
    PII_PATTERNS.creditCard.test(text) ||
    PII_PATTERNS.sin.test(text) ||
    PII_PATTERNS.stripeToken.test(text) ||
    PII_PATTERNS.jwt.test(text) ||
    PII_PATTERNS.apiKey.test(text) ||
    PII_PATTERNS.password.test(text)
  )
}

/**
 * Safe logger that auto-redacts PII
 */
export function safeLog(message: string, data?: any) {
  const redactedMessage = redactPII(message)
  const redactedData = data ? redactObjectPII(data) : undefined
  
  if (process.env.NODE_ENV === 'development' && !isPrivacyStrict()) {
    console.log(redactedMessage, redactedData)
  } else {
    // In production or strict mode, only log if no PII detected
    if (!containsPII(message) && (!data || !containsPII(JSON.stringify(data)))) {
      console.log(redactedMessage, redactedData)
    }
  }
}

/**
 * Safe error logger
 */
export function safeErrorLog(error: Error, context?: any) {
  const redactedMessage = redactPII(error.message)
  const redactedContext = context ? redactObjectPII(context) : undefined
  
  console.error(redactedMessage, redactedContext)
  
  // In privacy-strict mode, don't log stack traces that might contain PII
  if (!isPrivacyStrict()) {
    console.error(error.stack)
  }
}

/**
 * Differential privacy: Add noise to numeric data
 */
export function addDifferentialPrivacyNoise(
  value: number,
  epsilon: number = 0.1
): number {
  // Laplace mechanism for differential privacy
  const sensitivity = 1
  const scale = sensitivity / epsilon
  
  // Generate Laplace noise
  const u = Math.random() - 0.5
  const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u))
  
  return Math.round(value + noise)
}

/**
 * K-anonymity: Check if dataset meets k-anonymity requirements
 */
export function meetsKAnonymity(
  dataset: any[],
  quasiIdentifiers: string[],
  k: number = 5
): boolean {
  const groups = new Map<string, number>()
  
  for (const record of dataset) {
    const key = quasiIdentifiers
      .map(field => record[field])
      .join('|')
    groups.set(key, (groups.get(key) || 0) + 1)
  }
  
  // Check if all groups have at least k members
  return Array.from(groups.values()).every(count => count >= k)
}
