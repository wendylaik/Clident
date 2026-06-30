"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

type Patient = {
  nombre: string;
};

export default function PatientDashboard() {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("paciente")
        .select("nombre")
        .eq("id_usuario", user.id)
        .single();

      setPatient(data);
      setIsLoading(false);
    };

    fetchPatient();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-[#6B7280]">Cargando...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#283A97]">
        ¡Bienvenido, {patient?.nombre ?? "paciente"}!
      </h1>
      <p className="mt-1 text-sm text-[#6B7280]">
        Aquí tienes un resumen de tu actividad.
      </p>
      {/* Dashboard content goes here */}
    </div>
  );
}