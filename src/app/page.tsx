"use client"

import { useUsername } from "@/hooks/use-username"
import { client } from "@/lib/client"
import { generateRoomKey } from "@/lib/crypto"
import { useMutation } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"

const Page = () => {
  return (
    <Suspense>
      <Lobby />
    </Suspense>
  )
}

export default Page

function Lobby() {
  const { username } = useUsername()
  const router = useRouter()

  const searchParams = useSearchParams()
  const wasDestroyed = searchParams.get("destroyed") === "true"
  const error = searchParams.get("error")
  const [isCreating, setIsCreating] = useState(false)

  const { mutate: createRoom, isPending } = useMutation({
    mutationFn: async () => {
      setIsCreating(true)
      try {
        // 1. Generate client-side E2EE cryptographic key (AES-GCM 256)
        const e2eeKey = await generateRoomKey()

        // 2. Request new room ID from backend
        const res = await client.room.create.post()

        if (res.status === 200 && res.data?.roomId) {
          // 3. Navigate with key in URL fragment (#key=...)
          // The fragment is never transmitted over HTTP to server or Redis
          router.push(`/room/${res.data.roomId}#key=${encodeURIComponent(e2eeKey)}`)
        }
      } finally {
        setIsCreating(false)
      }
    },
  })

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 font-mono">
        {wasDestroyed && (
          <div className="bg-red-950/50 border border-red-900 p-4 text-center">
            <p className="text-red-500 text-sm font-bold">ROOM DESTROYED</p>
            <p className="text-zinc-500 text-xs mt-1">
              All messages and room keys were permanently wiped.
            </p>
          </div>
        )}
        {error === "room-not-found" && (
          <div className="bg-red-950/50 border border-red-900 p-4 text-center">
            <p className="text-red-500 text-sm font-bold">ROOM NOT FOUND</p>
            <p className="text-zinc-500 text-xs mt-1">
              This room may have expired or never existed.
            </p>
          </div>
        )}
        {error === "room-full" && (
          <div className="bg-red-950/50 border border-red-900 p-4 text-center">
            <p className="text-red-500 text-sm font-bold">ROOM FULL</p>
            <p className="text-zinc-500 text-xs mt-1">
              This room is at maximum participant capacity.
            </p>
          </div>
        )}

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-green-500">
            Nyxly
            <span className="block text-xl font-bold tracking-tight text-green-400">
              {">"}private_chat
            </span>
          </h1>

          <p className="text-zinc-500 text-xs">
            Zero-knowledge, anti-capture, self-destructing chat rooms.
          </p>
        </div>

        <div className="border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-md space-y-6">
          <div className="space-y-2">
            <label className="flex items-center text-xs text-zinc-500 uppercase tracking-wider">
              Your Identity
            </label>

            <div className="flex items-center gap-3">
              <div className="flex-1 bg-zinc-950 border border-zinc-800 p-3 text-xs text-zinc-400 font-mono select-none">
                {username || "Generating..."}
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-800/80 pt-4 space-y-2 text-[11px] text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>AES-256 Client E2EE (Zero Server / AI visibility)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Anti-Screenshot & Background Obfuscation</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span>Automatic 10-Minute Ephemeral Wipe</span>
            </div>
          </div>

          <button
            onClick={() => createRoom()}
            disabled={isPending || isCreating}
            className="w-full bg-zinc-100 text-black p-3 text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50 tracking-wider uppercase"
          >
            {isPending || isCreating ? "GENERATING SECURE ROOM..." : "CREATE SECURE ROOM"}
          </button>
        </div>
      </div>
    </main>
  )
}
