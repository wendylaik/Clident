import { Suspense } from "react";
import AppointmentsCalendar from "@/components/appointments-calendar";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><p className="text-sm text-[#6B7280]">Cargando...</p></div>}>
      <AppointmentsCalendar role="admin" />
    </Suspense>
  );
}