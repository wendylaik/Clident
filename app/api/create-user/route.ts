import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { nombre, correo, password, rol, cedula, birthDate, phone } = await request.json();

    if (!nombre || !correo || !password || !rol) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }

    // Check if email already exists
    const { data: existing } = await supabaseAdmin
      .from("usuario")
      .select("id")
      .eq("correo", correo)
      .single();

    if (existing) {
      return NextResponse.json({ error: "El correo ya está asociado a otro usuario" }, { status: 400 });
    }

    // Check if cedula already exists (only for patients)
    if (rol === "paciente" && cedula) {
      const { data: existingCedula } = await supabaseAdmin
        .from("paciente")
        .select("id")
        .eq("cedula", cedula)
        .single();

      if (existingCedula) {
        return NextResponse.json({ error: "Ya existe un paciente registrado con esa cédula" }, { status: 400 });
      }
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: correo,
      password,
      app_metadata: { rol },
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message ?? "No se pudo crear el usuario" }, { status: 500 });
    }

    const userId = authData.user.id;

    // Insert in usuario table
    const { error: usuarioError } = await supabaseAdmin
      .from("usuario")
      .insert({ id: userId, nombre, correo, rol, es_activo: true });

    if (usuarioError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: usuarioError.message }, { status: 500 });
    }

    // If rol is paciente, create paciente record with full data
    if (rol === "paciente") {
      const { data: pacienteData, error: pacienteError } = await supabaseAdmin
        .from("paciente")
        .insert({
          id_usuario: userId,
          nombre,
          correo,
          cedula: cedula ?? null,
          fecha_nacimiento: birthDate ?? null,
          telefono: phone ?? null,
          es_activo: true,
        })
        .select()
        .single();

      if (pacienteError) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        if (pacienteError.code === "23505") {
          return NextResponse.json({ error: "Ya existe un paciente registrado con esa cédula" }, { status: 400 });
        }
        return NextResponse.json({ error: pacienteError.message }, { status: 500 });
      }

      // Create expediente and odontograma via RPC
      const { error: rpcError } = await supabaseAdmin.rpc("crear_expediente_y_odontograma", {
        p_id_paciente: pacienteData.id,
      });

      if (rpcError) {
        console.error("RPC error:", rpcError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Ocurrió un error inesperado" }, { status: 500 });
  }
}