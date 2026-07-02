"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type FieldErrors = Record<string, string>;

export default function NewPatientPage({ basePath }: { basePath: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [documentType, setDocumentType] = useState<"nacional" | "extranjero">("nacional");
  const [nombre, setNombre] = useState("");
  const [cedula, setCedula] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [direccion, setDireccion] = useState("");
  const [peso, setPeso] = useState("");
  const [alergias, setAlergias] = useState("");
  const [enfermedades, setEnfermedades] = useState("");

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};

    if (!nombre.trim()) errors.nombre = "El nombre es requerido";

    if (documentType === "nacional") {
      if (!/^\d{9}$/.test(cedula)) errors.cedula = "La cédula debe tener exactamente 9 dígitos";
    } else {
      if (!cedula.trim()) errors.cedula = "El número de identificación es requerido";
    }

    if (!birthDate) {
      errors.birthDate = "La fecha de nacimiento es requerida";
    } else {
      const birth = new Date(birthDate);
      const today = new Date();
      const age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      const realAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate()) ? age - 1 : age;
      if (realAge < 18) errors.birthDate = "El paciente debe ser mayor de 18 años";
    }

    if (documentType === "nacional") {
      if (!/^\d{8}$/.test(telefono.replace(/[\s\-]/g, "")))
        errors.telefono = "El teléfono debe tener exactamente 8 dígitos";
    } else {
      if (!/^\+\d{7,15}$/.test(telefono.replace(/[\s\-]/g, "")))
        errors.telefono = "Ingrese el número con código de país (Ej: +506 88888888)";
    }

    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
      errors.correo = "Ingrese un correo electrónico válido";

    if (peso && (isNaN(Number(peso)) || Number(peso) <= 0))
      errors.peso = "Ingrese un peso válido";

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsLoading(true);

    const supabase = createClient();

    // Check duplicate cedula
    const { data: existingCedula } = await supabase
      .from("paciente")
      .select("id")
      .eq("cedula", cedula)
      .single();

    if (existingCedula) {
      setError("Ya existe un paciente registrado con esa cédula.");
      setIsLoading(false);
      return;
    }

    // Check duplicate correo
    if (correo) {
      const { data: existingCorreo } = await supabase
        .from("paciente")
        .select("id")
        .eq("correo", correo)
        .single();

      if (existingCorreo) {
        setError("Ya existe un paciente registrado con ese correo.");
        setIsLoading(false);
        return;
      }
    }

    // Insert patient
    const { data: pacienteData, error: pacienteError } = await supabase
      .from("paciente")
      .insert({
        nombre,
        cedula,
        fecha_nacimiento: birthDate,
        telefono,
        correo: correo || null,
        direccion: direccion || null,
        peso: peso ? Number(peso) : null,
        alergias: alergias || null,
        enfermedades_sistemicas: enfermedades || null,
        es_activo: true,
      })
      .select()
      .single();

    if (pacienteError) {
      setError(pacienteError.message);
      setIsLoading(false);
      return;
    }

    // Create expediente and odontograma via RPC
    const { error: rpcError } = await supabase.rpc("crear_expediente_y_odontograma", {
      p_id_paciente: pacienteData.id,
    });

    if (rpcError) {
      console.error("RPC error:", rpcError);
    }

    router.push(`${basePath}/${pacienteData.id}`);
  };

  const inputClass = "rounded-lg border border-[#D7DEF2] bg-white px-4 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#00C2F3] focus:outline-none focus:ring-2 focus:ring-[#00C2F3]/30 w-full";
  const inputErrorClass = "rounded-lg border border-[#E45C3C] bg-white px-4 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-none w-full";
  const labelClass = "text-sm font-medium text-[#283A97]";
  const errorText = "text-xs text-[#E45C3C] mt-0.5";

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg text-[#6B7280] hover:bg-[#E8EBF7] hover:text-[#283A97] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-[#283A97]">Registrar paciente</h1>
          <p className="mt-0.5 text-sm text-[#6B7280]">Complete los datos del nuevo paciente.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* Personal data */}
        <div className="bg-white rounded-xl border border-[#E2E6F0] p-6">
          <h2 className="text-sm font-semibold text-[#283A97] uppercase tracking-wide mb-4">Datos personales</h2>
          <div className="grid grid-cols-2 gap-4">

            <div className="col-span-2 flex flex-col gap-1.5">
              <label className={labelClass}>Nombre completo</label>
              <input type="text" placeholder="Ej: Juan Pérez" value={nombre} onChange={(e) => setNombre(e.target.value)} className={fieldErrors.nombre ? inputErrorClass : inputClass} />
              {fieldErrors.nombre && <p className={errorText}>{fieldErrors.nombre}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Identificación</label>
              <div className="flex overflow-hidden rounded-lg border border-[#D7DEF2] mb-1">
                <button type="button" onClick={() => { setDocumentType("nacional"); setCedula(""); }} className={`flex-1 py-1.5 text-xs font-medium transition-colors ${documentType === "nacional" ? "bg-[#283A97] text-white" : "bg-white text-[#6B7280] hover:bg-[#F4F5F8]"}`}>Nacional</button>
                <button type="button" onClick={() => { setDocumentType("extranjero"); setCedula(""); }} className={`flex-1 py-1.5 text-xs font-medium transition-colors ${documentType === "extranjero" ? "bg-[#283A97] text-white" : "bg-white text-[#6B7280] hover:bg-[#F4F5F8]"}`}>Extranjero</button>
              </div>
              <input type="text" placeholder={documentType === "nacional" ? "000000000" : "DIMEX o pasaporte"} value={cedula} onChange={(e) => setCedula(e.target.value)} className={fieldErrors.cedula ? inputErrorClass : inputClass} />
              {fieldErrors.cedula && <p className={errorText}>{fieldErrors.cedula}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Fecha de nacimiento</label>
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={fieldErrors.birthDate ? inputErrorClass : inputClass} />
              {fieldErrors.birthDate && <p className={errorText}>{fieldErrors.birthDate}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Teléfono</label>
              <input type="tel" placeholder={documentType === "nacional" ? "88888888" : "+506 88888888"} value={telefono} onChange={(e) => setTelefono(e.target.value)} className={fieldErrors.telefono ? inputErrorClass : inputClass} />
              {fieldErrors.telefono && <p className={errorText}>{fieldErrors.telefono}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Correo electrónico <span className="text-[#9CA3AF] font-normal">(opcional)</span></label>
              <input type="email" placeholder="nombre@correo.com" value={correo} onChange={(e) => setCorreo(e.target.value)} className={fieldErrors.correo ? inputErrorClass : inputClass} />
              {fieldErrors.correo && <p className={errorText}>{fieldErrors.correo}</p>}
            </div>

            <div className="col-span-2 flex flex-col gap-1.5">
              <label className={labelClass}>Dirección <span className="text-[#9CA3AF] font-normal">(opcional)</span></label>
              <input type="text" placeholder="Ej: Golfito, Bella Vista" value={direccion} onChange={(e) => setDireccion(e.target.value)} className={inputClass} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Peso (kg) <span className="text-[#9CA3AF] font-normal">(opcional)</span></label>
              <input type="number" placeholder="Ej: 65" min="1" max="300" step="0.1" value={peso} onChange={(e) => setPeso(e.target.value)} className={fieldErrors.peso ? inputErrorClass : inputClass} />
              {fieldErrors.peso && <p className={errorText}>{fieldErrors.peso}</p>}
            </div>
          </div>
        </div>

        {/* Medical background */}
        <div className="bg-white rounded-xl border border-[#E2E6F0] p-6">
          <h2 className="text-sm font-semibold text-[#283A97] uppercase tracking-wide mb-4">Antecedentes médicos</h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Alergias <span className="text-[#9CA3AF] font-normal">(opcional)</span></label>
              <textarea
                placeholder="Describa las alergias conocidas del paciente..."
                value={alergias}
                onChange={(e) => setAlergias(e.target.value)}
                rows={3}
                className="rounded-lg border border-[#D7DEF2] bg-white px-4 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#00C2F3] focus:outline-none focus:ring-2 focus:ring-[#00C2F3]/30 w-full resize-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelClass}>Enfermedades sistémicas <span className="text-[#9CA3AF] font-normal">(opcional)</span></label>
              <textarea
                placeholder="Describa enfermedades sistémicas relevantes..."
                value={enfermedades}
                onChange={(e) => setEnfermedades(e.target.value)}
                rows={3}
                className="rounded-lg border border-[#D7DEF2] bg-white px-4 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#00C2F3] focus:outline-none focus:ring-2 focus:ring-[#00C2F3]/30 w-full resize-none"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#DC2626]">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-lg border border-[#D7DEF2] px-4 py-2.5 text-sm text-[#6B7280] hover:bg-[#F4F5F8] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 rounded-lg bg-[#283A97] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1F2D75] disabled:opacity-60 transition-colors"
          >
            {isLoading ? "Registrando..." : "Registrar paciente"}
          </button>
        </div>
      </form>
    </div>
  );
}