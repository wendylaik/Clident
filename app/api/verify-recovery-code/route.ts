import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { unsealData } from "iron-session";

const SESSION_PASSWORD = process.env.SESSION_SECRET!;

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

    // Code is valid — store verified state in cookie so update-password page knows it's allowed
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