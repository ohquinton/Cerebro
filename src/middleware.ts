import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const path = request.nextUrl.pathname;
  
  // Check if the path is /dashboard or starts with /dashboard/ (but isn't already /dashboard-coming-soon)
  if (path === '/dashboard' || (path.startsWith('/dashboard/') && !path.includes('dashboard-coming-soon'))) {
    // Create a new URL for the redirect destination
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard-coming-soon';
    
    // Return a redirect response
    return NextResponse.redirect(url);
  }
  
  // Continue with the request for all other paths
  return NextResponse.next();
}

// Configure middleware to match specific paths
export const config = {
  matcher: ['/dashboard', '/dashboard/:path*'],
};
