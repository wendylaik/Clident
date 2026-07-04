"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ServicioType = { nombre: string; duracion_horas: number };

type Appointment = {
  id: string;
  fecha: string;
  hora: string;
  estado: string;
  servicio: ServicioType | ServicioType[] | null;
};

/** Mapa de colores por estado de cita para los badges de las próximas citas. */
const estadoColor: Record<string, string> = {
  programada: "#283A97",
  confirmada: "#059669",
  cancelada: "#DC2626",
  completada: "#6B7280",
  no_asistio: "#E45C3C",
};

/** Mapa de etiquetas legibles por estado de cita. */
const estadoLabel: Record<string, string> = {
  programada: "Programada",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  completada: "Completada",
  no_asistio: "No asistió",
};

/**
 * Extrae el servicio de un campo que puede ser objeto o array según el join de Supabase.
 * @param servicio - Objeto ServicioType, array de ServicioType, o null
 * @returns ServicioType o null si no existe
 */
function getServicio(servicio: ServicioType | ServicioType[] | null): ServicioType | null {
  if (!servicio) return null;
  return Array.isArray(servicio) ? servicio[0] ?? null : servicio;
}

/**
 * Dashboard del paciente. Muestra un saludo personalizado, las próximas 3 citas
 * programadas o confirmadas, y accesos rápidos a las secciones más usadas.
 */
export default function PatientDashboard() {
  const [patientName, setPatientName] = useState("");
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

/**
 * Carga los datos del dashboard: nombre del paciente y sus próximas 3 citas
 * (excluyendo canceladas, no asistidas y completadas), ordenadas por fecha y hora.
 */
  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: paciente } = await supabase
        .from("paciente")
        .select("id, nombre")
        .eq("id_usuario", user.id)
        .single();

      if (!paciente) return;
      setPatientName(paciente.nombre);

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

      const { data: citas } = await supabase
        .from("cita")
        .select("id, fecha, hora, estado, servicio(nombre, duracion_horas)")
        .eq("id_paciente", paciente.id)
        .gte("fecha", todayStr)
        .not("estado", "in", "(cancelada,no_asistio,completada)")
        .order("fecha", { ascending: true })
        .order("hora", { ascending: true })
        .limit(3);

      if (citas) setUpcomingAppointments(citas as Appointment[]);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const firstName = patientName.split(" ")[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[#6B7280]">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl flex flex-col gap-6">

      {/* Hero banner */}
      <div className="rounded-2xl bg-[#283A97] px-8 py-8 text-white relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute top-4 right-16 w-20 h-20 rounded-full bg-[#00C2F3]/20" />
        <div className="absolute -bottom-6 right-4 w-28 h-28 rounded-full bg-white/5" />
        <div className="relative z-10">
          <p className="text-[#9FB3E8] text-sm mb-1">Portal del paciente</p>
          <h1 className="text-3xl font-semibold">Hola, {firstName}</h1>
          <p className="mt-1 text-[#C7D3F0] text-sm">Sonríale a la vida.</p>
        </div>
      </div>

      {/* Upcoming appointments */}
      <div>
        <h2 className="text-xs font-semibold text-[#283A97] uppercase tracking-widest mb-3">
          Próximas citas
        </h2>
        {upcomingAppointments.length > 0 ? (
          <div className="flex flex-col gap-3">
            {upcomingAppointments.map((cita) => {
              const svc = getServicio(cita.servicio);
              return (
                <div
                  key={cita.id}
                  className="bg-white rounded-xl border border-[#E2E6F0] p-5 cursor-pointer hover:border-[#283A97] hover:shadow-sm transition-all"
                  onClick={() => router.push("/patient/my-appointments")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#E8EBF7] flex items-center justify-center shrink-0">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#283A97" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1F2937]">{svc?.nombre ?? "Cita"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-[#6B7280]">
                            {new Date(cita.fecha + "T12:00:00").toLocaleDateString("es-CR", { weekday: "short", day: "numeric", month: "short" })}
                          </p>
                          <span className="text-[#D1D5DB]">·</span>
                          <p className="text-xs text-[#6B7280]">
                            {cita.hora?.slice(0, 5)} {svc?.duracion_horas ? `(${svc.duracion_horas}h)` : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                      style={{ backgroundColor: `${estadoColor[cita.estado]}18`, color: estadoColor[cita.estado] }}
                    >
                      {estadoLabel[cita.estado]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E2E6F0] p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#1F2937]">No tienes citas próximas</p>
              <p className="text-xs text-[#6B7280] mt-0.5">Agenda una cita cuando lo necesites</p>
            </div>
            <button
              onClick={() => router.push("/patient/my-appointments")}
              className="rounded-lg bg-[#283A97] px-4 py-2 text-xs font-medium text-white hover:bg-[#1F2D75] transition-colors"
            >
              Agendar cita
            </button>
          </div>
        )}
      </div>

      {/* Quick access */}
      <div>
        <h2 className="text-xs font-semibold text-[#283A97] uppercase tracking-widest mb-3">
          Accesos rápidos
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Mis citas",
              description: "Ver y agendar citas",
              href: "/patient/my-appointments",
              color: "#283A97",
              bg: "#E8EBF7",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              ),
            },
            {
              label: "Mi expediente",
              description: "Historial clínico",
              href: "/patient/my-record",
              color: "#00838F",
              bg: "#E0F7FA",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="17" x2="15" y2="17" />
                </svg>
              ),
            },
            {
              label: "Mi perfil",
              description: "Datos personales",
              href: "/patient/my-profile",
              color: "#7C3AED",
              bg: "#EDE9FE",
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              ),
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col gap-3 bg-white rounded-xl border border-[#E2E6F0] p-5 hover:border-[#283A97] hover:shadow-sm transition-all"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: item.bg, color: item.color }}
              >
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">{item.label}</p>
                <p className="text-xs text-[#6B7280] mt-0.5">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}