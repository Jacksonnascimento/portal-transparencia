import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Tenta recuperar o token dos cookies
  const token = request.cookies.get('horizon_token')?.value;

  // Define qual é a página de login
  const loginUrl = new URL('/login', request.url);

  // Se o utilizador NÃO tem token e NÃO está na página de login, manda para o login
  if (!token && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(loginUrl);
  }

  // Se o utilizador JÁ tem token e tenta aceder ao login, manda para o dashboard
  if (token && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Configura em quais caminhos o middleware deve atuar
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};