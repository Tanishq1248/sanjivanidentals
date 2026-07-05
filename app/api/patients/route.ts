import { NextRequest, NextResponse } from "next/server";
import {
  getPatients,
  addPatient,
} from "../../../lib/services/patientService";
import type { PatientFormData } from "../../../lib/types";

/** GET /api/patients — list all patients */
export async function GET() {
  try {
    const patients = await getPatients();
    return NextResponse.json({ patients });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch patients";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST /api/patients — create a new patient */
export async function POST(request: NextRequest) {
  try {
    const body: PatientFormData = await request.json();

    if (!body.name || !body.phone) {
      return NextResponse.json(
        { error: "Name and phone are required" },
        { status: 400 }
      );
    }

    const id = await addPatient(body);
    return NextResponse.json({ id, message: "Patient created" }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create patient";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
