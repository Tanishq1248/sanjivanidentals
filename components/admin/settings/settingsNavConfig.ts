import React from "react";
import {
  Building2,
  Users,
  Armchair,
  Calendar,
  CreditCard,
  FileText,
  Bell,
  ShieldCheck,
  Database,
  FlaskConical,
  Package,
  Share2,
  Plug,
  MessageSquare,
  Key,
} from "lucide-react";

export interface SettingsNavItem {
  id: string;
  label: string;
  category: "General" | "Communication" | "Billing" | "Security" | "Practice Management";
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  componentPath: string; // Used for dynamic resolution or tracking
}

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  {
    id: "clinic-info",
    label: "Clinic Information",
    category: "General",
    description: "Manage clinic profile, location, operating hours, and doctor branding.",
    icon: Building2,
    componentPath: "./sections/ClinicInfoSection",
  },
  {
    id: "team",
    label: "Team Management",
    category: "General",
    description: "Manage clinic staff, doctors, roles, and access control permissions.",
    icon: Users,
    componentPath: "./sections/TeamManagementSection",
  },
  {
    id: "clinic-resources",
    label: "Clinic Resources",
    category: "General",
    description: "Configure treatment chairs, chair names, and active availability.",
    icon: Armchair,
    componentPath: "./sections/ClinicResourcesSection",
  },
  {
    id: "appointments",
    label: "Appointment Settings",
    category: "General",
    description: "Slot duration, chair configuration, buffer time, and cancellation rules.",
    icon: Calendar,
    componentPath: "./sections/AppointmentSettingsSection",
  },
  {
    id: "message-templates",
    label: "Message Templates",
    category: "Communication",
    description: "Configure dynamic WhatsApp & Email templates for Prescriptions, Invoices, and Reminders.",
    icon: MessageSquare,
    componentPath: "./sections/MessageTemplatesSection",
  },
  {
    id: "billing",
    label: "Billing",
    category: "Billing",
    description: "Default payment terms, receipt numbers, GST rates, and tax preferences.",
    icon: CreditCard,
    componentPath: "./sections/BillingSettingsSection",
  },
  {
    id: "prescription",
    label: "Prescription",
    category: "Billing",
    description: "Prescription templates, default instructions, letterhead footers, and advice.",
    icon: FileText,
    componentPath: "./sections/PrescriptionSettingsSection",
  },
  {
    id: "notifications",
    label: "Notifications",
    category: "Security",
    description: "SMS, Email, and WhatsApp automated patient appointment reminders.",
    icon: Bell,
    componentPath: "./sections/NotificationSettingsSection",
  },
  {
    id: "security",
    label: "Security",
    category: "Security",
    description: "Password policies, session timeouts, multi-factor authentication, and logs.",
    icon: ShieldCheck,
    componentPath: "./sections/SecuritySettingsSection",
  },
  {
    id: "backup",
    label: "Backup & Export",
    category: "Security",
    description: "Scheduled automated database backups, patient data export, and logs.",
    icon: Database,
    componentPath: "./sections/BackupSettingsSection",
  },
];

/**
 * FUTURE EXPANSION EXAMPLES:
 * Adding a new section to Settings only requires adding a component file and adding an entry here:
 * 
 * {
 *   id: "inventory",
 *   label: "Inventory Settings",
 *   category: "Practice Management",
 *   description: "Stock thresholds, supplier defaults, reorder levels",
 *   icon: Package,
 *   componentPath: "./sections/InventorySettingsSection",
 * }
 */
