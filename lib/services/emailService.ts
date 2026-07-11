interface SendEmailParams {
  invoiceId: string;
  patientEmail: string;
  patientName: string;
  pdfBase64: string;
  clinicName?: string;
}

/**
 * Client service to call the server-side Next.js route for sending Resend email.
 */
export async function sendInvoiceEmail({
  invoiceId,
  patientEmail,
  patientName,
  pdfBase64,
  clinicName = "Sanjivani Dentals",
}: SendEmailParams): Promise<{ success: boolean; message: string; emailSentAt: string }> {
  const response = await fetch(`/api/invoices/${invoiceId}/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      patientEmail,
      patientName,
      pdfBase64,
      clinicName,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to send invoice email.");
  }

  return data;
}
