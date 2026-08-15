# Nyxly - Zero-Knowledge Private & Ephemeral Chat

Nyxly is a state-of-the-art, private, self-destructing web chat application engineered with **Zero-Knowledge Client-Side Cryptography (E2EE)**, **Anti-Screenshot / Anti-Recording Shielding**, and **Automatic Ephemeral Data Destruction**.

---

## 🛡️ Core Privacy & Security Architecture

### 1. Zero-Knowledge Client-Side E2EE (AES-GCM 256)
* **Zero Server / AI Visibility**: Messages are encrypted directly in the user's browser using AES-GCM 256-bit cryptography via the native Web Crypto API before transmission.
* **URL Fragment Key Passing**: Cryptographic keys are passed via URL hash fragments (`/room/[roomId]#key=...`). URL fragments are never sent over HTTP to servers, Redis, cloud providers, or AI scrapers.
* **Opaque Storage**: The server and Redis only ever handle opaque encrypted base64 envelopes.

### 2. Multi-Layer Anti-Screenshot & Screen-Recording Shield
* **Instant Window Blur & Visibility Shield**: If the user unfocuses the browser window, switches apps, Alt-Tabs, or triggers the Snipping Tool, the entire viewport is instantaneously blacked out with a security shield.
* **PrintScreen Interception & Clipboard Sanitization**: Detecting the `PrintScreen` key immediately blanks the screen for protection, triggers a warning toast, and sanitizes the system clipboard (`navigator.clipboard.writeText("")`).
* **Print & PDF Export Blanking**: CSS `@media print` rules enforce a complete blackout so Save-to-PDF / printing yields zero chat data.
* **Anti-Selection & Context Menu Lock**: Disables text selection and right-click context menu within the chat interface.
* **AI Scraper & Assistant Defense**: Message input fields explicitly disable autofill, autocomplete, spellcheck scrapers, and browser AI crawlers (`data-gramm="false"`, `spellCheck="false"`).
* **Forensic Dynamic Watermark**: Subtle repeating background watermark with viewer identity and session stamps to deter external physical camera photos.

### 3. Ephemeral 10-Minute Auto-Destruction
* **Redis TTL Expiration**: Rooms and message lists have a strict 10-minute time-to-live (`ROOM_TTL_SECONDS = 600`).
* **Manual Immediate Wipe**: Clicking **"Destroy Now"** permanently purges all Redis keys immediately.
* **Zero Client Persistence**: No chat messages are ever stored in `localStorage`, `sessionStorage`, or `IndexedDB`. When the room expires, the browser redirects to the lobby and discards all in-memory keys and messages.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ or Bun
- Upstash Redis account (for ephemeral pub-sub and TTL metadata)

### Environment Variables
Create a `.env` file in the root:
```env
UPSTASH_REDIS_REST_URL="your-upstash-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
```

### Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
