"use client"

import { useUsername } from "@/hooks/use-username"
import { usePrivacyShield } from "@/hooks/use-privacy-shield"
import { client } from "@/lib/client"
import { useRealtime } from "@/lib/realtime-client"
import { decryptMessage, encryptMessage, getKeyFromFragment } from "@/lib/crypto"
import { PrivacyShieldOverlay, CaptureAlertToast } from "@/components/privacy-shield-overlay"
import { WatermarkOverlay } from "@/components/watermark-overlay"
import { ShieldStatusBadge } from "@/components/shield-status-badge"
import { useMutation, useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState, useMemo } from "react"

function formatTimeRemaining(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

interface DecryptedMessageItem {
  id: string
  sender: string
  text: string
  timestamp: number
  roomId: string
  token?: string
}

const Page = () => {
  const params = useParams()
  const roomId = params.roomId as string
  const router = useRouter()

  const { username } = useUsername()
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const [copyStatus, setCopyStatus] = useState("COPY")
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null)

  // Initialize privacy shield hook
  const {
    isShielded,
    shieldReason,
    captureAlert,
    isStrict,
    setIsStrict,
    unshield,
  } = usePrivacyShield()

  // Extract E2EE key from URL fragment #key=...
  useEffect(() => {
    const key = getKeyFromFragment()
    if (key) {
      setEncryptionKey(key)
    }
  }, [])

  const { data: ttlData } = useQuery({
    queryKey: ["ttl", roomId],
    queryFn: async () => {
      const res = await client.room.ttl.get({ query: { roomId } })
      return res.data
    },
  })

  useEffect(() => {
    if (ttlData?.ttl !== undefined) setTimeRemaining(ttlData.ttl)
  }, [ttlData])

  useEffect(() => {
    if (timeRemaining === null || timeRemaining < 0) return

    if (timeRemaining === 0) {
      router.push("/?destroyed=true")
      return
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeRemaining, router])

  const { data: messagesData, refetch } = useQuery({
    queryKey: ["messages", roomId],
    queryFn: async () => {
      const res = await client.messages.get({ query: { roomId } })
      return res.data
    },
  })

  // Decrypt incoming messages client-side with E2EE key
  const [decryptedMessages, setDecryptedMessages] = useState<DecryptedMessageItem[]>([])

  useEffect(() => {
    let isCancelled = false

    const decryptAll = async () => {
      if (!messagesData?.messages) {
        setDecryptedMessages([])
        return
      }

      const list = await Promise.all(
        messagesData.messages.map(async (msg) => {
          const plainText = encryptionKey
            ? await decryptMessage(msg.text, encryptionKey)
            : msg.text
          return {
            ...msg,
            text: plainText,
          }
        })
      )

      if (!isCancelled) {
        setDecryptedMessages(list)
      }
    }

    decryptAll()

    return () => {
      isCancelled = true
    }
  }, [messagesData, encryptionKey])

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async ({ text }: { text: string }) => {
      // Encrypt message client-side before dispatching to server/Redis
      const payloadText = encryptionKey
        ? await encryptMessage(text, encryptionKey)
        : text

      await client.messages.post(
        { sender: username, text: payloadText },
        { query: { roomId } }
      )

      setInput("")
    },
  })

  useRealtime({
    channels: [roomId],
    events: ["chat.message", "chat.destroy"],
    onData: ({ event }) => {
      if (event === "chat.message") {
        refetch()
      }

      if (event === "chat.destroy") {
        router.push("/?destroyed=true")
      }
    },
  })

  const { mutate: destroyRoom } = useMutation({
    mutationFn: async () => {
      await client.room.delete(null, { query: { roomId } })
    },
  })

  const copyLink = () => {
    // Copy the full URL including hash #key=... so invitees join with E2EE key
    const url = window.location.href
    navigator.clipboard.writeText(url)
    setCopyStatus("COPIED!")
    setTimeout(() => setCopyStatus("COPY"), 2000)
  }

  return (
    <main
      onContextMenu={(e) => e.preventDefault()}
      className={`flex flex-col h-screen max-h-screen overflow-hidden privacy-protected ${
        isShielded ? "privacy-blur" : ""
      }`}
    >
      {/* Dynamic forensic watermark layer */}
      <WatermarkOverlay username={username} roomId={roomId} />

      {/* Instant capture / unfocus blackout overlay */}
      <PrivacyShieldOverlay
        isShielded={isShielded}
        reason={shieldReason}
        onDismiss={unshield}
      />

      {/* Floating Capture Detection Alert Toast */}
      <CaptureAlertToast alert={captureAlert} />

      {/* HEADER */}
      <header className="border-b border-zinc-800 p-4 flex items-center justify-between bg-zinc-900/40 backdrop-blur relative z-20">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-zinc-500 uppercase">Room ID</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-green-500 truncate">
                {roomId.slice(0, 10) + "..."}
              </span>
              <button
                onClick={copyLink}
                className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-200 transition-colors font-mono cursor-pointer"
              >
                {copyStatus}
              </button>
            </div>
          </div>

          <div className="h-8 w-px bg-zinc-800" />

          <div className="flex flex-col">
            <span className="text-xs text-zinc-500 uppercase">Self-Destruct</span>
            <span
              className={`text-sm font-bold flex items-center gap-2 ${
                timeRemaining !== null && timeRemaining < 60
                  ? "text-red-500"
                  : "text-amber-500"
              }`}
            >
              {timeRemaining !== null ? formatTimeRemaining(timeRemaining) : "--:--"}
            </span>
          </div>

          <div className="h-8 w-px bg-zinc-800 hidden sm:block" />

          {/* Privacy & E2EE Shield Status Indicator */}
          <div className="hidden sm:block">
            <ShieldStatusBadge
              isStrict={isStrict}
              onToggleStrict={setIsStrict}
              isE2EE={!!encryptionKey}
            />
          </div>
        </div>

        <button
          onClick={() => destroyRoom()}
          className="text-xs bg-zinc-800 hover:bg-red-600 px-3 py-1.5 rounded text-zinc-400 hover:text-white font-bold transition-all group flex items-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          <span className="group-hover:animate-pulse">💣</span>
          DESTROY NOW
        </button>
      </header>

      {/* MESSAGES VIEWPORT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin relative z-20 select-none">
        {decryptedMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-2">
            <p className="text-zinc-600 text-sm font-mono">
              No messages yet, start the conversation.
            </p>
            <p className="text-[11px] text-zinc-700 font-mono">
              🔒 Zero-knowledge E2EE and Anti-capture shield are active.
            </p>
          </div>
        )}

        {decryptedMessages.map((msg) => (
          <div key={msg.id} className="flex flex-col items-start select-none">
            <div className="max-w-[80%] group">
              <div className="flex items-baseline gap-3 mb-1">
                <span
                  className={`text-xs font-bold font-mono ${
                    msg.sender === username ? "text-green-500" : "text-blue-500"
                  }`}
                >
                  {msg.sender === username ? "YOU" : msg.sender}
                </span>

                <span className="text-[10px] text-zinc-600 font-mono">
                  {format(msg.timestamp, "HH:mm")}
                </span>
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed break-words font-sans selection:bg-transparent">
                {msg.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* INPUT AREA WITH AI SCRAPER LOCKS */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/40 backdrop-blur relative z-20">
        <div className="flex gap-4">
          <div className="flex-1 relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 animate-pulse font-mono">
              {">"}
            </span>
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={input}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-gramm="false"
              data-gramm_editor="false"
              data-enable-grammarly="false"
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim() && !isPending) {
                  sendMessage({ text: input })
                  inputRef.current?.focus()
                }
              }}
              placeholder="Type encrypted message..."
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-black border border-zinc-800 focus:border-zinc-700 focus:outline-none transition-colors text-zinc-100 placeholder:text-zinc-700 py-3 pl-8 pr-4 text-sm font-mono"
            />
          </div>

          <button
            onClick={() => {
              if (input.trim() && !isPending) {
                sendMessage({ text: input })
                inputRef.current?.focus()
              }
            }}
            disabled={!input.trim() || isPending}
            className="bg-zinc-800 text-zinc-400 px-6 text-sm font-bold hover:text-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-mono"
          >
            SEND
          </button>
        </div>
      </div>
    </main>
  )
}

export default Page
