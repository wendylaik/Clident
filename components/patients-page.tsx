"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Patient = {
  id: string;
  nombre: string;
  cedula: string;
  correo: string;
  telefono: string;
  es_activo: boolean;
  expediente_clinico: { id: string }[] | null;
};

type SearchCriteria = "nombre" | "cedula" | "correo" | "expediente";

const ITEMS_PER_PAGE = 8;

/**
 * Genera las iniciales de un nombre para mostrar en el avatar.
 * @param name - Nombre completo del paciente
 * @returns Hasta 2 iniciales en mayúscula
 */
function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

/** Paleta de colores para los avatares generados automáticamente. */
const avatarColors = ["bg-[#283A97]", "bg-[#00838F]", "bg-[#E45C3C]", "bg-[#7C3AED]", "bg-[#059669]"];

/**
 * Asigna un color de avatar determinístico basado en la primera letra del nombre.
 * @param name - Nombre del paciente
 * @returns Clase de Tailwind con el color de fondo
 */
function getAvatarColor(name: string) {
  return avatarColors[name.charCodeAt(0) % avatarColors.length];
}

/**
 * Página de listado y gestión de pacientes. Reutilizable para admin y odontólogo.
 * Permite buscar por nombre, cédula, correo o número de expediente,
 * filtrar por estado y paginar los resultados.
 *
 * @param basePath - Ruta base del rol actual (/admin/patients o /dentist/patients)
 */
export default function PatientsPage({ basePath }: { basePath: string }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>("nombre");
  const [searchValue, setSearchValue] = useState("");
  const [filterEstado, setFilterEstado] = useState<"todos" | "activo" | "inactivo">("todos");
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);
  const router = useRouter();

/**
 * Carga todos los pacientes con sus datos básicos y número de expediente
 * ordenados por nombre.
 */
  const fetchPatients = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("paciente")
      .select("id, nombre, cedula, correo, telefono, es_activo, expediente_clinico(id)")
      .order("nombre");
    setPatients(data ?? []);
    setIsLoading(false);
  };

  useEffect(() => { fetchPatients(); }, []);

/**
 * Filtra los pacientes según el criterio de búsqueda seleccionado y el filtro de estado.
 * Soporta búsqueda por nombre, cédula, correo y número de expediente clínico.
 */
  const filtered = patients.filter((p) => {
    const matchEstado =
      filterEstado === "todos" ||
      (filterEstado === "activo" ? p.es_activo : !p.es_activo);

    if (!searchValue.trim()) return matchEstado;

    let matchSearch = false;
    if (searchCriteria === "nombre") {
      matchSearch = p.nombre.toLowerCase().includes(searchValue.toLowerCase());
    } else if (searchCriteria === "cedula") {
      matchSearch = p.cedula?.includes(searchValue);
    } else if (searchCriteria === "correo") {
      matchSearch = p.correo?.toLowerCase().includes(searchValue.toLowerCase());
    } else if (searchCriteria === "expediente") {
      matchSearch = p.expediente_clinico?.some((e) =>
        e.id.toLowerCase().includes(searchValue.toLowerCase())
      ) ?? false;
    }

    return matchSearch && matchEstado;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

/**
 * Activa o desactiva un paciente con validaciones previas.
 * Para desactivar: verifica que no tenga citas pendientes.
 * Para reactivar: verifica que no exista otro paciente activo con la misma cédula.
 * @param patient - Paciente a activar o desactivar
 */
  const handleToggleActive = async (patient: Patient) => {
    setActionError(null);
    const supabase = createClient();

    if (patient.es_activo) {
      const { data: citas } = await supabase
        .from("cita")
        .select("id")
        .eq("id_paciente", patient.id)
        .in("estado", ["programada", "confirmada"]);

      if (citas && citas.length > 0) {
        setActionError(`No se puede desactivar a ${patient.nombre} porque tiene ${citas.length} cita(s) pendiente(s). Cancélelas primero.`);
        return;
      }
    } else {
      const { data: duplicate } = await supabase
        .from("paciente")
        .select("id")
        .eq("cedula", patient.cedula)
        .eq("es_activo", true)
        .neq("id", patient.id)
        .single();

      if (duplicate) {
        setActionError(`No se puede reactivar a ${patient.nombre} porque ya existe otro paciente activo con la misma cédula.`);
        return;
      }
    }

    await supabase
      .from("paciente")
      .update({ es_activo: !patient.es_activo })
      .eq("id", patient.id);

    fetchPatients();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#283A97]">Pacientes</h1>
          <p className="mt-1 text-sm text-[#6B7280]">Gestión de pacientes registrados en la clínica.</p>
        </div>
        <button
          onClick={() => router.push(`${basePath}/new`)}
          className="flex items-center gap-2 rounded-lg bg-[#283A97] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1F2D75] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          Registrar paciente
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total pacientes", value: patients.length },
          { label: "Pacientes activos", value: patients.filter((p) => p.es_activo).length },
          { label: "Pacientes inactivos", value: patients.filter((p) => !p.es_activo).length },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-[#E2E6F0] px-5 py-4">
            <p className="text-xs text-[#6B7280] uppercase tracking-wide">{m.label}</p>
            <p className="text-2xl font-semibold text-[#283A97] mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      {actionError && (
        <div className="mb-4 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#DC2626]">
          {actionError}
          <button onClick={() => setActionError(null)} className="ml-2 font-medium underline">Cerrar</button>
        </div>
      )}

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="flex rounded-lg border border-[#D7DEF2] overflow-hidden bg-white">
          <select
            value={searchCriteria}
            onChange={(e) => { setSearchCriteria(e.target.value as SearchCriteria); setSearchValue(""); setPage(1); }}
            className="px-3 py-2 text-sm text-[#283A97] font-medium bg-[#F4F5F8] border-r border-[#D7DEF2] focus:outline-none"
          >
            <option value="nombre">Nombre</option>
            <option value="cedula">Cédula</option>
            <option value="correo">Correo</option>
            <option value="expediente">N° Expediente</option>
          </select>
          <input
            type="text"
            placeholder={
              searchCriteria === "nombre" ? "Buscar por nombre..." :
              searchCriteria === "cedula" ? "Buscar por cédula..." :
              searchCriteria === "correo" ? "Buscar por correo..." :
              "Buscar por N° expediente..."
            }
            value={searchValue}
            onChange={(e) => { setSearchValue(e.target.value); setPage(1); }}
            className="px-4 py-2 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:outline-none w-64 bg-white"
          />
        </div>
        <select
          value={filterEstado}
          onChange={(e) => { setFilterEstado(e.target.value as "todos" | "activo" | "inactivo"); setPage(1); }}
          className="rounded-lg border border-[#D7DEF2] bg-white px-4 py-2 text-sm text-[#1F2937] focus:border-[#00C2F3] focus:outline-none"
        >
          <option value="todos">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-[#6B7280]">Cargando pacientes...</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-[#6B7280]">No se encontraron pacientes con los criterios aplicados.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E6F0] bg-[#F4F5F8]">
                {["Nombre", "Cédula", "Correo", "Teléfono", "Estado", "Acciones"].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wide px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((patient) => (
                <tr key={patient.id} className="border-b border-[#F1F4FA] hover:bg-[#FAFBFF] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 ${getAvatarColor(patient.nombre)}`}>
                        {getInitials(patient.nombre)}
                      </div>
                      <span className="text-sm font-medium text-[#1F2937]">{patient.nombre}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-[#6B7280]">{patient.cedula ?? "—"}</td>
                  <td className="px-5 py-3 text-sm text-[#6B7280]">{patient.correo ?? "—"}</td>
                  <td className="px-5 py-3 text-sm text-[#6B7280]">{patient.telefono ?? "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${patient.es_activo ? "bg-[#ECFDF5] text-[#059669]" : "bg-[#FEF2F2] text-[#DC2626]"}`}>
                      {patient.es_activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => router.push(`${basePath}/${patient.id}`)}
                        title="Ver perfil"
                        className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#283A97] hover:bg-[#E8EBF7] transition-colors"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                        <button
                        onClick={() => router.push(`${basePath}/${patient.id}`)}
                        title="Editar"
                        className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#283A97] hover:bg-[#E8EBF7] transition-colors"
                        >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleToggleActive(patient)}
                        title={patient.es_activo ? "Desactivar" : "Activar"}
                        className={`p-1.5 rounded-lg transition-colors ${patient.es_activo ? "text-[#DC2626] hover:bg-[#FEF2F2]" : "text-[#059669] hover:bg-[#ECFDF5]"}`}
                      >
                        {patient.es_activo ? (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                        ) : (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><polyline points="9 12 11 14 15 10" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#E2E6F0]">
            <p className="text-xs text-[#6B7280]">
              Mostrando {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} de {filtered.length} pacientes
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F4F5F8] disabled:opacity-40">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${page === p ? "bg-[#283A97] text-white" : "text-[#6B7280] hover:bg-[#F4F5F8]"}`}>{p}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F4F5F8] disabled:opacity-40">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}