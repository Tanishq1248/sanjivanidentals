"use client";

import { useQuery } from "@tanstack/react-query";
import { getTeamMembersByRole } from "../services/teamService";
import { queryKeys, CACHE_POLICIES } from "../query/queryKeys";

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
 * Cached globally for 15 minutes to minimize Firestore read volume.
 */
import React, { useMemo } from "react";

export function useActiveDoctors() {
  const {
    data: teamMembers = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.settings.teamMembers,
    queryFn: async () => {
      // Query Firestore teamMembers collection where role == 'Doctor' and status == 'Active'
      return await getTeamMembersByRole("Doctor");
    },
    ...CACHE_POLICIES.TEAM_MEMBERS,
  });

  const doctors: ActiveDoctor[] = useMemo(() => {
    return teamMembers
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
          email: doc.email || "",
          phone: doc.phone || "",
          active: doc.status === "Active" || !doc.status,
        };
      });
  }, [teamMembers]);

  return {
    doctors,
    isLoading,
    error,
    refetch,
  };
}
