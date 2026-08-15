"use client"

import { useEffect, useState, useCallback } from "react"

interface PrivacyShieldOptions {
  strictMode?: boolean // If true, also shields when mouse leaves the window
  clipboardWipe?: boolean // Overwrite clipboard upon PrintScreen capture attempt
}

export const usePrivacyShield = (options: PrivacyShieldOptions = {}) => {
  const { strictMode = false, clipboardWipe = true } = options

  const [isShielded, setIsShielded] = useState(false)
  const [shieldReason, setShieldReason] = useState<string | null>(null)
  const [captureAlert, setCaptureAlert] = useState<string | null>(null)
  const [isStrict, setIsStrict] = useState(strictMode)

  const triggerShield = useCallback((reason: string) => {
    setIsShielded(true)
    setShieldReason(reason)
  }, [])

  const unshield = useCallback(() => {
    setIsShielded(false)
    setShieldReason(null)
  }, [])

  const wipeClipboard = useCallback(async () => {
    if (!clipboardWipe || typeof navigator === "undefined" || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText("")
    } catch {
      // Clipboard access might require active focus or permission
    }
  }, [clipboardWipe])

  useEffect(() => {
    if (typeof window === "undefined") return

    // 1. Focus loss & Tab visibility (Snipping tool, Alt-Tab, task switch)
    const handleBlur = () => {
      triggerShield("Window unfocused • Content protected from background capture")
    }

    const handleFocus = () => {
      // Restore view when user focuses back
      unshield()
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerShield("Tab inactive • Screen obscured for privacy")
      } else {
        unshield()
      }
    }

    // 2. Keyboard shortcuts interception
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen detection (Windows PrintScreen / Win+Shift+S trigger)
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        triggerShield("Screen capture detected • Shield engaged")
        setCaptureAlert("⚠️ Screenshot attempt blocked & clipboard sanitized.")
        wipeClipboard()

        setTimeout(() => {
          setCaptureAlert(null)
          unshield()
        }, 2000)
        return
      }

      // Block Ctrl+P / Cmd+P (Print to PDF / Printer)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault()
        e.stopPropagation()
        setCaptureAlert("⚠️ Printing is permanently disabled for privacy.")
        setTimeout(() => setCaptureAlert(null), 3000)
        return
      }

      // Block Ctrl+S / Cmd+S (Save webpage to disk)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        e.stopPropagation()
        setCaptureAlert("⚠️ Saving webpage is disabled.")
        setTimeout(() => setCaptureAlert(null), 3000)
        return
      }

      // Block F12 and inspect shortcuts
      if (
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key.toLowerCase() === "i" || e.key.toLowerCase() === "j" || e.key.toLowerCase() === "c"))
      ) {
        e.preventDefault()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        wipeClipboard()
      }
    }

    // 3. Mouse Leave window (Strict mode)
    const handleMouseLeave = (e: MouseEvent) => {
      if (isStrict && !e.relatedTarget && e.clientY <= 0) {
        triggerShield("Cursor left viewport • Strict Privacy Shield active")
      }
    }

    const handleMouseEnter = () => {
      if (isStrict) {
        unshield()
      }
    }

    window.addEventListener("blur", handleBlur)
    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("keydown", handleKeyDown, true)
    window.addEventListener("keyup", handleKeyUp, true)
    document.addEventListener("mouseleave", handleMouseLeave)
    document.addEventListener("mouseenter", handleMouseEnter)

    return () => {
      window.removeEventListener("blur", handleBlur)
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("keydown", handleKeyDown, true)
      window.removeEventListener("keyup", handleKeyUp, true)
      document.removeEventListener("mouseleave", handleMouseLeave)
      document.removeEventListener("mouseenter", handleMouseEnter)
    }
  }, [triggerShield, unshield, wipeClipboard, isStrict])

  return {
    isShielded,
    shieldReason,
    captureAlert,
    isStrict,
    setIsStrict,
    triggerShield,
    unshield,
  }
}
