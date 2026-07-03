"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type TodayAppointment = {
  id: string;
  hora: string;
  estado: string;
  paciente: { nombre: string } | { nombre: string }[] | null;
  servicio: { nombre: string } | { nombre: string }[] | null;
};

const estadoColor: Record<string, string> = {
  programada: "#283A97",
  confirmada: "#059669",
  cancelada: "#DC2626",
  completada: "#6B7280",
  no_asistio: "#E45C3C",
};

const estadoLabel: Record<string, string> = {
  programada: "Programada",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
  completada: "Completada",
  no_asistio: "No asistió",
};

function getName(val: { nombre: string } | { nombre: string }[] | null): string {
  if (!val) return "—";
  return Array.isArray(val) ? val[0]?.nombre ?? "—" : val.nombre;
}

export default function AdminDashboard() {
  const [adminName, setAdminName] = useState("");
  const [totalPatients, setTotalPatients] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: usuario } = await supabase
        .from("usuario")
        .select("nombre")
        .eq("id", user.id)
        .single();
      if (usuario) setAdminName(usuario.nombre);

      const { count: patientCount } = await supabase
        .from("paciente")
        .select("id", { count: "exact", head: true })
        .eq("es_activo", true);
      setTotalPatients(patientCount ?? 0);

      const { count: userCount } = await supabase
        .from("usuario")
        .select("id", { count: "exact", head: true })
        .eq("es_activo", true);
      setActiveUsers(userCount ?? 0);

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

      const { data: citas } = await supabase
        .from("cita")
        .select("id, hora, estado, paciente(nombre), servicio(nombre)")
        .eq("fecha", todayStr)
        .not("estado", "eq", "cancelada")
        .order("hora", { ascending: true });

      setTodayAppointments((citas ?? []) as TodayAppointment[]);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  const firstName = adminName.split(" ")[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[#6B7280]">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl flex flex-col gap-6">

      {/* Hero banner */}
      <div className="rounded-2xl bg-[#283A97] px-8 py-8 text-white relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute top-4 right-16 w-20 h-20 rounded-full bg-[#00C2F3]/20" />
        <div className="absolute -bottom-6 right-4 w-28 h-28 rounded-full bg-white/5" />
        <div className="relative z-10">
          <p className="text-[#9FB3E8] text-sm mb-1">Panel de administración</p>
          <h1 className="text-3xl font-semibold">Hola, {firstName}</h1>
          <p className="mt-1 text-[#C7D3F0] text-sm">Aquí tienes el resumen de actividad del sistema.</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Pacientes activos",
            value: totalPatients,
            color: "#283A97",
            bg: "#E8EBF7",
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            ),
          },
          {
            label: "Citas hoy",
            value: todayAppointments.length,
            color: "#00838F",
            bg: "#E0F7FA",
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            ),
          },
          {
            label: "Usuarios activos",
            value: activeUsers,
            color: "#7C3AED",
            bg: "#EDE9FE",
            icon: (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            ),
          },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-[#E2E6F0] p-5 flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: m.bg, color: m.color }}
            >
              {m.icon}
            </div>
            <div>
              <p className="text-2xl font-semibold text-[#1F2937]">{m.value}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">{m.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Today's appointments */}
        <div>
          <h2 className="text-xs font-semibold text-[#283A97] uppercase tracking-widest mb-3">
            Citas de hoy
          </h2>
          <div className="bg-white rounded-xl border border-[#E2E6F0] overflow-hidden">
            {todayAppointments.length > 0 ? (
              <div className="divide-y divide-[#F1F4FA]">
                {todayAppointments.map((cita) => (
                  <div
                    key={cita.id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-[#FAFBFF] cursor-pointer transition-colors"
                    onClick={() => router.push("/admin/appointments")}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-[#283A97] w-12 shrink-0">
                        {cita.hora?.slice(0, 5)}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[#1F2937]">{getName(cita.paciente)}</p>
                        <p className="text-xs text-[#6B7280]">{getName(cita.servicio)}</p>
                      </div>
                    </div>
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
                      style={{ backgroundColor: `${estadoColor[cita.estado]}15`, color: estadoColor[cita.estado] }}
                    >
                      {estadoLabel[cita.estado]}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-10">
                <p className="text-sm text-[#6B7280]">No hay citas programadas para hoy.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick access */}
        <div>
          <h2 className="text-xs font-semibold text-[#283A97] uppercase tracking-widest mb-3">
            Accesos rápidos
          </h2>
          <div className="flex flex-col gap-3">
            {[
              {
                label: "Registrar paciente",
                description: "Agregar un nuevo paciente al sistema",
                href: "/admin/patients/new",
                color: "#283A97",
                bg: "#E8EBF7",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" />
                    <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
                  </svg>
                ),
              },
              {
                label: "Gestionar usuarios",
                description: "Administrar usuarios del sistema",
                href: "/admin/users",
                color: "#7C3AED",
                bg: "#EDE9FE",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                ),
              },
              {
                label: "Ver calendario",
                description: "Consultar y gestionar citas",
                href: "/admin/appointments",
                color: "#00838F",
                bg: "#E0F7FA",
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                ),
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 bg-white rounded-xl border border-[#E2E6F0] px-5 py-4 hover:border-[#283A97] hover:shadow-sm transition-all"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
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
    </div>
  );
}