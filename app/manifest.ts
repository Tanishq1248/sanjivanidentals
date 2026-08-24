import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DentaPure - Dental Clinic Management",
    short_name: "DentaPure",
    description: "Clinical Excellence & Premium Dental Practice Management SaaS platform",
    start_url: "/admin",
    id: "/admin",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f7f9fb",
    theme_color: "#0061a4",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Admin Dashboard",
        short_name: "Dashboard",
        description: "Open Dental Clinic Operations Dashboard",
        url: "/admin",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Appointments Calendar",
        short_name: "Calendar",
        description: "View and manage clinic appointment schedules",
        url: "/admin/calendar",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Patients Directory",
        short_name: "Patients",
        description: "Look up patient records and clinical charts",
        url: "/admin/patients",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Billing & Invoices",
        short_name: "Billing",
        description: "Manage clinic invoices, payments, and receipts",
        url: "/admin/billing",
        icons: [{ src: "/icons/icon-192x192.png", sizes: "192x192" }],
      },
    ],
  };
}
