"use client"

import React, { useMemo } from "react"

interface WatermarkOverlayProps {
  username: string
  roomId: string
}

export const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({
  username,
  roomId,
}) => {
  // Generate a repeating grid of watermark tags
  const watermarkText = useMemo(() => {
    const shortRoom = roomId.slice(0, 8)
    return `${username || "ANONYMOUS"} • ${shortRoom}`
  }, [username, roomId])

  const items = useMemo(() => {
    return Array.from({ length: 48 }, (_, i) => i)
  }, [])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-10 select-none overflow-hidden opacity-[0.04] transition-opacity duration-300"
    >
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-16 p-8 -rotate-12 scale-125 origin-center">
        {items.map((i) => (
          <div
            key={i}
            className="text-[11px] font-mono font-bold tracking-widest text-zinc-100 uppercase whitespace-nowrap"
          >
            {watermarkText}
          </div>
        ))}
      </div>
    </div>
  )
}
