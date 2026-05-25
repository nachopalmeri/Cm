import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Auth disabled for testing - allow all routes
  return NextResponse.next()
}

export const config = {
  matcher: [], // Disabled for testing - no auth required
}
