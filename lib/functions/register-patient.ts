import { createClient } from "@/lib/supabase/client";

type RegisterPatientParams = {
  email: string;
  password: string;
  fullName: string;
  cedula: string;
  birthDate: string;
  phone: string;
};

type RegisterPatientResult = {
  success: boolean;
  error?: string;
};

export async function registerPatient({
  email,
  password,
  fullName,
  cedula,
  birthDate,
  phone,
}: RegisterPatientParams): Promise<RegisterPatientResult> {
  const supabase = createClient();

  // Check if cedula already exists before attempting registration
  const { data: existingCedula } = await supabase
    .from("paciente")
    .select("id")
    .eq("cedula", cedula)
    .single();

  if (existingCedula) {
    return { success: false, error: "Ya existe un paciente registrado con esa cédula" };
  }

  // Create the user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { rol: "paciente" },
    },
  });

  if (authError || !authData.user) {
    return {
      success: false,
      error: authError?.message ?? "No se pudo crear el usuario",
    };
  }

  const userId = authData.user.id;

  // Call the Postgres function that creates everything else atomically
  const { error: rpcError } = await supabase.rpc("crear_paciente_completo", {
    p_id_usuario: userId,
    p_nombre: fullName,
    p_cedula: cedula,
    p_fecha_nacimiento: birthDate,
    p_telefono: phone,
    p_correo: email,
  });

  if (rpcError) {
    if (rpcError.message.includes("duplicate key") || rpcError.code === "23505") {
      return { success: false, error: "Ya existe un paciente registrado con esa cédula" };
    }
    return { success: false, error: rpcError.message };
  }

  // Sign out immediately so the user logs in manually
  await supabase.auth.signOut();

  return { success: true };
}