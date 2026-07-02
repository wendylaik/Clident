"use client";
import PatientDetailPage from "@/components/patient-detail-page";
import { useParams } from "next/navigation";
export default function Page() {
  const params = useParams();
  return <PatientDetailPage basePath="/admin/patients" patientId={params.id as string} />;
}