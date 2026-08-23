import { NextResponse } from "next/server";
import { Timestamp } from "firebase-admin/firestore";
import { updateWhatsAppLogBySid } from "../../../../lib/services/whatsappService";
import { createErrorResponse, logServerError } from "../../../../lib/errors/messagingErrors";
import type { WhatsAppDeliveryStatus } from "../../../../lib/types";

/**
 * Twilio Status Callback Webhook Endpoint.
 */
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let messageSid = "";
    let messageStatus = "";
    let errorCode = "";
    let errorMessage = "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      messageSid = (formData.get("MessageSid") || formData.get("SmsSid") || "") as string;
      messageStatus = (formData.get("MessageStatus") || formData.get("SmsStatus") || "") as string;
      errorCode = (formData.get("ErrorCode") || "") as string;
      errorMessage = (formData.get("ErrorMessage") || "") as string;
    } else {
      const json = await req.json().catch(() => ({}));
      messageSid = json.MessageSid || json.messageSid || "";
      messageStatus = json.MessageStatus || json.messageStatus || "";
      errorCode = json.ErrorCode || json.errorCode || "";
      errorMessage = json.ErrorMessage || json.errorMessage || "";
    }

    if (!messageSid || !messageStatus) {
      return createErrorResponse("PHONE_FORMAT_INVALID", "Missing MessageSid or MessageStatus parameters.");
    }

    const now = Timestamp.now();
    const updates: any = {
      updatedAt: now,
    };

    const statusLower = messageStatus.toLowerCase();

    if (statusLower === "delivered") {
      updates.status = "delivered" as WhatsAppDeliveryStatus;
      updates.deliveredAt = now;
    } else if (statusLower === "read") {
      updates.status = "read" as WhatsAppDeliveryStatus;
      updates.deliveredAt = now;
    } else if (statusLower === "failed" || statusLower === "undelivered") {
      updates.status = "failed" as WhatsAppDeliveryStatus;
      updates.failedAt = now;
      if (errorCode) updates.errorCode = errorCode;
      if (errorMessage) updates.errorMessage = errorMessage;
    } else if (statusLower === "sent") {
      updates.status = "sent" as WhatsAppDeliveryStatus;
      updates.sentAt = now;
    } else if (statusLower === "sending") {
      updates.status = "sending" as WhatsAppDeliveryStatus;
    } else if (statusLower === "queued") {
      updates.status = "queued" as WhatsAppDeliveryStatus;
    }

    const updated = await updateWhatsAppLogBySid(messageSid, updates);

    if (!updated) {
      logServerError(new Error(`No log document found for SID ${messageSid}`), { messageSid, messageStatus });
    }

    return new NextResponse("<Response></Response>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error: any) {
    logServerError(error, { route: "/api/whatsapp/status" });
    return createErrorResponse("UNKNOWN_ERROR", "Status callback processing error", error?.message);
  }
}
