"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { queryKeys } from "../../../../lib/query/queryKeys";
import {
  getTeamMembers,
  addTeamMember,
  updateTeamMember,
  deleteTeamMember,
  resetMemberPassword,
  getRoles,
  addRole,
  updateRole,
  deleteRole,
  getClinicInfo,
} from "../../../../lib/services/settingsService";
import type { TeamMember, RolePermission, TeamMemberFormData } from "../../../../lib/types";
import { getSubscription, canManageRoles, getMaximumDoctors } from "../../../../lib/services/featureAccessService";
import { TeamMembersTable } from "../team/TeamMembersTable";
import { RolesPermissionsGrid } from "../team/RolesPermissionsGrid";
import { InviteMemberModal } from "../team/InviteMemberModal";
import { EditMemberModal } from "../team/EditMemberModal";
import { PermissionEditorDrawer } from "../team/PermissionEditorDrawer";
import { ActionConfirmModal, type ConfirmActionType } from "../team/ActionConfirmModal";
import { Lock } from "lucide-react";


type TeamSubView = "overview" | "members" | "roles";

export default function TeamManagementSection() {
  const queryClient = useQueryClient();
  const [subView, setSubView] = useState<TeamSubView>("overview");

  // Dialog & Drawer States
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [actionConfirm, setActionConfirm] = useState<{
    type: ConfirmActionType;
    member: TeamMember;
  } | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RolePermission | null>(null);

  // Queries using TanStack Query
  const { data: clinicInfo } = useQuery({
    queryKey: queryKeys.settings.clinicInfo,
    queryFn: getClinicInfo,
    staleTime: 5 * 60_000,
  });

  const { data: members = [] } = useQuery({
    queryKey: queryKeys.settings.teamMembers,
    queryFn: () => getTeamMembers(),
    staleTime: 5 * 60_000,
  });

  const { data: roles = [] } = useQuery({
    queryKey: queryKeys.settings.roles,
    queryFn: getRoles,
    staleTime: 5 * 60_000,
  });

  const subscription = getSubscription(clinicInfo);
  const isBasicPlan = subscription.plan === "basic";
  const maxDoctors = getMaximumDoctors(clinicInfo);
  const doctorCount = members.filter((m) => m.role?.toLowerCase() === "doctor" || m.roleId === "role-doctor").length;

  // Mutations
  const inviteMutation = useMutation({
    mutationFn: addTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.teamMembers });
      queryClient.invalidateQueries({ queryKey: ["teamMembers", "active-doctors"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TeamMember> }) =>
      updateTeamMember(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.teamMembers });
      queryClient.invalidateQueries({ queryKey: ["teamMembers", "active-doctors"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: deleteTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.teamMembers });
      queryClient.invalidateQueries({ queryKey: ["teamMembers", "active-doctors"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.doctors.all });
    },
  });

  const saveRoleMutation = useMutation({
    mutationFn: async ({
      roleData,
      roleId,
    }: {
      roleData: Omit<RolePermission, "id" | "memberCount" | "permissionCount">;
      roleId?: string;
    }) => {
      if (roleId) {
        await updateRole(roleId, roleData);
      } else {
        await addRole(roleData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.roles });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.roles });
    },
  });

  // Action confirm handler
  const handleConfirmAction = async () => {
    if (!actionConfirm) return;
    const { type, member } = actionConfirm;

    if (type === "reset-password") {
      await resetMemberPassword(member.id);
    } else if (type === "deactivate") {
      await updateMemberMutation.mutateAsync({ id: member.id, updates: { status: "Inactive" } });
    } else if (type === "activate") {
      await updateMemberMutation.mutateAsync({ id: member.id, updates: { status: "Active" } });
    } else if (type === "delete") {
      await deleteMemberMutation.mutateAsync(member.id);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ── SubView: Overview Cards ── */}
      {subView === "overview" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary">
                  Administration
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  isBasicPlan ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-purple-100 text-purple-900 border border-purple-300"
                }`}>
                  {isBasicPlan ? "Basic Plan (2 Doctors Max)" : "Professional Plan (4 Doctors Max)"}
                </span>
              </div>
              <h2 className="text-xl font-bold text-on-surface">Team & Access Management</h2>
              <p className="text-sm text-on-surface-variant mt-1">
                Manage clinic staff members, assign roles, and customize granular feature permissions.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Card 1: Team Members */}
            <div
              onClick={() => setSubView("members")}
              className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-105 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-on-surface mb-1.5 group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>👥 Team Members</span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full font-mono border ${
                    doctorCount >= maxDoctors
                      ? "bg-amber-100 text-amber-900 border-amber-300"
                      : "bg-emerald-100 text-emerald-900 border-emerald-300"
                  }`}>
                    {doctorCount}/{maxDoctors} Doctors
                  </span>
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
                  Manage doctors, receptionists, and clinic staff accounts.
                </p>
              </div>
              <div className="pt-4 border-t border-outline-variant/15 flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface">
                  Members : <span className="text-primary">{members.length}</span>
                </span>
                <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  → Open
                </span>
              </div>
            </div>

            {/* Card 2: Roles & Permissions */}
            <div
              onClick={() => setSubView("roles")}
              className={`rounded-2xl p-6 border shadow-sm transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                isBasicPlan
                  ? "bg-slate-50/80 border-amber-200/80 hover:border-amber-400"
                  : "bg-white border-outline-variant/20 hover:shadow-md hover:border-primary/40"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  {isBasicPlan && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                      <Lock className="w-3 h-3 text-amber-700" />
                      <span>🔒 Professional Feature</span>
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-on-surface mb-1.5 group-hover:text-primary transition-colors">
                  🛡 Roles & Permissions
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                  Control access to every module of the software with custom role permissions.
                </p>
                {isBasicPlan && (
                  <p className="text-[11px] font-bold text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200/60 mb-2">
                    Upgrade to Professional to manage custom roles and permissions.
                  </p>
                )}
              </div>
              <div className="pt-4 border-t border-outline-variant/15 flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface">
                  Roles : <span className="text-indigo-600">{roles.length}</span>
                </span>
                <span className="text-xs font-bold text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  {isBasicPlan ? "🔒 View Locked" : "→ Open"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SubView: Team Members Table ── */}
      {subView === "members" && (
        <TeamMembersTable
          members={members}
          roles={roles}
          clinicInfo={clinicInfo}
          onInviteClick={() => setIsInviteOpen(true)}
          onEditClick={(member) => setEditingMember(member)}
          onActionClick={(type, member) => setActionConfirm({ type, member })}
          onBackToOverview={() => setSubView("overview")}
        />
      )}

      {/* ── SubView: Roles & Permissions Grid ── */}
      {subView === "roles" && (
        <RolesPermissionsGrid
          roles={roles}
          clinicInfo={clinicInfo}
          onCreateRoleClick={() => {
            setEditingRole(null);
            setIsDrawerOpen(true);
          }}
          onEditRoleClick={(role) => {
            setEditingRole(role);
            setIsDrawerOpen(true);
          }}
          onDeleteRoleClick={(roleId) => deleteRoleMutation.mutateAsync(roleId)}
          onBackToOverview={() => setSubView("overview")}
        />
      )}

      {/* Modals & Drawers */}
      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInvite={async (formData) => {
          await inviteMutation.mutateAsync(formData);
        }}
        roles={roles}
        clinicInfo={clinicInfo}
        members={members}
      />


      <EditMemberModal
        isOpen={Boolean(editingMember)}
        member={editingMember}
        onClose={() => setEditingMember(null)}
        onUpdate={(id, updates) => updateMemberMutation.mutateAsync({ id, updates })}
        roles={roles}
      />

      <PermissionEditorDrawer
        isOpen={isDrawerOpen}
        role={editingRole}
        onClose={() => setIsDrawerOpen(false)}
        onSave={(roleData, roleId) => saveRoleMutation.mutateAsync({ roleData, roleId })}
      />

      {actionConfirm && (
        <ActionConfirmModal
          isOpen={Boolean(actionConfirm)}
          type={actionConfirm.type}
          targetName={actionConfirm.member.name}
          onClose={() => setActionConfirm(null)}
          onConfirm={handleConfirmAction}
        />
      )}
    </div>
  );
}
