'use client'

import { useEffect } from 'react'

/**
 * Adds intersection observer for section animations
 */
export function SectionObserver() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    if (prefersReducedMotion) {
      // Make all sections visible immediately
      document.querySelectorAll('section').forEach(section => {
        section.classList.add('is-visible')
      })
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px',
      }
    )

    document.querySelectorAll('section').forEach((section) => {
      observer.observe(section)
    })

    return () => observer.disconnect()
  }, [])

  return null
}
