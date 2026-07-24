"use client";

import React, { useState } from "react";
import { ShieldCheck, Plus, Pencil, Trash2, Users, ArrowLeft, Shield } from "lucide-react";
import type { RolePermission } from "../../../../lib/types";
import { ActionConfirmModal } from "./ActionConfirmModal";

interface RolesPermissionsGridProps {
  roles: RolePermission[];
  onCreateRoleClick: () => void;
  onEditRoleClick: (role: RolePermission) => void;
  onDeleteRoleClick: (roleId: string) => Promise<void>;
  onBackToOverview?: () => void;
}

export function RolesPermissionsGrid({
  roles,
  onCreateRoleClick,
  onEditRoleClick,
  onDeleteRoleClick,
  onBackToOverview,
}: RolesPermissionsGridProps) {
  const [roleToDelete, setRoleToDelete] = useState<RolePermission | null>(null);

  return (
    <div className="space-y-6 font-sans">
      {/* Action Header */}
      <div className="bg-white rounded-2xl p-5 border border-outline-variant/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="p-2 rounded-xl border border-outline-variant/20 hover:bg-surface-container-low text-secondary transition-all cursor-pointer bg-white"
              title="Back to Team Overview"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h2 className="text-lg font-bold text-on-surface">Roles & Permissions ({roles.length})</h2>
            <p className="text-xs text-on-surface-variant">
              Configure access privileges and module permissions across software roles
            </p>
          </div>
        </div>
        <button
          onClick={onCreateRoleClick}
          className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          + Create Role
        </button>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {roles.map((role) => (
          <div
            key={role.id}
            onClick={() => onEditRoleClick(role)}
            className="bg-white rounded-2xl p-5 border border-outline-variant/20 shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-surface-container text-primary">
                  {role.isSystem ? "Full Access" : `${role.permissionCount} Permissions`}
                </span>
              </div>

              <h3 className="font-bold text-base text-on-surface mb-1 group-hover:text-primary transition-colors">
                {role.name}
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-4 line-clamp-2">
                {role.description}
              </p>
            </div>

            <div className="pt-3 border-t border-outline-variant/15 flex items-center justify-between">
              <span className="text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary/70" />
                {role.memberCount} {role.memberCount === 1 ? "Member" : "Members"}
              </span>

              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onEditRoleClick(role)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-secondary hover:bg-surface-container-low transition-colors cursor-pointer border-none bg-transparent"
                >
                  Edit
                </button>
                {!role.isSystem && (
                  <button
                    onClick={() => setRoleToDelete(role)}
                    className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer border-none bg-transparent"
                    title="Delete Role"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {roleToDelete && (
        <ActionConfirmModal
          isOpen={Boolean(roleToDelete)}
          type="delete"
          targetName={`Role "${roleToDelete.name}"`}
          onClose={() => setRoleToDelete(null)}
          onConfirm={async () => {
            await onDeleteRoleClick(roleToDelete.id);
            setRoleToDelete(null);
          }}
        />
      )}
    </div>
  );
}
