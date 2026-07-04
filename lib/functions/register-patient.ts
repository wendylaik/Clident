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

/**
 * Registra un nuevo paciente en el sistema desde el formulario público de sign-up.
 *
 * Primero verifica que la cédula no esté en uso, luego delega la creación completa
 * al endpoint /api/create-user que usa la service role key para asignar el rol
 * en app_metadata del JWT, garantizando que el middleware pueda autenticarlo correctamente.
 *
 * @param params - Datos del paciente: email, password, fullName, cedula, birthDate, phone
 * @returns Objeto con success: true o success: false con mensaje de error
 */
export async function registerPatient({
  email,
  password,
  fullName,
  cedula,
  birthDate,
  phone,
}: RegisterPatientParams): Promise<RegisterPatientResult> {
  const supabase = createClient();

// Verificar cédula duplicada antes de llamar a la API para dar un mensaje más específico
  const { data: existingCedula } = await supabase
    .from("paciente")
    .select("id")
    .eq("cedula", cedula)
    .single();

  if (existingCedula) {
    return { success: false, error: "Ya existe un paciente registrado con esa cédula" };
  }

// Delegar la creación al endpoint /api/create-user que tiene permisos de service role
// para crear el usuario con el rol correcto en app_metadata
  const response = await fetch("/api/create-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre: fullName,
      correo: email,
      password,
      rol: "paciente",
      cedula,
      birthDate,
      phone,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return { success: false, error: data.error ?? "No se pudo crear el usuario" };
  }

  return { success: true };
}