"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Odontogram from "@/components/odontogram";

type EstadoPieza = "sana" | "caries" | "restauracion" | "corona" | "implante" | "ausente" | "endodoncia";

type PiezaDental = {
  id: string;
  numero_pieza: number;
  estado: EstadoPieza;
  observaciones: string | null;
};

type Cita = {
  id: string;
  fecha: string;
  hora: string;
  id_expediente: string;
  paciente: { id: string; nombre: string } | null;
  servicio: { nombre: string } | null;
};

const estadoLabel: Record<EstadoPieza, string> = {
  sana: "Sana",
  caries: "Caries",
  restauracion: "Restauración",
  corona: "Corona",
  implante: "Implante",
  ausente: "Ausente",
  endodoncia: "Endodoncia",
};

const estadoColor: Record<EstadoPieza, string> = {
  sana: "#6B7280",
  caries: "#DC2626",
  restauracion: "#283A97",
  corona: "#00C2F3",
  implante: "#283A97",
  ausente: "#6B7280",
  endodoncia: "#E45C3C",
};

const POSITION_TO_FDI: Record<number, number> = {
  1:18, 2:17, 3:16, 4:15, 5:14, 6:13, 7:12, 8:11,
  9:21, 10:22, 11:23, 12:24, 13:25, 14:26, 15:27, 16:28,
  17:31, 18:32, 19:33, 20:34, 21:35, 22:36, 23:37, 24:38,
  25:41, 26:42, 27:43, 28:44, 29:45, 30:46, 31:47, 32:48,
};

export default function ConsultationPage({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const citaId = searchParams.get("citaId");

  const [cita, setCita] = useState<Cita | null>(null);
  const [piezas, setPiezas] = useState<PiezaDental[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Consulta fields
  const [diagnostico, setDiagnostico] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [evolucion, setEvolucion] = useState("");

  // Selected tooth
  const [selectedPieza, setSelectedPieza] = useState<PiezaDental | null>(null);
  const [newEstado, setNewEstado] = useState<EstadoPieza>("sana");
  const [newObservaciones, setNewObservaciones] = useState("");
  const [savingPieza, setSavingPieza] = useState(false);

  // Save/close
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
  setIsSaving(false);
  setSaveError(null);
  setDiagnostico("");
  setObservaciones("");
  setEvolucion("");
  setSelectedPieza(null);
}, [citaId]);

useEffect(() => {
  if (!citaId) return;
  const fetchData = async () => {
    const supabase = createClient();

    // 1. Traer la cita
    const { data: citaData } = await supabase
      .from("cita")
      .select("id, fecha, hora, id_paciente, id_servicio, paciente(id, nombre), servicio(nombre)")
      .eq("id", citaId)
      .single();

    if (!citaData) {
      setIsLoading(false);
      return;
    }

    setCita(citaData as any);

    // 2. Traer expediente del paciente
    const { data: expediente } = await supabase
      .from("expediente_clinico")
      .select("id")
      .eq("id_paciente", (citaData as any).id_paciente)
      .single();

    if (!expediente) {
      setIsLoading(false);
      return;
    }

    // 3. Traer odontograma
    const { data: odontograma } = await supabase
      .from("odontograma")
      .select("id")
      .eq("id_expediente", expediente.id)
      .single();

    if (!odontograma) {
      setIsLoading(false);
      return;
    }

    // 4. Traer piezas
    const { data: piezasData } = await supabase
      .from("pieza_dental")
      .select("id, numero_pieza, estado, observaciones")
      .eq("id_odontograma", odontograma.id)
      .order("numero_pieza");

    setPiezas((piezasData ?? []) as PiezaDental[]);
    setIsLoading(false);
  };

  fetchData();
}, [citaId]);

  const handlePiezaClick = (pieza: PiezaDental) => {
    setSelectedPieza(pieza);
    setNewEstado(pieza.estado);
    setNewObservaciones(pieza.observaciones ?? "");
  };

  const handleSavePieza = async () => {
    if (!selectedPieza) return;
    setSavingPieza(true);
    const supabase = createClient();
    await supabase
      .from("pieza_dental")
      .update({
        estado: newEstado,
        observaciones: newObservaciones || null,
        fecha_actualizacion: new Date().toISOString(),
      })
      .eq("id", selectedPieza.id);

    setPiezas((prev) =>
      prev.map((p) =>
        p.id === selectedPieza.id
          ? { ...p, estado: newEstado, observaciones: newObservaciones || null }
          : p
      )
    );
    setSelectedPieza(null);
    setSavingPieza(false);
  };

  const handleCloseConsultation = async () => {
    if (!citaId) return;
    
    if (!diagnostico.trim()) {
        setSaveError("Debe ingresar al menos el diagnóstico antes de cerrar la consulta.");
        return;
    }

    setSaveError(null);
    setIsSaving(true);
    
    const supabase = createClient();

    // Get expediente id
    const { data: pacienteData } = await supabase
      .from("cita")
      .select("id_paciente")
      .eq("id", citaId)
      .single();

    const { data: expediente } = await supabase
      .from("expediente_clinico")
      .select("id")
      .eq("id_paciente", pacienteData?.id_paciente)
      .single();

    // Create consulta
    const { error: consultaError } = await supabase.from("consulta").insert({
      id_cita: citaId,
      id_expediente: expediente?.id,
      diagnostico: diagnostico || null,
      observaciones: observaciones || null,
      evolucion: evolucion || null,
      cerrada: true,
      fecha_consulta: new Date().toISOString(),
    });

    console.log("consultaError:", consultaError);

    if (consultaError) {
      setSaveError(consultaError.message);
      setIsSaving(false);
      return;
    }

    // Mark cita as completada
    await supabase.from("cita").update({ estado: "completada" }).eq("id", citaId);

    router.push(`${basePath.replace("/consultations", "/appointments")}`);
  };

  const inputClass = "rounded-lg border border-[#D7DEF2] bg-white px-4 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#00C2F3] focus:outline-none focus:ring-2 focus:ring-[#00C2F3]/30 w-full";
  const textareaClass = "rounded-lg border border-[#D7DEF2] bg-white px-4 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#00C2F3] focus:outline-none focus:ring-2 focus:ring-[#00C2F3]/30 w-full resize-none";
  const labelClass = "text-sm font-medium text-[#283A97]";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[#6B7280]">Cargando consulta...</p>
      </div>
    );
  }

  if (!cita) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-[#6B7280]">No se encontró la cita.</p>
        <button onClick={() => router.back()} className="text-sm text-[#283A97] hover:underline">Volver</button>
      </div>
    );
  }

  const paciente = Array.isArray(cita.paciente) ? cita.paciente[0] : cita.paciente;
  const servicio = Array.isArray(cita.servicio) ? cita.servicio[0] : cita.servicio;

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-[#6B7280] hover:bg-[#E8EBF7] hover:text-[#283A97] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-[#283A97]">Consulta clínica</h1>
            <p className="text-sm text-[#6B7280] mt-0.5">
              {paciente?.nombre} · {servicio?.nombre} · {new Date(cita.fecha + "T12:00:00").toLocaleDateString("es-CR", { weekday: "long", day: "numeric", month: "long" })} {cita.hora?.slice(0, 5)}
            </p>
          </div>
        </div>
        <button
          onClick={handleCloseConsultation}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-lg bg-[#283A97] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1F2D75] disabled:opacity-60 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {isSaving ? "Cerrando..." : "Cerrar consulta"}
        </button>
      </div>

      {saveError && (
        <div className="mb-4 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#DC2626]">
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-[#E2E6F0] p-5">
            <h2 className="text-sm font-semibold text-[#283A97] uppercase tracking-wide mb-4">
              Odontograma
            </h2>
            {piezas.length > 0 ? (
              <Odontogram
                piezas={piezas}
                onPiezaClick={handlePiezaClick}
                readonly={false}
              />
            ) : (
              <div className="flex items-center justify-center h-32">
                <p className="text-sm text-[#6B7280]">No se encontró odontograma para este paciente.</p>
              </div>
            )}
          </div>

          {selectedPieza && (
            <div className="bg-white rounded-xl border border-[#00C2F3] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[#283A97]">
                  Pieza {POSITION_TO_FDI[selectedPieza.numero_pieza]}
                </h2>
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: `${estadoColor[selectedPieza.estado]}15`, color: estadoColor[selectedPieza.estado] }}
                >
                  {estadoLabel[selectedPieza.estado]}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Nuevo estado</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(Object.entries(estadoLabel) as [EstadoPieza, string][]).map(([estado, label]) => (
                      <button
                        key={estado}
                        onClick={() => setNewEstado(estado)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          newEstado === estado
                            ? "border-[#283A97] bg-[#E8EBF7] text-[#283A97]"
                            : "border-[#D7DEF2] text-[#6B7280] hover:border-[#283A97]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Observaciones de la pieza <span className="text-[#9CA3AF] font-normal">(opcional)</span></label>
                  <textarea
                    rows={2}
                    value={newObservaciones}
                    onChange={(e) => setNewObservaciones(e.target.value)}
                    placeholder="Notas sobre esta pieza..."
                    className={textareaClass}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedPieza(null)}
                    className="flex-1 rounded-lg border border-[#D7DEF2] px-4 py-2 text-sm text-[#6B7280] hover:bg-[#F4F5F8] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSavePieza}
                    disabled={savingPieza}
                    className="flex-1 rounded-lg bg-[#283A97] px-4 py-2 text-sm font-medium text-white hover:bg-[#1F2D75] disabled:opacity-60 transition-colors"
                  >
                    {savingPieza ? "Guardando..." : "Guardar pieza"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Clinical fields */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-[#E2E6F0] p-5">
            <h2 className="text-sm font-semibold text-[#283A97] uppercase tracking-wide mb-4">
              Datos clínicos
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Motivo de consulta / Observaciones</label>
                <textarea
                  rows={4}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Describa el motivo de la consulta y observaciones relevantes del paciente..."
                  className={textareaClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Diagnóstico</label>
                <textarea
                  rows={4}
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  placeholder="Diagnóstico clínico del paciente..."
                  className={textareaClass}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Tratamiento / Evolución</label>
                <textarea
                  rows={4}
                  value={evolucion}
                  onChange={(e) => setEvolucion(e.target.value)}
                  placeholder="Tratamiento realizado o indicado, evolución del paciente..."
                  className={textareaClass}
                />
              </div>
            </div>
          </div>

          <div className="bg-[#F4F5F8] rounded-xl border border-[#E2E6F0] p-4">
            <p className="text-xs text-[#6B7280]">
              Al cerrar la consulta, los datos clínicos quedarán registrados en el expediente del paciente y la cita pasará a estado <span className="font-medium text-[#283A97]">Completada</span>. Esta acción no se puede deshacer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}