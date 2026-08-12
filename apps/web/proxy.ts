import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import {
    getSignInRedirectPath,
    isPublicAuthPath,
} from '@/features/auth/server/routeProtection';

function withRequestId(response: NextResponse, requestId: string) {
    response.headers.set('x-request-id', requestId);
    return response;
}

export async function proxy(req: NextRequest): Promise<NextResponse> {
    const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
    let response = NextResponse.next({ request: req });

    // API routes enforce their own authentication and include intentional
    // public callbacks/webhooks. Keep request tracing without changing those
    // contracts here.
    if (req.nextUrl.pathname.startsWith('/api/')) {
        return withRequestId(response, requestId);
    }

    if (isPublicAuthPath(req.nextUrl.pathname)) {
        return withRequestId(response, requestId);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
        const redirect = NextResponse.redirect(
            new URL(
                getSignInRedirectPath(req.nextUrl.pathname, req.nextUrl.search),
                req.url,
            ),
        );
        return withRequestId(redirect, requestId);
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll: () => req.cookies.getAll(),
            setAll: (cookiesToSet) => {
                cookiesToSet.forEach(({ name, value }) =>
                    req.cookies.set(name, value),
                );
                response = NextResponse.next({ request: req });
                cookiesToSet.forEach(({ name, value, options }) =>
                    response.cookies.set(name, value, options),
                );
            },
        },
    });

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        const redirect = NextResponse.redirect(
            new URL(
                getSignInRedirectPath(req.nextUrl.pathname, req.nextUrl.search),
                req.url,
            ),
        );
        response.cookies
            .getAll()
            .forEach((cookie) => redirect.cookies.set(cookie));
        return withRequestId(redirect, requestId);
    }

    return withRequestId(response, requestId);
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf)$).*)',
    ],
};
