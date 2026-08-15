"use client"

import React, { useState } from "react"

interface ShieldStatusBadgeProps {
  isStrict: boolean
  onToggleStrict: (val: boolean) => void
  isE2EE: boolean
}

export const ShieldStatusBadge: React.FC<ShieldStatusBadgeProps> = ({
  isStrict,
  onToggleStrict,
  isE2EE,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/80 hover:bg-zinc-800 border border-green-500/30 hover:border-green-500/60 transition-colors text-[11px] font-mono text-green-400 font-semibold cursor-pointer rounded"
        title="View Active Security & Privacy Protections"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
        <span>SHIELD ACTIVE</span>
      </button>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-5 text-left font-mono"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-lg">🛡️</span>
                <h3 className="font-bold text-sm text-zinc-100 uppercase tracking-wide">
                  Privacy Shield Specifications
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs px-2 py-1 bg-zinc-900 border border-zinc-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-400">
              <div className="p-2.5 bg-zinc-900/50 border border-zinc-800 space-y-1">
                <div className="flex items-center gap-2 text-green-400 font-bold">
                  <span>🔒</span>
                  <span>Zero-Knowledge E2EE ({isE2EE ? "ACTIVE" : "STANDARD"})</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Messages are encrypted client-side with AES-GCM 256. Keys are never sent to servers, databases, or AI scrapers.
                </p>
              </div>

              <div className="p-2.5 bg-zinc-900/50 border border-zinc-800 space-y-1">
                <div className="flex items-center gap-2 text-green-400 font-bold">
                  <span>🚫</span>
                  <span>Anti-Screenshot & Blur Protection</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Instantly blacks out screen on window blur, Alt-Tab, or Snipping Tool capture. PrintScreen key triggers auto-clipboard wipe.
                </p>
              </div>

              <div className="p-2.5 bg-zinc-900/50 border border-zinc-800 space-y-1">
                <div className="flex items-center gap-2 text-green-400 font-bold">
                  <span>🖨️</span>
                  <span>Anti-Print & Save Lock</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Print to PDF, Webpage saving, and context menu inspections are strictly disabled.
                </p>
              </div>

              <div className="p-2.5 bg-zinc-900/50 border border-zinc-800 space-y-1">
                <div className="flex items-center gap-2 text-green-400 font-bold">
                  <span>🤖</span>
                  <span>AI / Assistant Scraper Defense</span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Input fields disable autocorrect, spellcheck scrapers, and browser AI crawlers.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <label className="text-xs text-zinc-300 flex flex-col">
                <span className="font-bold">Strict Viewport Shield</span>
                <span className="text-[10px] text-zinc-500">Blur screen if mouse leaves window</span>
              </label>
              <input
                type="checkbox"
                checked={isStrict}
                onChange={(e) => onToggleStrict(e.target.checked)}
                className="w-4 h-4 accent-green-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
