interface SendInvoiceEmailParams {
  invoiceId: string;
  patientEmail: string;
  patientName: string;
  clinicName?: string;
}

interface SendPrescriptionEmailParams {
  prescriptionId: string;
  patientEmail: string;
  patientName: string;
  clinicName?: string;
}

/**
 * Client service to call the server-side Next.js route for sending Invoice Resend email.
 * Reuses server-side DocumentStorageService to retrieve stored PDF without client Base64 payloads.
 */
export async function sendInvoiceEmail({
  invoiceId,
  patientEmail,
  patientName,
  clinicName = "Sanjivani Dentals",
}: SendInvoiceEmailParams): Promise<{ success: boolean; message: string; emailSentAt: string }> {
  const response = await fetch(`/api/invoices/${invoiceId}/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      patientEmail,
      patientName,
      clinicName,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to send invoice email.");
  }

  return data;
}

/**
 * Client service to call the server-side Next.js route for sending Prescription Resend email.
 * Reuses server-side DocumentStorageService to retrieve stored PDF without client Base64 payloads.
 */
export async function sendPrescriptionEmail({
  prescriptionId,
  patientEmail,
  patientName,
  clinicName = "Sanjivani Dentals",
}: SendPrescriptionEmailParams): Promise<{ success: boolean; message: string; emailSentAt: string }> {
  const response = await fetch(`/api/prescriptions/${prescriptionId}/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      patientEmail,
      patientName,
      clinicName,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to send prescription email.");
  }

  return data;
}
