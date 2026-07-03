import { Suspense } from "react";
import ConsultationPage from "@/components/consultation-page";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><p className="text-sm text-[#6B7280]">Cargando...</p></div>}>
      <ConsultationPage basePath="/dentist/consultations" />
    </Suspense>
  );
}