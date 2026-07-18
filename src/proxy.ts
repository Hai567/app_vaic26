import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicPaths = ["/", "/auth/login", "/auth/signup", "/auth/callback"];

export async function proxy(request: NextRequest) {
	let supabaseResponse = NextResponse.next({ request });

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value }) =>
						request.cookies.set(name, value),
					);
					supabaseResponse = NextResponse.next({ request });
					cookiesToSet.forEach(({ name, value, options }) =>
						supabaseResponse.cookies.set(name, value, options),
					);
				},
			},
		},
	);

	// Refresh session — IMPORTANT: don't remove this
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const isPublicPath = publicPaths.some(
		(path) =>
			request.nextUrl.pathname === path ||
			request.nextUrl.pathname.startsWith("/api/") ||
			request.nextUrl.pathname.startsWith("/_next/"),
	);

	// Redirect unauthenticated users to login
	if (!user && !isPublicPath) {
		const url = request.nextUrl.clone();
		url.pathname = "/auth/login";
		url.searchParams.set("redirectTo", request.nextUrl.pathname);
		return NextResponse.redirect(url);
	}

	// Redirect authenticated users away from auth pages
	if (user && request.nextUrl.pathname.startsWith("/auth/")) {
		const url = request.nextUrl.clone();
		url.pathname = "/chat";
		return NextResponse.redirect(url);
	}

	return supabaseResponse;
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
