"use client";
import PatientDetailPage from "@/components/patient-detail-page";
import { useParams } from "next/navigation";
export default function Page() {
  const params = useParams();
  return <PatientDetailPage basePath="/dentist/patients" patientId={params.id as string} />;
}