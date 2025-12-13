import { NextRequest, NextResponse } from "next/server"
import { redis } from "./lib/redis"
import { nanoid } from "nanoid"

export const proxy = async (req: NextRequest) => {
  const pathname = req.nextUrl.pathname

  const roomMatch = pathname.match(/^\/room\/([^/]+)$/)
  if (!roomMatch) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  const roomId = roomMatch[1]
  const roomKey = `room:${roomId}:users`

  const existingToken = req.cookies.get("x-auth-token")?.value

  // If user already joined, allow immediately
  if (existingToken) {
    const alreadyInRoom = await redis.sismember(roomKey, existingToken)
    if (alreadyInRoom) {
      return NextResponse.next()
    }
  }

  const token = existingToken ?? nanoid()

  // Add user atomically
  await redis.sadd(roomKey, token)
  await redis.expire(roomKey, 600) // 10 min auto cleanup

  const count = await redis.scard(roomKey)

  // Room full → rollback and reject
  if (count > 2) {
    await redis.srem(roomKey, token)
    return NextResponse.redirect(new URL("/?error=room-full", req.url))
  }

  const response = NextResponse.next()

  // Set cookie only if new user
  if (!existingToken) {
    response.cookies.set("x-auth-token", token, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })
  }

  return response
}

export const config = {
  matcher: "/room/:path*",
}
