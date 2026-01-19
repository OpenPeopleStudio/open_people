'use client'

import { useState } from 'react'

type NewsletterProps = {
  title?: string
  description?: string
  successMessage?: string
  allowMessage?: boolean
}

export function Newsletter({
  title = 'updates',
  description = 'leave your email to be notified.',
  successMessage = 'thank you. we\'ll be in touch.',
  allowMessage = true,
}: NewsletterProps) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [showMessage, setShowMessage] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [feedback, setFeedback] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) return

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setFeedback('please enter a valid email address.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setFeedback('')

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), message: message.trim() }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          setFeedback('this email is already registered.')
          setStatus('error')
        } else {
          throw new Error(result.error || 'Failed to subscribe')
        }
      } else {
        setFeedback(message ? 'thank you for your message. we\'ll be in touch.' : successMessage)
        setStatus('success')
        setEmail('')
        setMessage('')
        setShowMessage(false)
      }
    } catch (error) {
      console.error('Newsletter error:', error)
      setFeedback('something went wrong. please try again.')
      setStatus('error')
    }
  }

  return (
    <section id="updates" className="section">
      <h2>{title}</h2>
      <p>{description}</p>
      
      <form onSubmit={handleSubmit} className="email-form">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          aria-label="Your email address"
          required
          disabled={status === 'loading' || status === 'success'}
          className="email-input"
        />
        
        <div className="form-buttons">
          <button
            type="submit"
            disabled={status === 'loading' || status === 'success'}
            className={`email-submit ${status === 'loading' ? 'loading' : ''} ${status === 'success' ? 'success' : ''} ${status === 'error' ? 'error' : ''}`}
          >
            submit
          </button>
          
          {allowMessage && (
            <button
              type="button"
              onClick={() => setShowMessage(!showMessage)}
              disabled={status === 'loading' || status === 'success'}
              className="message-toggle"
            >
              with a note
            </button>
          )}
        </div>

        {allowMessage && (
          <div className={`message-container ${showMessage ? 'visible' : ''}`}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="optional message..."
              aria-label="Optional message"
              maxLength={500}
              rows={3}
              disabled={status === 'loading' || status === 'success'}
              className="message-input"
            />
          </div>
        )}
      </form>

      {feedback && (
        <p
          className={`email-message ${status === 'success' ? 'success' : ''} ${status === 'error' ? 'error' : ''}`}
          aria-live="polite"
        >
          {feedback}
        </p>
      )}
    </section>
  )
}
