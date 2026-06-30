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

  // 1. Create the user in Supabase Auth.
  // Everything else (usuario, paciente, expediente, odontograma, piezas)
  // happens inside the crear_paciente_completo Postgres function,
  // which runs as a single transaction.
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

  // 2. Call the Postgres function that creates everything else atomically.
  const { error: rpcError } = await supabase.rpc("crear_paciente_completo", {
    p_id_usuario: userId,
    p_nombre: fullName,
    p_cedula: cedula,
    p_fecha_nacimiento: birthDate,
    p_telefono: phone,
    p_correo: email,
  });

  if (rpcError) {
    return { success: false, error: rpcError.message };
  }

  return { success: true };
}