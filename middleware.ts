import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  
  // 如果未登录，重定向到登录页
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/notes/:path*",
    "/api/notes/:path*",
    "/api/posts/:path*",
  ],
}

