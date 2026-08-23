"use client";

import React, { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, AlertCircle, ArrowLeft, Stethoscope } from "lucide-react";
import { AdminAuthGuard } from "../../../../../../components/auth/AdminAuthGuard";
import dynamic from "next/dynamic";

const CasePaperSessionView = dynamic(
  () =>
    import(
      "../../../../../../components/admin/patient-workspace/case-paper-session/CasePaperSessionView"
    ).then((m) => m.CasePaperSessionView),
  {
    loading: () => (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading Clinical Session Workspace...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
);
import {
  getPatientById,
  getPatientMedicalProfile,
  getPatientEncounters,
  updatePatientEncounter,
  logToothTreatment,
} from "../../../../../../lib/services/patientService";
import { useActiveDoctors } from "../../../../../../lib/hooks/useDoctors";
import { queryKeys } from "../../../../../../lib/query/queryKeys";
import type { PatientEncounter, SurfaceType, Patient, PatientMedicalProfile, Doctor } from "../../../../../../lib/types";

interface PageProps {
  params: Promise<{ id: string; casePaperId: string }>;
}

export default function CasePaperSessionPage({ params }: PageProps) {
  const { id: patientId, casePaperId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  // 1. Patient query
  const {
    data: patient,
    isLoading: isPatientLoading,
    error: patientError,
  } = useQuery<Patient | null>({
    queryKey: queryKeys.patients.byId(patientId),
    queryFn: () => getPatientById(patientId),
    enabled: !!patientId,
  });

  // 2. Medical profile query
  const { data: medicalProfile } = useQuery<PatientMedicalProfile | null>({
    queryKey: queryKeys.patients.medicalProfile(patientId),
    queryFn: () => getPatientMedicalProfile(patientId),
    enabled: !!patientId,
  });

  // 3. Encounters query
  const {
    data: encounters = [],
    isLoading: isEncountersLoading,
  } = useQuery<PatientEncounter[]>({
    queryKey: queryKeys.patients.encounters(patientId),
    queryFn: () => getPatientEncounters(patientId),
    enabled: !!patientId,
  });

  // 4. Clinic Active Doctors query (Single Source of Truth from Settings > Team Members)
  const { doctors = [] } = useActiveDoctors();

  // ── Mutations ──
  const updateEncounterMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PatientEncounter> }) =>
      updatePatientEncounter(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.patients.encounters(patientId),
      });
    },
  });

  const logToothTreatmentMutation = useMutation({
    mutationFn: ({
      toothNumber,
      treatmentData,
    }: {
      toothNumber: number;
      treatmentData: {
        treatmentName: string;
        status: string;
        fee: number;
        notes?: string;
        surfaces?: SurfaceType[];
      };
    }) => {
      const docId = doctors[0]?.id || "tm-1";
      const docName = doctors[0]?.fullName || "Dr. Rajesh Sharma";
      return logToothTreatment(
        patientId,
        toothNumber,
        treatmentData,
        docId,
        docName,
        casePaperId
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.patients.encounters(patientId),
      });
    },
  });

  if (isPatientLoading || isEncountersLoading) {
    return (
      <AdminAuthGuard>
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="text-sm font-bold text-slate-700">Loading Clinical Session Canvas...</span>
          </div>
        </div>
      </AdminAuthGuard>
    );
  }

  if (!patient || patientError) {
    return (
      <AdminAuthGuard>
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-red-100 max-w-md space-y-3">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h2 className="text-base font-bold text-slate-900">Patient Record Not Found</h2>
            <p className="text-xs text-slate-500">
              The requested patient profile could not be loaded. Please return to the registry.
            </p>
            <Link
              href="/admin/patients"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Patient List
            </Link>
          </div>
        </div>
      </AdminAuthGuard>
    );
  }

  // Find target encounter
  const activeEncounter = encounters.find((e) => e.id === casePaperId);

  if (!activeEncounter) {
    return (
      <AdminAuthGuard>
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="p-6 bg-white rounded-2xl shadow-sm border border-amber-200 max-w-md space-y-3">
            <Stethoscope className="w-10 h-10 text-amber-600 mx-auto" />
            <h2 className="text-base font-bold text-slate-900">Case Paper Session Not Found</h2>
            <p className="text-xs text-slate-500">
              The requested clinical case paper session does not exist or has been archived.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <Link
                href={`/admin/patients/${patientId}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Patient Profile
              </Link>
            </div>
          </div>
        </div>
      </AdminAuthGuard>
    );
  }

  // Calculate sequential case paper number based on chronological order
  const sortedChronologically = [...encounters].sort((a, b) =>
    (a.visitDate || "").localeCompare(b.visitDate || "")
  );
  const foundIndex = sortedChronologically.findIndex((e) => e.id === activeEncounter.id);
  const casePaperNumber =
    activeEncounter.casePaperNumber || (foundIndex >= 0 ? foundIndex + 1 : 1);

  return (
    <AdminAuthGuard>
      <CasePaperSessionView
        patient={patient}
        medicalProfile={medicalProfile}
        encounter={activeEncounter}
        allEncounters={encounters}
        casePaperNumber={casePaperNumber}
        onUpdateEncounter={async (id, data) => {
          await updateEncounterMutation.mutateAsync({ id, data });
        }}
        onSaveToothTreatment={async (toothNumber, data) => {
          await logToothTreatmentMutation.mutateAsync({
            toothNumber,
            treatmentData: data,
          });
        }}
        isSavingToothTreatment={logToothTreatmentMutation.isPending}
        onOpenInvoice={(enc) => {
          router.push(`/admin/patients/${patientId}?tab=billing&encounterId=${enc.id}`);
        }}
        doctors={doctors}
      />
    </AdminAuthGuard>
  );
}
