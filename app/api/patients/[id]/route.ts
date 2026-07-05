import { NextRequest, NextResponse } from "next/server";
import {
  getPatientById,
  updatePatient,
  deletePatient,
} from "../../../../lib/services/patientService";

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/patients/:id */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const patient = await getPatientById(id);
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
    return NextResponse.json({ patient });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch patient";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** PUT /api/patients/:id */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    await updatePatient(id, body);
    return NextResponse.json({ message: "Patient updated" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update patient";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** DELETE /api/patients/:id */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deletePatient(id);
    return NextResponse.json({ message: "Patient deleted" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete patient";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
