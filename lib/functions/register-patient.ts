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