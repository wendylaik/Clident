import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";


/**
 * Middleware de autenticación y autorización del sistema Clident.
 *
 * Intercepta cada petición HTTP para:
 * 1. Verificar si el usuario tiene una sesión activa mediante el JWT de Supabase.
 * 2. Redirigir a login si intenta acceder a rutas protegidas sin sesión.
 * 3. Leer el rol del usuario desde app_metadata del JWT sin consultar la base de datos.
 * 4. Redirigir al dashboard correspondiente si un usuario autenticado accede a rutas públicas.
 * 5. Bloquear el acceso cruzado entre roles.
 *
 * @param request - Objeto NextRequest con la información de la petición entrante
 * @returns NextResponse con la respuesta apropiada: continuar, redirigir o bloquear
 */
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

/**
 * Rutas públicas accesibles sin autenticación.
 * Las rutas /api/ se incluyen para permitir el acceso a los endpoints
 * de creación de usuarios y recuperación de contraseña.
 */
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

  if (!user && !isPublicRoute && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

/**
 * El rol se lee desde app_metadata del JWT sin consultar la base de datos.
 * Es más seguro que user_metadata porque solo puede ser modificado
 * desde el servidor con la service role key.
 */
  if (user) {
    const rol = user.app_metadata?.rol as string | undefined;

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