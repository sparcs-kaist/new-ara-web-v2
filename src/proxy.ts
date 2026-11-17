import { NextResponse } from 'next/server';

// API routing is configured by next.config.js; this layer remains a pass-through.
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
