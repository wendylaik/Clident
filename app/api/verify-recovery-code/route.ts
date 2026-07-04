import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { unsealData } from "iron-session";

const SESSION_PASSWORD = process.env.SESSION_SECRET!;

/**
 * Endpoint para el paso 2 del proceso de recuperación de contraseña.
 *
 * Verifica el código OTP ingresado por el usuario contra el almacenado
 * en la cookie cifrada recovery_session. Si el código es válido y no ha expirado,
 * elimina la cookie de sesión y crea una nueva cookie recovery_verified
 * que autoriza al usuario a actualizar su contraseña en el paso siguiente.
 *
 * @param request - Request con body JSON: { code: string }
 * @returns JSON con { success: true, email: string } o { error: string }
 */
export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "El código es requerido" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const sealed = cookieStore.get("recovery_session")?.value;

    if (!sealed) {
      return NextResponse.json(
        { error: "La sesión de recuperación no existe o expiró" },
        { status: 400 }
      );
    }

    const session = await unsealData<{
      code: string;
      email: string;
      expiresAt: number;
    }>(sealed, { password: SESSION_PASSWORD });

    if (Date.now() > session.expiresAt) {
      cookieStore.delete("recovery_session");
      return NextResponse.json(
        { error: "El código ha expirado. Solicite uno nuevo." },
        { status: 400 }
      );
    }

    if (code !== session.code) {
      return NextResponse.json(
        { error: "El código ingresado es incorrecto" },
        { status: 400 }
      );
    }

// Código válido: crear cookie de verificación que autoriza el cambio de contraseña
// y eliminar la cookie de sesión con el OTP ya usado
    const { sealData } = await import("iron-session");
    const verifiedSealed = await sealData(
      { email: session.email, verified: true },
      { password: SESSION_PASSWORD, ttl: 600 }
    );

    cookieStore.set("recovery_verified", verifiedSealed, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    cookieStore.delete("recovery_session");

    return NextResponse.json({ success: true, email: session.email });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado" },
      { status: 500 }
    );
  }
}