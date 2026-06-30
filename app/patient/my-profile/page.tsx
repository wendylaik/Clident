"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

type PatientProfile = {
  nombre: string;
  cedula: string;
  fecha_nacimiento: string;
  telefono: string;
  correo: string;
  direccion: string | null;
  peso: number | null;
  alergias: string | null;
  enfermedades_sistemicas: string | null;
};

export default function MyProfile() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("paciente")
        .select("nombre, cedula, fecha_nacimiento, telefono, correo, direccion, peso, alergias, enfermedades_sistemicas")
        .eq("id_usuario", user.id)
        .single();

      setProfile(data);
      setIsLoading(false);
    };

    fetchProfile();
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
      <h1 className="text-2xl font-semibold text-[#283A97]">Mi perfil</h1>
      <p className="mt-1 text-sm text-[#6B7280]">
        Consulta y actualiza tus datos personales.
      </p>
      {/* Profile content goes here */}
    </div>
  );
}