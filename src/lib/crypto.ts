/**
 * Zero-Knowledge Client-Side Cryptography (E2EE)
 * Uses AES-GCM 256-bit encryption via Web Crypto API.
 * Keys are passed solely via URL fragments (#key=...) which are NEVER sent to servers,
 * proxies, databases, or AI scrapers.
 */

// Generate a cryptographic 256-bit key for client-side E2EE
export async function generateRoomKey(): Promise<string> {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    // Fallback for non-browser environments
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return bufferToBase64(array)
  }
  const key = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  )
  const exported = await window.crypto.subtle.exportKey("raw", key)
  return bufferToBase64(exported)
}

// Convert ArrayBuffer to URL-safe Base64
function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

// Convert URL-safe Base64 to ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
  let padded = base64.replace(/-/g, "+").replace(/_/g, "/")
  while (padded.length % 4) {
    padded += "="
  }
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

// Import raw key into CryptoKey
async function importKey(rawKey: string): Promise<CryptoKey> {
  const keyData = base64ToBuffer(rawKey)
  return await window.crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  )
}

/**
 * Encrypt a plaintext message.
 * Returns a JSON-stringified base64 envelope containing the IV and ciphertext.
 */
export async function encryptMessage(text: string, rawKey: string): Promise<string> {
  if (typeof window === "undefined" || !window.crypto?.subtle || !rawKey) {
    return text
  }

  try {
    const cryptoKey = await importKey(rawKey)
    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    const encoded = new TextEncoder().encode(text)

    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      encoded
    )

    const envelope = {
      v: 1, // E2EE version
      iv: bufferToBase64(iv),
      ct: bufferToBase64(cipherBuffer),
    }

    return `e2ee:${btoa(JSON.stringify(envelope))}`
  } catch (error) {
    console.error("Encryption failed:", error)
    return text
  }
}

/**
 * Decrypt an E2EE encrypted message.
 * Returns decrypted plaintext, or a fallback warning if decryption fails.
 */
export async function decryptMessage(payload: string, rawKey: string): Promise<string> {
  if (!payload || !payload.startsWith("e2ee:")) {
    // Plaintext message (backward compatibility)
    return payload
  }

  if (typeof window === "undefined" || !window.crypto?.subtle || !rawKey) {
    return "🔒 [Encrypted Message - Missing Key]"
  }

  try {
    const jsonStr = atob(payload.slice(5))
    const envelope = JSON.parse(jsonStr)

    if (!envelope.iv || !envelope.ct) {
      return "🔒 [Malformed Encrypted Message]"
    }

    const cryptoKey = await importKey(rawKey)
    const iv = base64ToBuffer(envelope.iv)
    const ciphertext = base64ToBuffer(envelope.ct)

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      cryptoKey,
      ciphertext
    )

    return new TextDecoder().decode(decryptedBuffer)
  } catch {
    return "🔒 [Decryption Failed - Invalid Key]"
  }
}

/**
 * Extract encryption key from URL fragment (#key=...)
 */
export function getKeyFromFragment(): string | null {
  if (typeof window === "undefined") return null
  const hash = window.location.hash
  if (!hash) return null
  const match = hash.match(/key=([^&]+)/)
  return match ? decodeURIComponent(match[1]) : null
}
