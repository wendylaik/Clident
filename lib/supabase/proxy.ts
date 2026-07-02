import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!hasEnvVars) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/auth/login",
    "/auth/sign-up",
    "/auth/forgot-password",
    "/auth/update-password",
    "/auth/confirm",
    "/auth/error",
    "/auth/sign-up-success",
    "/api/",
  ];

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If no session and trying to access a protected route → redirect to login
  if (!user && !isPublicRoute && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // If session exists, read role from JWT app_metadata (no DB query needed)
  if (user) {
    const rol = user.app_metadata?.rol as string | undefined;

    // If logged in and trying to access a public route → redirect to their dashboard
    if (isPublicRoute && pathname !== "/auth/update-password") {
      if (rol === "administrador") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      if (rol === "odontologo") {
        return NextResponse.redirect(new URL("/dentist", request.url));
      }
      if (user) {
      console.log("user app_metadata:", user.app_metadata);
      const rol = user.app_metadata?.rol as string | undefined;
      console.log("rol detectado:", rol);}
    }

    // Block cross-role access
    if (pathname.startsWith("/admin") && rol !== "administrador") {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    if (pathname.startsWith("/dentist") && rol !== "odontologo") {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    if (pathname.startsWith("/patient") && rol !== "paciente") {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }

  return supabaseResponse;
}