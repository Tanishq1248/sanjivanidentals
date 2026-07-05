import { db } from "../lib/firebase";
import { logToothTreatment } from "../lib/services/patientService";

async function test() {
  console.log("Testing logToothTreatment service...");
  
  // Use first patient ID from our list: VZX2LQ1nPHBsz7FZLrjL
  const patientId = "VZX2LQ1nPHBsz7FZLrjL";
  const toothNumber = 26;
  const treatmentData = {
    treatmentName: "Root Canal Treatment",
    status: "Completed",
    fee: 4500,
    notes: "Test notes",
  };
  const doctorId = "dr-julian-moore";
  const doctorName = "Dr. Julian Moore";

  try {
    const id = await logToothTreatment(patientId, toothNumber, treatmentData, doctorId, doctorName);
    console.log(`Successfully logged treatment. Encounter ID: ${id}`);
  } catch (err) {
    console.error("Error logging treatment:", err);
  }
}

test();
