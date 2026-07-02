"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

type PatientProfile = {
  nombre: string;
  cedula: string;
  fecha_nacimiento: string;
  telefono: string;
  correo: string | null;
  direccion: string | null;
  peso: number | null;
  alergias: string | null;
  enfermedades_sistemicas: string | null;
};

export default function MyProfile() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [editNombre, setEditNombre] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [editCorreo, setEditCorreo] = useState("");
  const [editDireccion, setEditDireccion] = useState("");

  const fetchProfile = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    console.log("user id:", user?.id); 
    if (!user) return;

    const { data } = await supabase
      .from("paciente")
      .select("nombre, cedula, fecha_nacimiento, telefono, correo, direccion, peso, alergias, enfermedades_sistemicas")
      .eq("id_usuario", user.id)
      .single();

    if (data) {
      setProfile(data);
      setEditNombre(data.nombre);
      setEditTelefono(data.telefono ?? "");
      setEditCorreo(data.correo ?? "");
      setEditDireccion(data.direccion ?? "");
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchProfile(); }, []);

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

    setIsSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("paciente")
      .update({
        nombre: editNombre,
        telefono: editTelefono,
        correo: editCorreo || null,
        direccion: editDireccion || null,
      })
      .eq("id_usuario", user.id);

    if (error) {
      setSaveError(error.message);
    } else {
      setSaveSuccess(true);
      setIsEditing(false);
      fetchProfile();
    }
    setIsSaving(false);
  };

  const inputClass = "rounded-lg border border-[#D7DEF2] bg-white px-4 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#00C2F3] focus:outline-none focus:ring-2 focus:ring-[#00C2F3]/30 w-full";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[#6B7280]">Cargando...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[#6B7280]">No se encontró información de perfil.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#283A97]">Mi perfil</h1>
          <p className="mt-1 text-sm text-[#6B7280]">Consulte y actualice sus datos personales.</p>
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

      {saveSuccess && (
        <div className="mb-4 rounded-lg border border-[#A8E6C1] bg-[#EFFBF3] px-4 py-3 text-sm text-[#1B7A41]">
          Datos actualizados exitosamente.
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Personal data */}
        <div className="bg-white rounded-xl border border-[#E2E6F0] p-6">
          <h2 className="text-sm font-semibold text-[#283A97] uppercase tracking-wide mb-4">Datos personales</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-1.5">
              <p className="text-xs text-[#6B7280] uppercase tracking-wide">Nombre completo</p>
              {isEditing ? (
                <input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className={inputClass} />
              ) : (
                <p className="text-sm font-medium text-[#1F2937]">{profile.nombre}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-[#6B7280] uppercase tracking-wide">Cédula</p>
              <p className="text-sm text-[#1F2937]">{profile.cedula}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-[#6B7280] uppercase tracking-wide">Fecha de nacimiento</p>
              <p className="text-sm text-[#1F2937]">{new Date(profile.fecha_nacimiento).toLocaleDateString("es-CR")}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-[#6B7280] uppercase tracking-wide">Teléfono</p>
              {isEditing ? (
                <input type="tel" value={editTelefono} onChange={(e) => setEditTelefono(e.target.value)} className={inputClass} />
              ) : (
                <p className="text-sm text-[#1F2937]">{profile.telefono ?? "—"}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-[#6B7280] uppercase tracking-wide">Correo electrónico</p>
              {isEditing ? (
                <input type="email" value={editCorreo} onChange={(e) => setEditCorreo(e.target.value)} className={inputClass} />
              ) : (
                <p className="text-sm text-[#1F2937]">{profile.correo ?? "—"}</p>
              )}
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <p className="text-xs text-[#6B7280] uppercase tracking-wide">Dirección</p>
              {isEditing ? (
                <input type="text" value={editDireccion} onChange={(e) => setEditDireccion(e.target.value)} className={inputClass} />
              ) : (
                <p className="text-sm text-[#1F2937]">{profile.direccion ?? "—"}</p>
              )}
            </div>
          </div>
        </div>

        {/* Medical background — read only */}
        <div className="bg-white rounded-xl border border-[#E2E6F0] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#283A97] uppercase tracking-wide">Antecedentes médicos</h2>
            <span className="text-xs text-[#9CA3AF] bg-[#F4F5F8] px-2.5 py-1 rounded-full">Solo lectura</span>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-[#6B7280] uppercase tracking-wide">Peso</p>
              <p className="text-sm text-[#1F2937]">{profile.peso ? `${profile.peso} kg` : "—"}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-[#6B7280] uppercase tracking-wide">Alergias</p>
              <p className="text-sm text-[#1F2937]">{profile.alergias || "Ninguna registrada"}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-[#6B7280] uppercase tracking-wide">Enfermedades sistémicas</p>
              <p className="text-sm text-[#1F2937]">{profile.enfermedades_sistemicas || "Ninguna registrada"}</p>
            </div>
          </div>
        </div>

        {isEditing && (
          <>
            {saveError && (
              <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#DC2626]">{saveError}</div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setIsEditing(false); setSaveError(null); setSaveSuccess(false); }}
                className="flex-1 rounded-lg border border-[#D7DEF2] px-4 py-2.5 text-sm text-[#6B7280] hover:bg-[#F4F5F8] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 rounded-lg bg-[#283A97] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1F2D75] disabled:opacity-60 transition-colors"
              >
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}