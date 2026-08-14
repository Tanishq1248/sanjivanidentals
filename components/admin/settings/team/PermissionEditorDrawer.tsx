import React, { useState, useEffect } from "react";
import { X, ShieldCheck, ChevronDown, ChevronUp, CheckSquare, Square, Save, Loader2, Lock } from "lucide-react";
import type { RolePermission, PermissionGroupKey } from "../../../../lib/types";
import { canEditPermissions } from "../../../../lib/services/featureAccessService";

interface PermissionEditorDrawerProps {
  isOpen: boolean;
  role: RolePermission | null; // Null when creating a new role
  clinicInfo?: any;
  onClose: () => void;
  onSave: (roleData: Omit<RolePermission, "id" | "memberCount" | "permissionCount">, roleId?: string) => Promise<void>;
}

const ALL_PERMISSION_GROUPS: Record<PermissionGroupKey, string[]> = {
  Dashboard: ["View Dashboard", "View Analytics", "Export Summary"],
  Patients: ["View Patients", "Add Patient", "Edit Patient", "Delete Patient", "Export Data"],
  Appointments: ["View Appointments", "Create Appointment", "Reschedule", "Cancel Appointment"],
  Treatments: ["View Treatments", "Add Dental Chart", "Edit Dental Chart", "Delete Dental Chart"],
  Billing: ["View Invoices", "Create Invoice", "Apply Discount", "Process Payment", "Refund Invoice"],
  Prescriptions: ["View Prescriptions", "Create Prescription", "Print Prescription"],
  Reports: ["View Financial Reports", "View Patient Reports", "Export Reports"],
  Inventory: ["View Stock", "Add Stock", "Adjust Quantity", "Manage Suppliers"],
  Settings: ["View Settings", "Manage Clinic Info", "Manage Team", "Manage Roles & Permissions"],
};

export function PermissionEditorDrawer({ isOpen, role, clinicInfo, onClose, onSave }: PermissionEditorDrawerProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<Record<string, string[]>>({});
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const isEditable = canEditPermissions(clinicInfo);

  useEffect(() => {
    if (role) {
      setName(role.name);
      setDescription(role.description);
      setPermissions(role.permissions || {});
    } else {
      setName("");
      setDescription("");
      // Default initial permissions selection
      setPermissions({
        Dashboard: ["View Dashboard"],
        Patients: ["View Patients"],
        Appointments: ["View Appointments"],
      });
    }
  }, [role, isOpen]);

  if (!isOpen) return null;

  const togglePermission = (group: string, perm: string) => {
    if (!isEditable) return;
    setPermissions((prev) => {
      const current = prev[group] || [];
      const updated = current.includes(perm) ? current.filter((p) => p !== perm) : [...current, perm];
      return { ...prev, [group]: updated };
    });
  };

  const toggleGroupCollapse = (group: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  const handleSelectAll = () => {
    if (!isEditable) return;
    const full: Record<string, string[]> = {};
    Object.entries(ALL_PERMISSION_GROUPS).forEach(([group, items]) => {
      full[group] = [...items];
    });
    setPermissions(full);
  };

  const handleClearAll = () => {
    if (!isEditable) return;
    setPermissions({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !isEditable) return;

    setLoading(true);
    try {
      await onSave(
        {
          name: name.trim(),
          description: description.trim(),
          isSystem: role?.isSystem || false,
          permissions: permissions,
        },
        role?.id
      );
      onClose();
    } catch (err) {
      console.error("Save role error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl border-l border-outline-variant/20 flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="px-6 py-5 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-lowest shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-on-surface">
                  {role ? `Edit Role: ${role.name}` : "Create New Role"}
                </h3>
                <p className="text-xs text-on-surface-variant">Configure system module access & permissions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant cursor-pointer border-none bg-transparent"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content Body */}
          <form id="role-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {!isEditable && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">🔒 Professional Plan Feature</span>
                  <span>Permission editing and role customization are locked under the Basic Plan.</span>
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Role Name *</label>
                <input
                  type="text"
                  required
                  disabled={!isEditable}
                  placeholder="e.g. Senior Endodontist"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Role Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of duties and access permissions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all resize-none"
                />
              </div>
            </div>

            {/* Permission Control Header */}
            <div className="pt-4 border-t border-outline-variant/15 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-on-surface">Module Permissions</h4>
                <p className="text-[11px] text-on-surface-variant">Toggle access to individual features</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2.5 py-1 rounded-lg bg-surface-container text-primary text-[11px] font-bold hover:bg-surface-container-high cursor-pointer border-none transition-colors"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2.5 py-1 rounded-lg bg-surface-container-low text-secondary text-[11px] font-bold hover:bg-surface-container cursor-pointer border-none transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Collapsible Permission Groups */}
            <div className="space-y-3">
              {(Object.keys(ALL_PERMISSION_GROUPS) as PermissionGroupKey[]).map((group) => {
                const groupItems = ALL_PERMISSION_GROUPS[group];
                const selectedItems = permissions[group] || [];
                const isCollapsed = collapsedGroups[group];

                return (
                  <div
                    key={group}
                    className="border border-outline-variant/20 rounded-2xl overflow-hidden bg-white shadow-xs"
                  >
                    {/* Accordion Header */}
                    <div
                      onClick={() => toggleGroupCollapse(group)}
                      className="px-4 py-3 bg-surface-container-lowest flex items-center justify-between cursor-pointer hover:bg-surface-container-low/60 transition-colors select-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-on-surface">{group}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary">
                          {selectedItems.length} / {groupItems.length}
                        </span>
                      </div>
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-on-surface-variant" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-on-surface-variant" />
                      )}
                    </div>

                    {/* Accordion Content */}
                    {!isCollapsed && (
                      <div className="p-4 border-t border-outline-variant/15 grid grid-cols-2 gap-2.5 bg-white">
                        {groupItems.map((perm) => {
                          const isChecked = selectedItems.includes(perm);
                          return (
                            <label
                              key={perm}
                              className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                                isChecked
                                  ? "bg-secondary-container/40 border-primary/40 text-primary"
                                  : "border-outline-variant/20 hover:bg-surface-container-lowest text-secondary"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(group, perm)}
                                className="hidden"
                              />
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-on-surface-variant/40 shrink-0" />
                              )}
                              <span className="truncate">{perm}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </form>

          {/* Drawer Footer */}
          <div className="px-6 py-4 border-t border-outline-variant/20 bg-surface-container-lowest flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-semibold text-secondary hover:bg-surface-container-low transition-all cursor-pointer bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="role-form"
              disabled={loading || !isEditable}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (!isEditable ? <Lock className="w-4 h-4" /> : <Save className="w-4 h-4" />)}
              <span>{isEditable ? "Save Changes" : "Locked (Basic Plan)"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
