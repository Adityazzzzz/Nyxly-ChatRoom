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
        className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900/90 hover:bg-zinc-800 border border-green-500/40 hover:border-green-500/80 transition-colors text-[11px] font-mono text-green-400 font-semibold cursor-pointer rounded"
        title="View Active Security & Privacy Protections"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
        <span>SHIELD ACTIVE</span>
      </button>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full max-h-[90vh] overflow-y-auto border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-5 text-left font-mono my-auto rounded-lg scrollbar-thin"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-green-500 text-lg">🛡️</span>
                <h3 className="font-bold text-sm text-zinc-100 uppercase tracking-wide">
                  Privacy Shield Specs
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 text-xs px-2 py-1 bg-zinc-900 border border-zinc-700 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-400">
              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded space-y-1">
                <div className="flex items-center gap-2 text-green-400 font-bold">
                  <span>🔒</span>
                  <span>Zero-Knowledge E2EE ({isE2EE ? "ACTIVE" : "STANDARD"})</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  AES-GCM 256 client encryption. Keys are never sent to servers, databases, or AI models.
                </p>
              </div>

              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded space-y-1">
                <div className="flex items-center gap-2 text-green-400 font-bold">
                  <span>🚫</span>
                  <span>Anti-Capture & Snipping Shield</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Immediate blackout on Win+Shift+S, PrintScreen, window blur, or app switching.
                </p>
              </div>

              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded space-y-1">
                <div className="flex items-center gap-2 text-green-400 font-bold">
                  <span>🖨️</span>
                  <span>Anti-Print & Save Lock</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Print to PDF, Webpage saving, and context menu inspection are disabled.
                </p>
              </div>

              <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded space-y-1">
                <div className="flex items-center gap-2 text-green-400 font-bold">
                  <span>🤖</span>
                  <span>AI / Assistant Scraper Defense</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Input fields block autocomplete, spellcheck scrapers, and browser AI crawlers.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
              <label className="text-xs text-zinc-200 flex flex-col cursor-pointer">
                <span className="font-bold">Strict Viewport Shield</span>
                <span className="text-[10px] text-zinc-400">Blur screen if mouse leaves browser window</span>
              </label>
              <input
                type="checkbox"
                checked={isStrict}
                onChange={(e) => onToggleStrict(e.target.checked)}
                className="w-4 h-4 accent-green-500 cursor-pointer ml-4"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
