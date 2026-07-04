"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useRef, useState } from "react";
import { EventClickArg } from "@fullcalendar/core";
import { useRouter } from "next/navigation";

type Appointment = {
  id: string;
  id_paciente: string;
  id_servicio: string;
  fecha: string;
  hora: string;
  estado: string;
  observaciones: string | null;
  paciente: { nombre: string } | null;
  servicio: { nombre: string; duracion_horas: number } | null;
};

type Service = {
  id: string;
  nombre: string;
  duracion_horas: number;
};

type Patient = {
  id: string;
  nombre: string;
};

type CalendarRole = "admin" | "dentist" | "patient";


/** Mapa de colores por estado de cita para los eventos del calendario. */
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
 * Componente principal del calendario de citas. Reutilizable para los tres roles del sistema.
 * 
 * - Admin y odontólogo: vista mensual y semanal, todas las citas, opciones de gestión completas.
 * - Paciente: vista semanal, sus citas con detalles y citas ajenas como bloques "Ocupado",
 *   limitado a las próximas dos semanas.
 *
 * @param role - Rol del usuario: "admin" | "dentist" | "patient"
 */
export default function AppointmentsCalendar({ role }: { role: CalendarRole }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPatientId, setCurrentPatientId] = useState<string | null>(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const router = useRouter();

  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [newPatientId, setNewPatientId] = useState("");
  const [newServiceId, setNewServiceId] = useState("");
  const [newObservaciones, setNewObservaciones] = useState("");
  const [newError, setNewError] = useState<string | null>(null);
  const [newLoading, setNewLoading] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

  const calendarRef = useRef<FullCalendar>(null);


/**
 * Carga los datos del calendario según el rol del usuario.
 * Para pacientes: obtiene sus citas propias con detalles y la disponibilidad
 * general de la clínica para mostrar bloques ocupados sin exponer datos de otros pacientes.
 * Para admin y odontólogo: obtiene todas las citas y la lista de pacientes activos.
 */
  const fetchData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: servicesData } = await supabase
      .from("servicio")
      .select("id, nombre, duracion_horas")
      .eq("activo", true)
      .order("nombre");
    setServices(servicesData ?? []);

        if (role === "patient") {
        const { data: paciente } = await supabase
            .from("paciente")
            .select("id")
            .eq("id_usuario", user.id)
            .single();

        if (paciente) {
            setCurrentPatientId(paciente.id);

            const { data: disponibilidad } = await supabase
            .from("disponibilidad_citas")
            .select("*");

            const { data: citasPropias } = await supabase
            .from("cita")
            .select("*, paciente(nombre), servicio(nombre, duracion_horas)")
            .eq("id_paciente", paciente.id)
            .not("estado", "in", '("cancelada","no_asistio")');

            const citasAjenas = (disponibilidad ?? [])
            .filter((d) => !citasPropias?.some((c) => c.id === d.id))
            .map((d) => ({
                ...d,
                id_paciente: "",
                estado: "programada",
                observaciones: null,
                paciente: null,
                servicio: { nombre: "Ocupado", duracion_horas: d.duracion_horas },
            }));

            setAppointments([...(citasPropias ?? []), ...citasAjenas]);
        }
        } else {

        const { data: citasData } = await supabase
            .from("cita")
            .select("*, paciente(nombre), servicio(nombre, duracion_horas)")
            .order("fecha");
        setAppointments(citasData ?? []);

        const { data: patientsData } = await supabase
            .from("paciente")
            .select("id, nombre")
            .eq("es_activo", true)
            .order("nombre");
        setPatients(patientsData ?? []);
        }

    setIsLoading(false);
    };

  useEffect(() => { fetchData(); }, []);


/**
 * Transforma las citas en eventos para FullCalendar.
 * Para pacientes: las citas ajenas se muestran como bloques grises sin información.
 * Para admin y odontólogo: cada evento muestra nombre del paciente y servicio.
 */
const events = appointments.map((a) => {
  const isOwn = a.id_paciente === currentPatientId;
  const durationHours = a.servicio?.duracion_horas ?? 1;
  const time = String(a.hora).split("+")[0].slice(0, 5);
  const startStr = `${a.fecha}T${time}:00`;
  const [h, m] = time.split(":").map(Number);
  const endStr = `${a.fecha}T${String(h + durationHours).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;

  if (role === "patient" && !isOwn) {
    return {
      id: a.id,
      title: "Ocupado",
      start: startStr,
      end: endStr,
      backgroundColor: "#E2E6F0",
      borderColor: "#C0C7D6",
      textColor: "#6B7280",
      extendedProps: { appointment: null }, 
    };
  }

  return {
    id: a.id,
    title: role === "patient"
      ? a.servicio?.nombre ?? "Cita"
      : `${a.paciente?.nombre ?? "Paciente"} — ${a.servicio?.nombre ?? ""}`,
    start: startStr,
    end: endStr,
    backgroundColor: estadoColor[a.estado] ?? "#283A97",
    borderColor: estadoColor[a.estado] ?? "#283A97",
    extendedProps: { appointment: role === "patient" ? (isOwn ? a : null) : a },
  };
});


/** Filtra los eventos según el toggle de citas canceladas (solo para admin y odontólogo). */
const filteredEvents = role === "patient" 
  ? events 
  : events.filter((e) => showCancelled || e.extendedProps.appointment?.estado !== "cancelada");


/**
 * Verifica si una fecha y hora están dentro del horario de atención de la clínica.
 * Horario: lunes a viernes 8:00-11:30 y 13:00-18:00, sábados 10:00-14:00, domingos cerrado.
 * @param date - Objeto Date a verificar
 * @returns true si la clínica está abierta en ese horario
 */
  const isClinicOpen = (date: Date): boolean => {
    const day = date.getDay();
    if (day === 0) return false; // Sunday closed
    if (day === 6) {
      const hours = date.getHours();
      return hours >= 10 && hours < 14;
    }
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timeInMinutes = hours * 60 + minutes;
    const morningEnd = 11 * 60 + 30;
    const afternoonStart = 13 * 60;
    const afternoonEnd = 18 * 60;
    return (timeInMinutes >= 8 * 60 && timeInMinutes < morningEnd) ||
      (timeInMinutes >= afternoonStart && timeInMinutes < afternoonEnd);
  };

/**
 * Verifica si un horario está disponible para agendar una cita.
 * Valida que la hora no sea en el pasado, que esté dentro del horario de la clínica
 * y que no se solape con ninguna cita existente.
 * Trabaja en minutos para evitar problemas de zona horaria.
 *
 * @param date - Fecha en formato YYYY-MM-DD
 * @param time - Hora en formato HH:MM
 * @param serviceId - UUID del servicio a agendar
 * @param excludeId - UUID de cita a ignorar en la validación (usado al reprogramar)
 * @returns true si el horario está disponible, false si no
 */
const isSlotAvailable = (date: string, time: string, serviceId: string, excludeId?: string): boolean => {

const now = new Date();

/** Fecha de hoy en formato YYYY-MM-DD calculada sin usar toISOString() para evitar problemas de zona horaria. */
const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const service = services.find((s) => s.id === serviceId);
  const duration = service?.duracion_horas ?? 1;

  const [h, m] = time.split(":").map(Number);
  const startMinutes = h * 60 + m;
  const endMinutes = startMinutes + duration * 60;
  if (date === todayStr && startMinutes <= currentMinutes) return false;
    if (date < todayStr) return false;

  // Validate clinic hours
  const day = new Date(`${date}T12:00:00`).getDay(); 
  if (day === 0) return false; 
  if (day === 6) {
    if (startMinutes < 10 * 60 || endMinutes > 14 * 60) return false;
  } else {
    const morningEnd = 11 * 60 + 30;
    const afternoonStart = 13 * 60;
    const afternoonEnd = 18 * 60;
    const inMorning = startMinutes >= 8 * 60 && endMinutes <= morningEnd;
    const inAfternoon = startMinutes >= afternoonStart && endMinutes <= afternoonEnd;
    if (!inMorning && !inAfternoon) return false;
  }

  // Check for overlapping appointments
  return !appointments.some((a) => {
    if (excludeId && a.id === excludeId) return false;
    if (a.estado === "cancelada") return false;
    if (a.fecha !== date) return false;

    const aTime = String(a.hora).split("+")[0].slice(0, 5);
    const [ah, am] = aTime.split(":").map(Number);
    const aStartMinutes = ah * 60 + am;
    const aEndMinutes = aStartMinutes + (a.servicio?.duracion_horas ?? 1) * 60;

    return startMinutes < aEndMinutes && endMinutes > aStartMinutes;
  });
};


/**
 * Maneja el clic en un slot vacío del calendario.
 * Verifica que la fecha no sea pasada y que esté dentro del horario de la clínica
 * antes de abrir el modal de nueva cita con la fecha y hora preseleccionadas.
 */
    const handleDateClick = (info: { dateStr: string; date: Date }) => {
        if (role === "patient") {
        if (info.date < new Date()) return; // no permitir pasado
        if (!isClinicOpen(info.date)) return; // no permitir fuera de horario
        setSelectedDate(info.dateStr.split("T")[0]);
        setSelectedTime(info.dateStr.includes("T") ? info.dateStr.split("T")[1].slice(0, 5) : "08:00");
        setNewServiceId("");
        setNewObservaciones("");
        setNewError(null);
        setShowNewModal(true);
        return;
        }

        if (info.date < new Date()) return;
        if (!isClinicOpen(info.date)) return;

    const [datePart, timePart] = info.dateStr.includes("T")
        ? info.dateStr.split("T")
        : [info.dateStr, "08:00"];

    setSelectedDate(datePart);
    setSelectedTime(timePart.slice(0, 5));
    setNewPatientId("");
    setNewServiceId("");
    setNewObservaciones("");
    setNewError(null);
    setShowNewModal(true);
    };

/**
 * Maneja el clic en un evento del calendario.
 * Para bloques "Ocupado" (citas ajenas al paciente) no abre el modal.
 * Para citas propias abre el modal de detalle con las opciones disponibles según el rol.
 */
   const handleEventClick = (info: EventClickArg) => {
        console.log("extendedProps:", info.event.extendedProps);
        const appointment = info.event.extendedProps.appointment as Appointment | null;
        console.log("appointment:", appointment);
        if (!appointment) return;
        setSelectedAppointment(appointment);
        setShowReschedule(false);
        setDetailError(null);
        setShowDetailModal(true);
    };

/**
 * Crea una nueva cita en la base de datos.
 * Valida que los campos estén completos y que el horario esté disponible
 * antes de insertar en la tabla cita.
 */
  const handleCreateAppointment = async () => {
    if (!newServiceId || !selectedDate || !selectedTime) {
      setNewError("Complete todos los campos requeridos");
      return;
    }
    const patientId = role === "patient" ? currentPatientId : newPatientId;
    if (!patientId) {
      setNewError("Seleccione un paciente");
      return;
    }
    const service = services.find(s => s.id === newServiceId);

    if (!isSlotAvailable(selectedDate, selectedTime, newServiceId)) {
    setNewError(
        `El servicio "${service?.nombre}" requiere ${service?.duracion_horas} hora(s) consecutivas. Seleccione otro horario con disponibilidad suficiente.`
    );
    return;
    }

    setNewLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("cita").insert({
      id_paciente: patientId,
      id_servicio: newServiceId,
      id_seguimiento: null,
      fecha: selectedDate,
      hora: selectedTime,
      estado: "programada",
      observaciones: newObservaciones || null,
    });

    if (error) {
      setNewError(error.message);
    } else {
      setShowNewModal(false);
      fetchData();
    }
    setNewLoading(false);
  };

/**
 * Cancela una cita cambiando su estado a "cancelada".
 * Disponible para todos los roles sobre sus citas correspondientes.
 */
  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    setDetailLoading(true);
    const supabase = createClient();
    await supabase.from("cita").update({ estado: "cancelada" }).eq("id", selectedAppointment.id);
    setShowDetailModal(false);
    fetchData();
    setDetailLoading(false);
  };

/**
 * Confirma la asistencia del paciente a una cita cambiando su estado a "confirmada".
 * Solo disponible para el paciente sobre sus propias citas programadas.
 */
  const handleConfirmAttendance = async () => {
    if (!selectedAppointment) return;
    setDetailLoading(true);
    const supabase = createClient();
    await supabase.from("cita").update({ estado: "confirmada" }).eq("id", selectedAppointment.id);
    setShowDetailModal(false);
    fetchData();
    setDetailLoading(false);
  };

/**
 * Marca la asistencia o inasistencia del paciente a una cita.
 * Solo disponible para admin y odontólogo.
 * @param attended - true para marcar como completada, false para no_asistio
 */
  const handleMarkAttendance = async (attended: boolean) => {
    if (!selectedAppointment) return;
    setDetailLoading(true);
    const supabase = createClient();
    await supabase.from("cita")
      .update({ estado: attended ? "completada" : "no_asistio" })
      .eq("id", selectedAppointment.id);
    setShowDetailModal(false);
    fetchData();
    setDetailLoading(false);
  };

/**
 * Reprograma una cita a una nueva fecha y hora.
 * Valida disponibilidad del nuevo horario excluyendo la cita actual.
 * Solo disponible para admin y odontólogo.
 */
  const handleReschedule = async () => {
    if (!selectedAppointment || !rescheduleDate || !rescheduleTime) {
      setDetailError("Complete la nueva fecha y hora");
      return;
    }
    if (!isSlotAvailable(rescheduleDate, rescheduleTime, selectedAppointment.id_servicio, selectedAppointment.id)) {
      setDetailError("El nuevo horario no está disponible");
      return;
    }
    setDetailLoading(true);
    const supabase = createClient();
    await supabase.from("cita")
      .update({ fecha: rescheduleDate, hora: rescheduleTime, estado: "programada" })
      .eq("id", selectedAppointment.id);
    setShowDetailModal(false);
    setShowReschedule(false);
    fetchData();
    setDetailLoading(false);
  };

  const inputClass = "rounded-lg border border-[#D7DEF2] bg-white px-4 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#00C2F3] focus:outline-none focus:ring-2 focus:ring-[#00C2F3]/30 w-full";
  const labelClass = "text-sm font-medium text-[#283A97]";
 
  const todayStr = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
})();

  const [today] = useState(() => new Date());

/** 
 * Fecha mínima del calendario para el paciente.
 * Se calcula retrocediendo al lunes de la semana actual para mostrar
 * la semana completa aunque algunos días ya hayan pasado.
 */
const [minDate] = useState(() => {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; 
  d.setDate(d.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
});

/** Fecha máxima del calendario para el paciente: dos semanas a partir de hoy. */
    const [maxDate] = useState(() => {
        
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split("T")[0];
    });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#283A97]">
            {role === "patient" ? "Mis citas" : "Gestión de citas"}
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            {role === "patient"
              ? "Consulte y gestione sus citas programadas."
              : "Calendario de citas de la clínica."}
          </p>
        </div>
        
      </div>


                {role !== "patient" && (
                <div className="flex items-center gap-3 mb-4">
                    <button
                    onClick={() => setShowCancelled((v) => !v)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        showCancelled
                        ? "border-[#DC2626] bg-[#FEF2F2] text-[#DC2626]"
                        : "border-[#D7DEF2] bg-white text-[#6B7280] hover:border-[#DC2626] hover:text-[#DC2626]"
                    }`}
                    >
                    <div className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
                    {showCancelled ? "Ocultar canceladas" : "Mostrar canceladas"}
                    </button>
                </div>
                )}

{/* Leyenda de colores: paciente solo ve programada y confirmada, internos ven todos los estados */}
        <div className="flex gap-4 mb-4 flex-wrap">
        {Object.entries(estadoLabel)
            .filter(([key]) => 
            role === "patient" 
                ? ["programada", "confirmada"].includes(key)
                : true
            )
            .map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: estadoColor[key] }} />
                <span className="text-xs text-[#6B7280]">{label}</span>
            </div>
            ))}
        </div>

{/* 
  Calendario FullCalendar con estilos personalizados según la paleta de colores de Clident.
  - Vista mensual por defecto para admin y odontólogo, semanal para paciente.
  - businessHours resalta el horario de atención de la clínica.
  - validRange limita la navegación del paciente a dos semanas.
*/}
      {isLoading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-[#E2E6F0]">
          <p className="text-sm text-[#6B7280]">Cargando citas...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E6F0] p-4 calendar-wrapper">
<style>{`
  .calendar-wrapper .fc-toolbar-title { color: #283A97; font-size: 1.1rem; font-weight: 600; }
  .calendar-wrapper .fc-button-primary { background-color: #283A97 !important; border-color: #283A97 !important; font-size: 0.8rem; }
  .calendar-wrapper .fc-button-primary:hover { background-color: #1F2D75 !important; }
  .calendar-wrapper .fc-button-active { background-color: #1F2D75 !important; }
  .calendar-wrapper .fc-day-today { background-color: #F1F4FA !important; }
  .calendar-wrapper .fc-day-today .fc-daygrid-day-number { color: #283A97 !important; font-weight: 600; }
  .calendar-wrapper .fc-event { cursor: pointer; border-radius: 4px; font-size: 0.75rem; }
  .calendar-wrapper .fc-col-header-cell { background: #F4F5F8; color: #283A97; font-weight: 500; font-size: 0.8rem; }
  .calendar-wrapper .fc-timegrid-slot-minor { border-top-color: #F1F4FA; }
  .calendar-wrapper .fc-daygrid-day-number { color: #374151 !important; font-weight: 400; }
  .calendar-wrapper .fc-day-past .fc-daygrid-day-number { color: #9CA3AF !important; }
  .calendar-wrapper .fc-day-other .fc-daygrid-day-number { color: #D1D5DB !important; }
  .calendar-wrapper .fc-col-header-cell-cushion { color: #283A97 !important; text-decoration: none; }
  .calendar-wrapper td, .calendar-wrapper th { border-color: #E2E6F0 !important; }
  .calendar-wrapper .fc-timegrid-slot-label { color: #6B7280 !important; }
  .calendar-wrapper .fc-scrollgrid { border-color: #E2E6F0 !important; }
  .calendar-wrapper .fc-timegrid-col.fc-day-past { background: #F8F9FB !important; }
  .calendar-wrapper .fc-daygrid-event { color: #ffffff !important; }
.calendar-wrapper .fc-daygrid-event .fc-event-title { color: #ffffff !important; font-weight: 500; }
.calendar-wrapper .fc-daygrid-event .fc-event-time { display: none !important; }
.calendar-wrapper .fc-daygrid-dot-event .fc-event-title { color: #1F2937 !important; }
.calendar-wrapper .fc-daygrid-dot-event { color: #1F2937 !important; }
`}</style>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={role === "patient" ? "timeGridWeek" : "dayGridMonth"}
            headerToolbar={role === "patient" ? {
              left: "prev,next today",
              center: "title",
              right: "",
            } : {
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek",
            }}
            buttonText={{
              today: "Hoy",
              month: "Mes",
              week: "Semana",
            }}
            locale="es"
            events={filteredEvents}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            slotMinTime="07:00:00"
            slotMaxTime="19:00:00"
            slotDuration="00:30:00"
            allDaySlot={false}
            weekends={true}
            hiddenDays={[0]}
            validRange={role === "patient" ? { start: minDate, end: maxDate } : undefined}
            height="auto"
            businessHours={[
              { daysOfWeek: [1, 2, 3, 4, 5], startTime: "08:00", endTime: "11:30" },
              { daysOfWeek: [1, 2, 3, 4, 5], startTime: "13:00", endTime: "18:00" },
              { daysOfWeek: [6], startTime: "10:00", endTime: "14:00" },
            ]}
            nowIndicator={true}
          />
        </div>
      )}

{/* Modal para agendar una nueva cita. Para el paciente la fecha y hora son de solo lectura
    porque se precargan desde el slot seleccionado en el calendario. */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
            <h2 className="text-lg font-semibold text-[#283A97] mb-1">Nueva cita</h2>
            <p className="text-sm text-[#6B7280] mb-6">Complete los datos para agendar la cita.</p>

            <div className="flex flex-col gap-4">
              {role !== "patient" && (
                <div className="flex flex-col gap-1.5">
                  <label className={labelClass}>Paciente</label>
                  <select value={newPatientId} onChange={(e) => setNewPatientId(e.target.value)} className={inputClass}>
                    <option value="">Seleccione un paciente...</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Servicio</label>
                <select value={newServiceId} onChange={(e) => setNewServiceId(e.target.value)} className={inputClass}>
                  <option value="">Seleccione un servicio...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({s.duracion_horas}h)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
  <div className="flex flex-col gap-1.5">
    <label className={labelClass}>Fecha</label>
    <input
      type="date"
      value={selectedDate}
      readOnly={role === "patient"}
      onChange={(e) => role !== "patient" && setSelectedDate(e.target.value)}
      className={`${inputClass} ${role === "patient" ? "bg-[#F4F5F8] cursor-not-allowed" : ""}`}
    />
  </div>
  <div className="flex flex-col gap-1.5">
    <label className={labelClass}>Hora</label>
    <input
      type="time"
      value={selectedTime}
      readOnly={role === "patient"}
      onChange={(e) => role !== "patient" && setSelectedTime(e.target.value)}
      className={`${inputClass} ${role === "patient" ? "bg-[#F4F5F8] cursor-not-allowed" : ""}`}
    />
  </div>
</div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Observaciones <span className="text-[#9CA3AF] font-normal">(opcional)</span></label>
                <textarea
                  rows={2}
                  value={newObservaciones}
                  onChange={(e) => setNewObservaciones(e.target.value)}
                  className="rounded-lg border border-[#D7DEF2] bg-white px-4 py-2.5 text-sm text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#00C2F3] focus:outline-none focus:ring-2 focus:ring-[#00C2F3]/30 w-full resize-none"
                  placeholder="Motivo de la consulta..."
                />
              </div>
            </div>

            {newError && <p className="text-sm text-[#E45C3C] mt-3">{newError}</p>}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNewModal(false)} className="flex-1 rounded-lg border border-[#D7DEF2] px-4 py-2.5 text-sm text-[#6B7280] hover:bg-[#F4F5F8] transition-colors">Cancelar</button>
              <button onClick={handleCreateAppointment} disabled={newLoading} className="flex-1 rounded-lg bg-[#283A97] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1F2D75] disabled:opacity-60 transition-colors">
                {newLoading ? "Agendando..." : "Agendar cita"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#283A97]">Detalle de cita</h2>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: `${estadoColor[selectedAppointment.estado]}20`, color: estadoColor[selectedAppointment.estado] }}>
                {estadoLabel[selectedAppointment.estado]}
              </span>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {role !== "patient" && (
                <div>
                  <p className="text-xs text-[#6B7280] uppercase tracking-wide">Paciente</p>
                  <p className="text-sm font-medium text-[#1F2937]">{selectedAppointment.paciente?.nombre ?? "—"}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-[#6B7280] uppercase tracking-wide">Servicio</p>
                <p className="text-sm text-[#1F2937]">{selectedAppointment.servicio?.nombre ?? "—"} ({selectedAppointment.servicio?.duracion_horas}h)</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-[#6B7280] uppercase tracking-wide">Fecha</p>
                  <p className="text-sm text-[#1F2937]">{new Date(selectedAppointment.fecha).toLocaleDateString("es-CR")}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280] uppercase tracking-wide">Hora</p>
                  <p className="text-sm text-[#1F2937]">{selectedAppointment.hora?.slice(0, 5)}</p>
                </div>
              </div>
              {selectedAppointment.observaciones && (
                <div>
                  <p className="text-xs text-[#6B7280] uppercase tracking-wide">Observaciones</p>
                  <p className="text-sm text-[#1F2937]">{selectedAppointment.observaciones}</p>
                </div>
              )}
            </div>

            {showReschedule && (
              <div className="mb-4 flex flex-col gap-3 p-4 bg-[#F4F5F8] rounded-xl">
                <p className="text-sm font-medium text-[#283A97]">Reprogramar cita</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#6B7280]">Nueva fecha</label>
                    <input type="date" value={rescheduleDate} min={minDate} max={maxDate} onChange={(e) => setRescheduleDate(e.target.value)} className={inputClass} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-[#6B7280]">Nueva hora</label>
                    <input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} className={inputClass} />
                  </div>
                </div>
                <button onClick={handleReschedule} disabled={detailLoading} className="rounded-lg bg-[#283A97] px-4 py-2 text-sm font-medium text-white hover:bg-[#1F2D75] disabled:opacity-60 transition-colors">
                  {detailLoading ? "Guardando..." : "Confirmar reprogramación"}
                </button>
              </div>
            )}

{detailError && <p className="text-sm text-[#E45C3C] mb-3">{detailError}</p>}

{(() => {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  const isPast = selectedAppointment.fecha < todayStr ||
    (selectedAppointment.fecha === todayStr && selectedAppointment.hora?.slice(0, 5) < currentTime);

  return (
    <div className="flex flex-col gap-2">
      {role === "patient" && (
        <>
          {selectedAppointment.estado === "programada" && !isPast && (
            <div className="flex flex-col gap-2">
              <button onClick={handleConfirmAttendance} disabled={detailLoading} className="rounded-lg bg-[#059669] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#047857] disabled:opacity-60 transition-colors">
                Confirmar asistencia
              </button>
              <button onClick={handleCancelAppointment} disabled={detailLoading} className="rounded-lg border border-[#FECACA] text-[#DC2626] px-4 py-2.5 text-sm font-medium hover:bg-[#FEF2F2] disabled:opacity-60 transition-colors">
                Cancelar cita
              </button>
            </div>
          )}
          {selectedAppointment.estado === "confirmada" && !isPast && (
            <button onClick={handleCancelAppointment} disabled={detailLoading} className="rounded-lg border border-[#FECACA] text-[#DC2626] px-4 py-2.5 text-sm font-medium hover:bg-[#FEF2F2] disabled:opacity-60 transition-colors">
              Cancelar cita
            </button>
          )}
        </>
      )}

      {role !== "patient" && (
        <>
          {["programada", "confirmada"].includes(selectedAppointment.estado) && (
            <div className="flex flex-col gap-2">
              <button onClick={() => { setShowReschedule(!showReschedule); setDetailError(null); }} className="rounded-lg border border-[#D7DEF2] text-[#283A97] px-4 py-2.5 text-sm font-medium hover:bg-[#E8EBF7] transition-colors">
                {showReschedule ? "Cancelar reprogramación" : "Reprogramar"}
              </button>
              {!showReschedule && (
                <>
                  <button
                    onClick={() => { router.push(`${role === "admin" ? "/admin" : "/dentist"}/consultations/new?citaId=${selectedAppointment.id}`); setShowDetailModal(false); }}
                    className="rounded-lg bg-[#059669] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#047857] transition-colors"
                  >
                    Iniciar consulta
                  </button>
                  <button onClick={() => handleMarkAttendance(false)} disabled={detailLoading} className="rounded-lg bg-[#E45C3C] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#C94A2A] disabled:opacity-60 transition-colors">
                    No asistió
                  </button>
                  <button onClick={handleCancelAppointment} disabled={detailLoading} className="rounded-lg border border-[#FECACA] text-[#DC2626] px-4 py-2.5 text-sm font-medium hover:bg-[#FEF2F2] disabled:opacity-60 transition-colors">
                    Cancelar cita
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}

      <button onClick={() => { setShowDetailModal(false); setShowReschedule(false); setDetailError(null); }} className="rounded-lg border border-[#D7DEF2] px-4 py-2.5 text-sm text-[#6B7280] hover:bg-[#F4F5F8] transition-colors">
        Cerrar
      </button>
    </div>
  );
})()}
          </div>
        </div>
      )}
    </div>
  );
}