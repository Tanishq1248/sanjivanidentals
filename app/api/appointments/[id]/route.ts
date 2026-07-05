import { NextRequest, NextResponse } from "next/server";
import {
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
} from "../../../../lib/services/appointmentService";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/appointments/:id */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const appointment = await getAppointmentById(id);
    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    return NextResponse.json({ appointment });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch appointment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** PUT /api/appointments/:id */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    await updateAppointment(id, body);
    return NextResponse.json({ message: "Appointment updated" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update appointment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE /api/appointments/:id */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteAppointment(id);
    return NextResponse.json({ message: "Appointment deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete appointment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
