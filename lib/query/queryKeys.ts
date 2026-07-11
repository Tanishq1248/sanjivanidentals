/**
 * Centralized, typed query key factory.
 *
 * Rules:
 * - All keys are readonly tuples so TypeScript catches typos.
 * - Top-level keys (e.g. queryKeys.patients.all) are used for broad
 *   invalidation after any mutation in that collection.
 * - Leaf keys (e.g. queryKeys.patients.list(...)) are used for precise
 *   cache reads and targeted invalidation.
 *
 * NOTE: Firestore QueryDocumentSnapshot cursors are NOT included in any key
 * because they are not JSON-serializable. Pagination cursors live in local
 * React state and are passed directly to the queryFn via closure.
 */
export const queryKeys = {
  // ── Patients ──────────────────────────────────────────────────────────────
  patients: {
    /** Broad key — invalidate to bust every patient query after any mutation. */
    all: ["patients"] as const,

    /** Paginated registry list (page number identifies the page; cursor is in local state). */
    list: (page: number, search: string) =>
      ["patients", "list", page, search] as const,

    /** Aggregate count used in stats cards. */
    count: () => ["patients", "count"] as const,

    /** Single patient document. */
    byId: (id: string) => ["patients", id] as const,

    /** Patient lookup by phone — used in Details Modal + Dashboard. */
    byPhone: (phone: string) => ["patients", "phone", phone] as const,

    /** Patient medical profile. */
    medicalProfile: (patientId: string) => ["patients", patientId, "medicalProfile"] as const,

    /** Patient encounters timeline. */
    encounters: (patientId: string) => ["patients", patientId, "encounters"] as const,
  },

  // ── Appointments ──────────────────────────────────────────────────────────
  appointments: {
    /** Broad key — invalidate after any appointment mutation. */
    all: ["appointments"] as const,

    /**
     * Paginated appointment list for a given tab, page, and active search term.
     * - tab:    "Today" | "Upcoming" | "History"
     * - page:   1-based page number
     * - search: debounced search string ("" when not searching)
     */
    list: (tab: string, page: number, search: string) =>
      ["appointments", "list", tab, page, search] as const,

    /**
     * All appointment aggregate counts (today, upcoming, today-pending).
     * Fetched as one parallel batch; invalidated after status/delete mutations.
     */
    counts: () => ["appointments", "counts"] as const,

    /** Single appointment document. */
    byId: (id: string) => ["appointments", id] as const,

    /** Appointment history for a patient (keyed by phone + limit). */
    byPhone: (phone: string, limit: number) =>
      ["appointments", "phone", phone, limit] as const,
  },

  // ── Prescriptions ──────────────────────────────────────────────────────────
  prescriptions: {
    /** Broad key — invalidate after save. */
    all: ["prescriptions"] as const,

    /** Public prescription view + editor: fetch by document ID. */
    byId: (id: string) => ["prescriptions", id] as const,

    /** Prescription associated with a specific appointment. */
    byAppointment: (appointmentId: string) =>
      ["prescriptions", "appointment", appointmentId] as const,
  },

  // ── Doctors ────────────────────────────────────────────────────────────────
  doctors: {
    /** Broad key — invalidate after save. */
    all: ["doctors"] as const,
    /** Single doctor document. */
    byId: (id: string) => ["doctors", id] as const,
  },

  // ── Invoices ───────────────────────────────────────────────────────────────
  invoices: {
    all: ["invoices"] as const,
    byPatientId: (patientId: string) => ["invoices", "patient", patientId] as const,
    byId: (id: string) => ["invoices", id] as const,
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: {
    /**
     * Combined appointment counts query used by the stats cards.
     * Separate from the patients count so they can be invalidated independently.
     */
    appointmentCounts: () => ["dashboard", "appointmentCounts"] as const,
  },

  // ── Encounters ────────────────────────────────────────────────────────────
  encounters: {
    /** Follow-ups due this week (bounded range query). */
    followUpsDue: ["encounters", "followUpsDue"] as const,
    /** All encounters for a patient (keyed by patientId). */
    byPatient: (patientId: string) => ["encounters", "patient", patientId] as const,
  },
} as const;

