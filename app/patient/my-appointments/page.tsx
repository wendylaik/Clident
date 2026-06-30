"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

type Appointment = {
  id: string;
  fecha: string;
  hora: string;
  estado: string;
  servicio: {
    nombre: string;
  } | {
    nombre: string;
  }[] | null;
};

export default function MyAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: paciente } = await supabase
        .from("paciente")
        .select("id")
        .eq("id_usuario", user.id)
        .single();

      if (!paciente) return;

      const { data } = await supabase
        .from("cita")
        .select("id, fecha, hora, estado, servicio(nombre)")
        .eq("id_paciente", paciente.id)
        .order("fecha", { ascending: true });

      setAppointments(data ?? []);
      setIsLoading(false);
    };

    fetchAppointments();
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
      <h1 className="text-2xl font-semibold text-[#283A97]">Mis citas</h1>
      <p className="mt-1 text-sm text-[#6B7280]">
        Consulta y gestiona tus citas programadas.
      </p>
      {/* Appointments content goes here */}
    </div>
  );
}