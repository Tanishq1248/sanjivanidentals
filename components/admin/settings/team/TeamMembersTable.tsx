"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  UserPlus,
  MoreVertical,
  Pencil,
  KeyRound,
  UserX,
  UserCheck,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Shield,
  Eye,
  ArrowLeft,
} from "lucide-react";
import type { TeamMember, RolePermission, MemberStatus } from "../../../../lib/types";
import { getSubscription, getMaximumDoctors } from "../../../../lib/services/featureAccessService";

interface TeamMembersTableProps {
  members: TeamMember[];
  roles: RolePermission[];
  clinicInfo?: any;
  onInviteClick: () => void;
  onEditClick: (member: TeamMember) => void;
  onActionClick: (type: "reset-password" | "deactivate" | "activate" | "delete", member: TeamMember) => void;
  onBackToOverview?: () => void;
}

const PAGE_SIZE = 5;

export function TeamMembersTable({
  members,
  roles,
  clinicInfo,
  onInviteClick,
  onEditClick,
  onActionClick,
  onBackToOverview,
}: TeamMembersTableProps) {
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingMember, setViewingMember] = useState<TeamMember | null>(null);

  const subscription = getSubscription(clinicInfo);
  const maxDoctors = getMaximumDoctors(clinicInfo);
  const doctorCount = members.filter((m) => m.role?.toLowerCase() === "doctor" || m.roleId === "role-doctor").length;

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        m.phone.toLowerCase().includes(search.toLowerCase());
      const matchRole = selectedRole === "All" || m.role === selectedRole;
      const matchStatus = selectedStatus === "All" || m.status === selectedStatus;
      return matchSearch && matchRole && matchStatus;
    });
  }, [members, search, selectedRole, selectedStatus]);

  // Paginated list
  const totalPages = Math.ceil(filteredMembers.length / PAGE_SIZE) || 1;
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredMembers.slice(start, start + PAGE_SIZE);
  }, [filteredMembers, currentPage]);

  const getStatusBadge = (status: MemberStatus) => {
    switch (status) {
      case "Active":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>;
      case "Inactive":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Inactive</span>;
      case "Invited":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Invited</span>;
      case "Suspended":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">Suspended</span>;
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Top Action Header */}
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
            <h2 className="text-lg font-bold text-on-surface">Team Members ({members.length})</h2>
            <p className="text-xs text-on-surface-variant">Manage staff accounts, roles, and access credentials</p>
          </div>
        </div>
        <button
          onClick={onInviteClick}
          className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          + Invite Member
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-outline-variant/20 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="All">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Invited">Invited</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-outline-variant/15 text-on-surface-variant/70 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Member</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Last Login</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10 text-on-surface">
              {paginatedMembers.map((member) => (
                <tr key={member.id} className="hover:bg-surface-container-lowest/80 transition-colors">
                  {/* Member Name & Avatar */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full ${member.avatarColor} text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs`}
                      >
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-on-surface text-xs leading-tight">{member.name}</p>
                        <p className="text-[11px] text-on-surface-variant/70 font-medium">{member.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="py-3.5 px-4 text-on-surface-variant font-medium">
                    {member.phone}
                  </td>

                  {/* Role */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-container text-primary">
                      <Shield className="w-3 h-3 text-primary/70" />
                      {member.role}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">{getStatusBadge(member.status)}</td>

                  {/* Last Login */}
                  <td className="py-3.5 px-4 text-on-surface-variant/70 text-[11px] font-medium">
                    {member.lastLogin}
                  </td>

                  {/* Actions Dropdown */}
                  <td className="py-3.5 px-4 text-right relative">
                    <div className="inline-block text-left">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === member.id ? null : member.id)}
                        className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors cursor-pointer border-none bg-transparent"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === member.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                          <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl border border-outline-variant/20 shadow-lg py-1.5 z-20 animate-in fade-in zoom-in-95 duration-150 text-xs">
                            <button
                              onClick={() => {
                                setViewingMember(member);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 text-left font-medium text-on-surface hover:bg-surface-container-low flex items-center gap-2 cursor-pointer border-none bg-transparent"
                            >
                              <Eye className="w-3.5 h-3.5 text-primary" />
                              View Details
                            </button>
                            <button
                              onClick={() => {
                                onEditClick(member);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 text-left font-medium text-on-surface hover:bg-surface-container-low flex items-center gap-2 cursor-pointer border-none bg-transparent"
                            >
                              <Pencil className="w-3.5 h-3.5 text-secondary" />
                              Edit Member
                            </button>
                            <button
                              onClick={() => {
                                onActionClick("reset-password", member);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 text-left font-medium text-on-surface hover:bg-surface-container-low flex items-center gap-2 cursor-pointer border-none bg-transparent"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                              Reset Password
                            </button>
                            {member.status === "Active" ? (
                              <button
                                onClick={() => {
                                  onActionClick("deactivate", member);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-left font-medium text-amber-700 hover:bg-amber-50 flex items-center gap-2 cursor-pointer border-none bg-transparent"
                              >
                                <UserX className="w-3.5 h-3.5 text-amber-600" />
                                Deactivate
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  onActionClick("activate", member);
                                  setActiveMenuId(null);
                                }}
                                className="w-full px-3 py-1.5 text-left font-medium text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer border-none bg-transparent"
                              >
                                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                                Activate
                              </button>
                            )}
                            <div className="border-t border-outline-variant/15 my-1" />
                            <button
                              onClick={() => {
                                onActionClick("delete", member);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-1.5 text-left font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer border-none bg-transparent"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {paginatedMembers.length === 0 && (
          <div className="py-12 text-center text-on-surface-variant">
            <p className="font-bold text-sm">No team members found</p>
            <p className="text-xs mt-1">Try adjusting your search or filters.</p>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="px-4 py-3 border-t border-outline-variant/15 flex items-center justify-between bg-surface-container-lowest text-xs text-on-surface-variant font-medium">
          <span>
            Showing {filteredMembers.length > 0 ? (currentPage - 1) * PAGE_SIZE + 1 : 0} to{" "}
            {Math.min(currentPage * PAGE_SIZE, filteredMembers.length)} of {filteredMembers.length} members
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-outline-variant/30 hover:bg-surface-container cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold text-on-surface">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-outline-variant/30 hover:bg-surface-container cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Member Details Modal */}
      {viewingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-2xl border border-outline-variant/20 shadow-xl max-w-sm w-full p-6 text-center space-y-4">
            <div
              className={`w-16 h-16 rounded-full ${viewingMember.avatarColor} text-white font-black text-xl flex items-center justify-center mx-auto shadow-md`}
            >
              {viewingMember.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-lg text-on-surface">{viewingMember.name}</h3>
              <p className="text-xs text-primary font-semibold mt-0.5">{viewingMember.role}</p>
            </div>
            <div className="bg-surface-container-lowest p-3 rounded-xl text-left space-y-2 text-xs border border-outline-variant/15">
              <div>
                <span className="text-on-surface-variant/70 font-semibold block text-[10px] uppercase">Email</span>
                <span className="font-medium text-on-surface">{viewingMember.email}</span>
              </div>
              <div>
                <span className="text-on-surface-variant/70 font-semibold block text-[10px] uppercase">Phone</span>
                <span className="font-medium text-on-surface">{viewingMember.phone}</span>
              </div>
              <div>
                <span className="text-on-surface-variant/70 font-semibold block text-[10px] uppercase">Status</span>
                {getStatusBadge(viewingMember.status)}
              </div>
              <div>
                <span className="text-on-surface-variant/70 font-semibold block text-[10px] uppercase">Last Active</span>
                <span className="font-medium text-on-surface">{viewingMember.lastLogin}</span>
              </div>
            </div>
            <button
              onClick={() => setViewingMember(null)}
              className="w-full py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark cursor-pointer border-none"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
