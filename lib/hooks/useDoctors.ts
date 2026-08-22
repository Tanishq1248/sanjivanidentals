"use client";

import { useQuery } from "@tanstack/react-query";
import { getTeamMembersByRole } from "../services/teamService";

export interface ActiveDoctor {
  id: string;
  fullName: string;
  name: string;
  specialization: string;
  specialty: string;
  qualification?: string;
  registrationNumber?: string;
  email: string;
  phone: string;
  active: boolean;
}

/**
 * Hook to retrieve active doctors configured under Settings > Team Members.
 * Single source of truth for all doctor assignment dropdowns across the application.
 */
export function useActiveDoctors() {
  const {
    data: teamMembers = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["teamMembers", "active-doctors"],
    queryFn: async () => {
      // Query Firestore teamMembers collection where role == 'Doctor' and status == 'Active'
      return await getTeamMembersByRole("Doctor");
    },
    staleTime: 2 * 60 * 1000,
  });

  const doctors: ActiveDoctor[] = teamMembers
    .filter(
      (member) =>
        (member.status === "Active" || !member.status) &&
        (member.role?.toLowerCase() === "doctor" || member.roleId === "role-doctor")
    )
    .map((doc) => {
      const rawName = doc.name.trim();
      const formattedName = rawName.startsWith("Dr.") ? rawName : `Dr. ${rawName}`;
      const specialty =
        (doc as any).qualification ||
        (doc as any).specialty ||
        (doc as any).specialization ||
        "General Dentist";

      return {
        id: doc.id,
        fullName: formattedName,
        name: formattedName,
        specialization: specialty,
        specialty: specialty,
        qualification: (doc as any).qualification || specialty,
        registrationNumber: (doc as any).registrationNumber || "",
        email: doc.email,
        phone: doc.phone,
        active: doc.status === "Active" || !doc.status,
      };
    });

  return { doctors, isLoading, error, refetch };
}
