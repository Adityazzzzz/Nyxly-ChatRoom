"use client"

import React from "react"

interface PrivacyShieldOverlayProps {
  isShielded: boolean
  reason?: string | null
  onDismiss?: () => void
}

export const PrivacyShieldOverlay: React.FC<PrivacyShieldOverlayProps> = ({
  isShielded,
  reason,
  onDismiss,
}) => {
  if (!isShielded) return null

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black/98 backdrop-blur-3xl text-center p-6 select-none transition-all duration-150"
    >
      <div className="max-w-md w-full border border-green-500/40 bg-zinc-950/95 p-8 shadow-2xl shadow-green-500/20 space-y-6 rounded-lg">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 border border-green-500/40 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-green-500 animate-pulse"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-bold tracking-wider text-green-400 font-mono">
            PRIVACY SHIELD ENGAGED
          </h2>
          <p className="text-xs text-zinc-300 font-mono leading-relaxed">
            {reason || "Content obscured to prevent background capture, recording, or window snooping."}
          </p>
        </div>

        <div className="pt-3 border-t border-zinc-800">
          <p className="text-[11px] text-zinc-500 font-mono">
            Click anywhere or focus this window to resume
          </p>
        </div>
      </div>
    </div>
  )
}

interface CaptureAlertToastProps {
  alert: string | null
}

export const CaptureAlertToast: React.FC<CaptureAlertToastProps> = ({ alert }) => {
  if (!alert) return null

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] animate-bounce">
      <div className="bg-red-950/95 border border-red-500 text-red-200 px-5 py-2.5 shadow-2xl text-xs font-mono font-bold flex items-center gap-3 backdrop-blur-md rounded">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
        <span>{alert}</span>
      </div>
    </div>
  )
}
