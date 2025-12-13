// app/api/room/leave/route.ts
import { NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export async function POST(req: NextRequest) {
  const { roomId } = await req.json()
  const token = req.cookies.get("x-auth-token")?.value

  if (!roomId || !token) {
    return NextResponse.json({ success: false }, { status: 400 })
  }

  const roomKey = `room:${roomId}:users`

  // FIX: Use 'srem' (Set Remove) to match the Middleware's 'sadd'
  await redis.srem(roomKey, token)

  return NextResponse.json({ success: true })
}