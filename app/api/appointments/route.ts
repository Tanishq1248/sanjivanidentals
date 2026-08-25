import { NextRequest, NextResponse } from "next/server";
import {
  getAppointments,
  createAppointment,
} from "../../../lib/services/appointmentService";
import { createNotification } from "../../../lib/services/notificationService";
import type { AppointmentFormData, AppointmentFilter } from "../../../lib/types";

/** GET /api/appointments?filter=today|upcoming|history|all */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = (searchParams.get("filter") || "all") as AppointmentFilter;
    const appointments = await getAppointments(filter);
    return NextResponse.json({ appointments });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch appointments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST /api/appointments — create a new appointment (public booking) */
export async function POST(request: NextRequest) {
  try {
    const body: AppointmentFormData = await request.json();

    if (!body.patientName || !body.patientPhone || !body.date || !body.time || !body.service) {
      return NextResponse.json(
        { error: "Name, phone, date, time, and service are required" },
        { status: 400 }
      );
    }

    const id = await createAppointment(body);

    // Create a notification for the admin (best-effort, non-blocking)
    try {
      await createNotification({
        type: "new_booking",
        title: "New Appointment Request",
        message: `${body.patientName} requested an appointment on ${body.date} at ${body.time} for ${body.service}.`,
        appointmentId: id,
      });
    } catch (notifErr) {
      console.warn("[API /appointments] Failed to create admin notification:", notifErr);
    }

    return NextResponse.json(
      { id, message: "Appointment created" },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create appointment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
