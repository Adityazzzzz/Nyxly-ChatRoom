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
import { useEffect, useRef, useState } from "react"

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

  // Initialize privacy shield hook with strictMode default on
  const {
    isShielded,
    shieldReason,
    captureAlert,
    isStrict,
    setIsStrict,
    unshield,
  } = usePrivacyShield({ strictMode: true })

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
    const url = window.location.href
    navigator.clipboard.writeText(url)
    setCopyStatus("COPIED!")
    setTimeout(() => setCopyStatus("COPY"), 2000)
  }

  return (
    <main
      onContextMenu={(e) => e.preventDefault()}
      className={`flex flex-col h-screen max-h-screen overflow-hidden bg-black text-zinc-100 privacy-protected ${
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
      <header className="border-b border-zinc-800 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 bg-zinc-950/80 backdrop-blur relative z-20">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Room ID</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-green-400 truncate font-mono">
                {roomId.slice(0, 8) + "..."}
              </span>
              <button
                onClick={copyLink}
                className="text-[10px] bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-2 py-0.5 rounded text-zinc-300 hover:text-white transition-colors font-mono cursor-pointer"
              >
                {copyStatus}
              </button>
            </div>
          </div>

          <div className="h-7 w-px bg-zinc-800" />

          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Self-Destruct</span>
            <span
              className={`text-xs sm:text-sm font-bold flex items-center font-mono ${
                timeRemaining !== null && timeRemaining < 60
                  ? "text-red-500"
                  : "text-amber-400"
              }`}
            >
              {timeRemaining !== null ? formatTimeRemaining(timeRemaining) : "--:--"}
            </span>
          </div>

          <div className="h-7 w-px bg-zinc-800" />

          {/* Privacy & E2EE Shield Status Indicator */}
          <ShieldStatusBadge
            isStrict={isStrict}
            onToggleStrict={setIsStrict}
            isE2EE={!!encryptionKey}
          />
        </div>

        <button
          onClick={() => destroyRoom()}
          className="text-xs bg-red-950/40 border border-red-800/80 hover:bg-red-900/60 px-3 py-1.5 rounded text-red-300 hover:text-white font-bold transition-all group flex items-center gap-2 disabled:opacity-50 cursor-pointer font-mono ml-auto"
        >
          <span className="group-hover:animate-pulse">💣</span>
          DESTROY NOW
        </button>
      </header>

      {/* MESSAGES VIEWPORT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin relative z-20 select-none">
        {decryptedMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-2 select-none">
            <p className="text-zinc-500 text-sm font-mono">
              No messages yet, start the conversation.
            </p>
            <p className="text-[11px] text-zinc-600 font-mono">
              🔒 Zero-knowledge E2EE and Anti-capture shield are active.
            </p>
          </div>
        )}

        {decryptedMessages.map((msg) => (
          <div key={msg.id} className="flex flex-col items-start select-none">
            <div className="max-w-[85%] group bg-zinc-950/60 border border-zinc-900 px-3.5 py-2 rounded">
              <div className="flex items-baseline gap-3 mb-1">
                <span
                  className={`text-xs font-bold font-mono ${
                    msg.sender === username ? "text-green-400" : "text-blue-400"
                  }`}
                >
                  {msg.sender === username ? "YOU" : msg.sender}
                </span>

                <span className="text-[10px] text-zinc-500 font-mono">
                  {format(msg.timestamp, "HH:mm")}
                </span>
              </div>

              <p className="text-sm text-zinc-200 leading-relaxed break-words font-sans selection:bg-transparent">
                {msg.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* INPUT AREA WITH AI SCRAPER & EXTENSION SHIELDS */}
      <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur relative z-20">
        <div className="flex gap-3">
          <div className="flex-1 relative group">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-green-500 font-mono text-sm pointer-events-none z-10">
              {">"}
            </span>
            <input
              ref={inputRef}
              autoFocus
              type="text"
              name="chat_message_e2ee"
              id="chat_message_input"
              value={input}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-gramm="false"
              data-gramm_editor="false"
              data-enable-grammarly="false"
              data-1p-ignore="true"
              data-lpignore="true"
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim() && !isPending) {
                  sendMessage({ text: input })
                  inputRef.current?.focus()
                }
              }}
              placeholder="Type encrypted message..."
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-green-500/50 focus:outline-none transition-colors text-zinc-100 placeholder:text-zinc-600 py-2.5 pl-8 pr-4 text-sm font-mono rounded"
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
            className="bg-zinc-100 hover:bg-zinc-200 text-black px-5 sm:px-6 text-xs sm:text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer font-mono rounded uppercase"
          >
            SEND
          </button>
        </div>
      </div>
    </main>
  )
}

export default Page
