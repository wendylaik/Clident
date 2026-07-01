import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { unsealData } from "iron-session";
import { createClient } from "@supabase/supabase-js";

const SESSION_PASSWORD = process.env.SESSION_SECRET!;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "La contraseña es requerida" },
        { status: 400 }
      );
    }

    // Validate password policy
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        {
          error:
            "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número",
        },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const sealed = cookieStore.get("recovery_verified")?.value;

    if (!sealed) {
      return NextResponse.json(
        { error: "No se verificó el código de recuperación" },
        { status: 401 }
      );
    }

    const session = await unsealData<{ email: string; verified: boolean }>(
      sealed,
      { password: SESSION_PASSWORD }
    );

    if (!session.verified) {
      return NextResponse.json(
        { error: "El código de recuperación no fue verificado" },
        { status: 401 }
      );
    }

    // Get the user by email
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    const user = userData.users.find((u) => u.email === session.email);

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Update the password
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, { password });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    cookieStore.delete("recovery_verified");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update password error:", error);
    return NextResponse.json(
      { error: "Ocurrió un error inesperado" },
      { status: 500 }
    );
  }
}