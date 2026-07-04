"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Patient = {
  id: string;
  nombre: string;
  cedula: string;
  fecha_nacimiento: string;
  telefono: string;
  correo: string | null;
  direccion: string | null;
  peso: number | null;
  alergias: string | null;
  enfermedades_sistemicas: string | null;
  es_activo: boolean;
  expediente_clinico: {
    id: string;
    fecha_creacion: string;
  }[] | null;
};

type Tab = "perfil" | "expediente";

/**
 * Página de detalle de un paciente. Reutilizable para admin y odontólogo.
 * Muestra el perfil completo con dos pestañas: datos personales/antecedentes médicos
 * y expediente clínico. Permite editar todos los campos excepto cédula y fecha de nacimiento.
 * Se reinicia al cambiar el patientId para evitar mostrar datos del paciente anterior.
 *
 * @param basePath - Ruta base del rol actual (/admin/patients o /dentist/patients)
 * @param patientId - UUID del paciente a mostrar
 */
export default function PatientDetailPage({
  basePath,
  patientId,
}: {
  basePath: string;
  patientId: string;
}) {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("perfil");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [editNombre, setEditNombre] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [editCorreo, setEditCorreo] = useState("");
  const [editDireccion, setEditDireccion] = useState("");
  const [editPeso, setEditPeso] = useState("");
  const [editAlergias, setEditAlergias] = useState("");
  const [editEnfermedades, setEditEnfermedades] = useState("");

/**
 * Carga los datos completos del paciente incluyendo su expediente clínico.
 * Precarga los estados de edición con los valores actuales.
 */
  const fetchPatient = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("paciente")
      .select("*, expediente_clinico(id, fecha_creacion)")
      .eq("id", patientId)
      .single();

    if (data) {
      setPatient(data);
      setEditNombre(data.nombre);
      setEditTelefono(data.telefono ?? "");
      setEditCorreo(data.correo ?? "");
      setEditDireccion(data.direccion ?? "");
      setEditPeso(data.peso?.toString() ?? "");
      setEditAlergias(data.alergias ?? "");
      setEditEnfermedades(data.enfermedades_sistemicas ?? "");
    }
    setIsLoading(false);
  };

/**
 * Reinicia la vista al perfil y modo lectura cada vez que cambia el paciente,
 * luego carga los datos del nuevo paciente.
 */
    useEffect(() => {
    if (patientId) {
        setIsEditing(false);
        setActiveTab("perfil");
        fetchPatient();
    }
    }, [patientId]);

/**
 * Guarda los cambios editados del paciente en la base de datos.
 * Valida nombre, formato de correo y peso antes de actualizar.
 * Actualiza el estado local sin recargar la página completa.
 */
  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);

    if (!editNombre.trim()) {
      setSaveError("El nombre es requerido");
      return;
    }
    if (editCorreo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editCorreo)) {
      setSaveError("Ingrese un correo electrónico válido");
      return;
    }
    if (editPeso && (isNaN(Number(editPeso)) || Number(editPeso) <= 0)) {
      setSaveError("Ingrese un peso válido");
      return;
    }

    setIsSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("paciente")
      .update({
        nombre: editNombre,
        telefono: editTelefono,
        correo: editCorreo || null,
        direccion: editDireccion || null,
        peso: editPeso ? Number(editPeso) : null,
        alergias: editAlergias || null,
        enfermedades_sistemicas: editEnfermedades || null,
      })
      .eq("id", patientId);

    if (error) {
      setSaveError(error.message);
    } else {
      setSaveSuccess(true);
      setIsEditing(false);
      fetchPatient();
    }
    setIsSaving(false);
  };

  const inputClass = "rounded-lg border border-[#D7DEF2] bg-white px-4 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#00C2F3] focus:outline-none focus:ring-2 focus:ring-[#00C2F3]/30 w-full";
  const textareaClass = "rounded-lg border border-[#D7DEF2] bg-white px-4 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#00C2F3] focus:outline-none focus:ring-2 focus:ring-[#00C2F3]/30 w-full resize-none";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[#6B7280]">Cargando...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-[#6B7280]">Paciente no encontrado.</p>
        <button onClick={() => router.back()} className="text-sm text-[#283A97] hover:underline">Volver</button>
      </div>
    );
  }

  const expediente = patient.expediente_clinico?.[0];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-lg text-[#6B7280] hover:bg-[#E8EBF7] hover:text-[#283A97] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-[#283A97]">{patient.nombre}</h1>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${patient.es_activo ? "bg-[#ECFDF5] text-[#059669]" : "bg-[#FEF2F2] text-[#DC2626]"}`}>
                {patient.es_activo ? "Activo" : "Inactivo"}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-[#6B7280]">Cédula: {patient.cedula}</p>
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 rounded-lg border border-[#D7DEF2] px-4 py-2 text-sm text-[#283A97] hover:bg-[#E8EBF7] transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Editar
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b border-[#E2E6F0] mb-6">
        {(["perfil", "expediente"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-[#283A97] text-[#283A97]"
                : "border-transparent text-[#6B7280] hover:text-[#283A97]"
            }`}
          >
            {tab === "perfil" ? "Perfil" : "Expediente clínico"}
          </button>
        ))}
      </div>

      {activeTab === "perfil" && (
        <div className="flex flex-col gap-4">
          {saveSuccess && (
            <div className="rounded-lg border border-[#A8E6C1] bg-[#EFFBF3] px-4 py-3 text-sm text-[#1B7A41]">
              Datos actualizados exitosamente.
            </div>
          )}

          <div className="bg-white rounded-xl border border-[#E2E6F0] p-6">
            <h2 className="text-sm font-semibold text-[#283A97] uppercase tracking-wide mb-4">Datos personales</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-1.5">
                <p className="text-xs text-[#6B7280] uppercase tracking-wide">Nombre completo</p>
                {isEditing ? (
                  <input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className={inputClass} />
                ) : (
                  <p className="text-sm text-[#1F2937] font-medium">{patient.nombre}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-[#6B7280] uppercase tracking-wide">Cédula</p>
                <p className="text-sm text-[#1F2937]">{patient.cedula}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-[#6B7280] uppercase tracking-wide">Fecha de nacimiento</p>
                <p className="text-sm text-[#1F2937]">{new Date(patient.fecha_nacimiento).toLocaleDateString("es-CR")}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-[#6B7280] uppercase tracking-wide">Teléfono</p>
                {isEditing ? (
                  <input type="tel" value={editTelefono} onChange={(e) => setEditTelefono(e.target.value)} className={inputClass} />
                ) : (
                  <p className="text-sm text-[#1F2937]">{patient.telefono ?? "—"}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-[#6B7280] uppercase tracking-wide">Correo electrónico</p>
                {isEditing ? (
                  <input type="email" value={editCorreo} onChange={(e) => setEditCorreo(e.target.value)} className={inputClass} />
                ) : (
                  <p className="text-sm text-[#1F2937]">{patient.correo ?? "—"}</p>
                )}
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <p className="text-xs text-[#6B7280] uppercase tracking-wide">Dirección</p>
                {isEditing ? (
                  <input type="text" value={editDireccion} onChange={(e) => setEditDireccion(e.target.value)} className={inputClass} />
                ) : (
                  <p className="text-sm text-[#1F2937]">{patient.direccion ?? "—"}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-[#6B7280] uppercase tracking-wide">Peso</p>
                {isEditing ? (
                  <input type="number" min="1" max="300" step="0.1" placeholder="Ej: 65" value={editPeso} onChange={(e) => setEditPeso(e.target.value)} className={inputClass} />
                ) : (
                  <p className="text-sm text-[#1F2937]">{patient.peso ? `${patient.peso} kg` : "—"}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E6F0] p-6">
            <h2 className="text-sm font-semibold text-[#283A97] uppercase tracking-wide mb-4">Antecedentes médicos</h2>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-[#6B7280] uppercase tracking-wide">Alergias</p>
                {isEditing ? (
                  <textarea rows={3} placeholder="Describa las alergias conocidas del paciente..." value={editAlergias} onChange={(e) => setEditAlergias(e.target.value)} className={textareaClass} />
                ) : (
                  <p className="text-sm text-[#1F2937]">{patient.alergias || "Ninguna registrada"}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-[#6B7280] uppercase tracking-wide">Enfermedades sistémicas</p>
                {isEditing ? (
                  <textarea rows={3} placeholder="Describa enfermedades sistémicas relevantes..." value={editEnfermedades} onChange={(e) => setEditEnfermedades(e.target.value)} className={textareaClass} />
                ) : (
                  <p className="text-sm text-[#1F2937]">{patient.enfermedades_sistemicas || "Ninguna registrada"}</p>
                )}
              </div>
            </div>
          </div>

          {isEditing && (
            <>
              {saveError && (
                <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#DC2626]">{saveError}</div>
              )}
              <div className="flex gap-3">
                <button onClick={() => { setIsEditing(false); setSaveError(null); setSaveSuccess(false); }} className="flex-1 rounded-lg border border-[#D7DEF2] px-4 py-2.5 text-sm text-[#6B7280] hover:bg-[#F4F5F8] transition-colors">Cancelar</button>
                <button onClick={handleSave} disabled={isSaving} className="flex-1 rounded-lg bg-[#283A97] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1F2D75] disabled:opacity-60 transition-colors">
                  {isSaving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "expediente" && (
        <div className="bg-white rounded-xl border border-[#E2E6F0] p-6">
          {expediente ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#6B7280] uppercase tracking-wide">N° de expediente</p>
                  <p className="text-sm font-medium text-[#1F2937] mt-0.5">{expediente.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#6B7280] uppercase tracking-wide">Fecha de creación</p>
                  <p className="text-sm text-[#1F2937] mt-0.5">{new Date(expediente.fecha_creacion).toLocaleDateString("es-CR")}</p>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-[#E2E6F0] bg-[#F4F5F8] px-4 py-8 text-center">
                <p className="text-sm text-[#6B7280]">El contenido del expediente clínico estará disponible en una próxima versión del sistema.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-[#6B7280]">No se encontró expediente asociado a este paciente.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}