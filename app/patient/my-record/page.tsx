"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

type Record = {
  id: string;
  fecha_creacion: string;
};

export default function MyRecord() {
  const [record, setRecord] = useState<Record | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
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
        .from("expediente_clinico")
        .select("id, fecha_creacion")
        .eq("id_paciente", paciente.id)
        .single();

      setRecord(data);
      setIsLoading(false);
    };

    fetchRecord();
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
      <h1 className="text-2xl font-semibold text-[#283A97]">Mi expediente</h1>
      <p className="mt-1 text-sm text-[#6B7280]">
        Consulta tu historial clínico y odontograma.
      </p>
      {/* Record content goes here */}
    </div>
  );
}