import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * Cliente de Supabase con service role key.
 * Tiene permisos administrativos completos y bypasea las políticas RLS.
 * Se usa exclusivamente en el servidor para operaciones que el cliente normal no puede realizar.
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Endpoint para crear usuarios internos (administrador, odontólogo) y pacientes.
 * Utiliza la service role key para asignar el rol en app_metadata del JWT,
 * garantizando que el middleware pueda leerlo de forma segura.
 *
 * Para pacientes, además de crear el usuario en Auth y la tabla usuario,
 * crea el registro en paciente y llama a la función PostgreSQL
 * crear_expediente_y_odontograma para generar el expediente y las 32 piezas dentales.
 *
 * Si cualquier paso falla después de crear el usuario en Auth,
 * se elimina el usuario para evitar registros huérfanos.
 *
 * @param request - Request con body JSON: { nombre, correo, password, rol, cedula?, birthDate?, phone? }
 * @returns JSON con { success: true } o { error: string }
 */
export async function POST(request: Request) {
  try {
    const { nombre, correo, password, rol, cedula, birthDate, phone } = await request.json();

    if (!nombre || !correo || !password || !rol) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }

// Verificar que el correo no esté en uso antes de crear el usuario en Auth
    const { data: existing } = await supabaseAdmin
      .from("usuario")
      .select("id")
      .eq("correo", correo)
      .single();

    if (existing) {
      return NextResponse.json({ error: "El correo ya está asociado a otro usuario" }, { status: 400 });
    }

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

// Crear el usuario en Supabase Auth con el rol en app_metadata
// email_confirm: true omite la verificación de correo
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: correo,
      password,
      app_metadata: { rol },
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message ?? "No se pudo crear el usuario" }, { status: 500 });
    }


// Insertar en la tabla usuario del sistema
// Si falla, eliminar el usuario de Auth para evitar inconsistencias
    const userId = authData.user.id;

    const { error: usuarioError } = await supabaseAdmin
      .from("usuario")
      .insert({ id: userId, nombre, correo, rol, es_activo: true });

    if (usuarioError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: usuarioError.message }, { status: 500 });
    }


// Para pacientes: crear registro en paciente y generar expediente + odontograma
// mediante la función PostgreSQL crear_expediente_y_odontograma
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