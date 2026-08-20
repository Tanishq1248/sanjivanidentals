/**
 * Prescription Safety & Contraindication Service
 *
 * Real-time clinical cross-referencing between patient medical alerts,
 * chronic diseases, allergies, and prescribed dental medications.
 */

import type { Medication, Patient, PatientMedicalProfile } from "../types";
import { DENTAL_MEDICATION_CATALOG } from "../data/dentalMedicationCatalog";

export interface PrescriptionSafetyAlert {
  id: string;
  medicineIndex: number;
  medicineName: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  title: string;
  description: string;
  safeAlternative?: string;
  sourceCategory: "Allergy" | "Contraindication" | "Drug Interaction" | "Gastric Protection";
}

export function evaluatePrescriptionSafety(
  medications: Medication[],
  patient: Patient,
  medicalProfile?: PatientMedicalProfile | null
): PrescriptionSafetyAlert[] {
  const alerts: PrescriptionSafetyAlert[] = [];

  // Compile full patient medical & allergy text
  const allergyText = [
    patient.allergies || "",
    medicalProfile?.allergies || "",
  ]
    .join(" ")
    .toLowerCase();

  const chronicDiseaseText = [
    patient.diseases || "",
    patient.condition || "",
    patient.notes || "",
    medicalProfile?.chronicDiseases || "",
    medicalProfile?.medicalConditions || "",
    medicalProfile?.clinicalNotes || "",
  ]
    .join(" ")
    .toLowerCase();

  const isPenicillinAllergic =
    allergyText.includes("penicillin") ||
    allergyText.includes("amox") ||
    allergyText.includes("clav") ||
    allergyText.includes("beta-lactam") ||
    allergyText.includes("augmentin");

  const isNsaidAllergic =
    allergyText.includes("nsaid") ||
    allergyText.includes("aspirin") ||
    allergyText.includes("ibuprofen") ||
    allergyText.includes("zerodol") ||
    allergyText.includes("combiflam") ||
    allergyText.includes("diclofenac");

  const hasPepticUlcerOrGerd =
    chronicDiseaseText.includes("ulcer") ||
    chronicDiseaseText.includes("peptic") ||
    chronicDiseaseText.includes("gastritis") ||
    chronicDiseaseText.includes("gerd") ||
    chronicDiseaseText.includes("acid");

  const isPregnant =
    chronicDiseaseText.includes("pregnant") ||
    chronicDiseaseText.includes("pregnancy") ||
    allergyText.includes("pregnant");

  const hasAsthma =
    chronicDiseaseText.includes("asthma") ||
    chronicDiseaseText.includes("bronchial");

  const hasRenalDisease =
    chronicDiseaseText.includes("kidney") ||
    chronicDiseaseText.includes("renal") ||
    chronicDiseaseText.includes("ckd");

  // Check if an Antacid / PPI is present in the current prescription
  const hasAntacid = medications.some((m) => {
    const medLower = (m.medicine || "").toLowerCase();
    return (
      medLower.includes("pan-d") ||
      medLower.includes("pantoprazole") ||
      medLower.includes("pantocid") ||
      medLower.includes("omez") ||
      medLower.includes("omeprazole") ||
      medLower.includes("razo") ||
      medLower.includes("rabeprazole") ||
      medLower.includes("gelusil") ||
      medLower.includes("digene")
    );
  });

  let hasStrongNsaid = false;

  medications.forEach((med, idx) => {
    const nameLower = (med.medicine || "").toLowerCase();
    if (!nameLower.trim()) return;

    // 1. PENICILLIN / AMOXICILLIN ALLERGY CHECK
    if (
      isPenicillinAllergic &&
      (nameLower.includes("augmentin") ||
        nameLower.includes("amoxicillin") ||
        nameLower.includes("clavam") ||
        nameLower.includes("mox") ||
        nameLower.includes("ampicillin"))
    ) {
      alerts.push({
        id: `alert-penicillin-${idx}`,
        medicineIndex: idx,
        medicineName: med.medicine,
        severity: "CRITICAL",
        title: "Penicillin Allergy Alert",
        description: `Patient has a documented Penicillin/Beta-Lactam allergy. Prescribing "${med.medicine}" may trigger severe hypersensitivity or anaphylaxis.`,
        safeAlternative: "Substitute with Dalacin C 300mg (Clindamycin) or Azithral 500mg (Azithromycin).",
        sourceCategory: "Allergy",
      });
    }

    // 2. NSAID ALLERGY CHECK
    if (
      isNsaidAllergic &&
      (nameLower.includes("zerodol") ||
        nameLower.includes("aceclofenac") ||
        nameLower.includes("ketorol") ||
        nameLower.includes("ibuprofen") ||
        nameLower.includes("combiflam") ||
        nameLower.includes("diclofenac") ||
        nameLower.includes("enzoflam"))
    ) {
      alerts.push({
        id: `alert-nsaid-${idx}`,
        medicineIndex: idx,
        medicineName: med.medicine,
        severity: "CRITICAL",
        title: "NSAID Hypersensitivity Alert",
        description: `Patient is allergic to NSAIDs/Aspirin. "${med.medicine}" is contraindicated.`,
        safeAlternative: "Substitute with Paracetamol (Dolo 650) or Tramadol (Ultracet).",
        sourceCategory: "Allergy",
      });
    }

    // 3. TRACK NSAID USE
    if (
      nameLower.includes("zerodol") ||
      nameLower.includes("ketorol") ||
      nameLower.includes("diclofenac") ||
      nameLower.includes("aceclofenac") ||
      nameLower.includes("combiflam") ||
      nameLower.includes("ibuprofen") ||
      nameLower.includes("enzoflam")
    ) {
      hasStrongNsaid = true;
    }

    // 4. PREGNANCY CONTRAINDICATIONS
    if (isPregnant) {
      if (nameLower.includes("doxy") || nameLower.includes("tetracycline")) {
        alerts.push({
          id: `alert-preg-doxy-${idx}`,
          medicineIndex: idx,
          medicineName: med.medicine,
          severity: "CRITICAL",
          title: "Pregnancy Contraindication (Tetracycline)",
          description: "Doxycycline is FDA Category D and causes permanent enamel hypoplasia and brown tooth staining in fetal teeth.",
          safeAlternative: "Use Amoxicillin 500mg or Erythromycin/Azithromycin.",
          sourceCategory: "Contraindication",
        });
      }

      if (nameLower.includes("flagyl") || nameLower.includes("metronidazole")) {
        alerts.push({
          id: `alert-preg-metro-${idx}`,
          medicineIndex: idx,
          medicineName: med.medicine,
          severity: "WARNING",
          title: "Pregnancy Precaution (Metronidazole)",
          description: "Metronidazole crosses placental barrier. Avoid in first trimester unless clinically critical.",
          sourceCategory: "Contraindication",
        });
      }

      if (nameLower.includes("ketorol") || nameLower.includes("aceclofenac")) {
        alerts.push({
          id: `alert-preg-nsaid-${idx}`,
          medicineIndex: idx,
          medicineName: med.medicine,
          severity: "WARNING",
          title: "Pregnancy Precaution (NSAID)",
          description: "NSAIDs in 3rd trimester can cause premature closure of ductus arteriosus.",
          safeAlternative: "Use Paracetamol (Dolo 650mg) as primary analgesic in pregnancy.",
          sourceCategory: "Contraindication",
        });
      }
    }

    // 5. ASTHMA NSAID PRECAUTION
    if (hasAsthma && nameLower.includes("ketorol")) {
      alerts.push({
        id: `alert-asthma-${idx}`,
        medicineIndex: idx,
        medicineName: med.medicine,
        severity: "WARNING",
        title: "Asthma Bronchospasm Precaution",
        description: "Ketorolac (Ketorol-DT) may precipitate acute bronchospasm in patients with aspirin-sensitive asthma.",
        safeAlternative: "Use Paracetamol (Dolo 650) or Acetaminophen combination.",
        sourceCategory: "Contraindication",
      });
    }

    // 6. RENAL IMPAIRMENT WARNING
    if (hasRenalDisease && (nameLower.includes("ketorol") || nameLower.includes("diclofenac"))) {
      alerts.push({
        id: `alert-renal-${idx}`,
        medicineIndex: idx,
        medicineName: med.medicine,
        severity: "CRITICAL",
        title: "Renal Function Warning",
        description: "Potent NSAIDs inhibit renal prostaglandins and can cause acute kidney injury in patients with pre-existing renal disease.",
        safeAlternative: "Use dose-adjusted Paracetamol.",
        sourceCategory: "Contraindication",
      });
    }
  });

  // 7. GASTRIC PROTECTION / PPI WARNING
  if (hasPepticUlcerOrGerd && hasStrongNsaid && !hasAntacid) {
    alerts.push({
      id: "alert-gastric-protection",
      medicineIndex: -1,
      medicineName: "NSAID without PPI",
      severity: "WARNING",
      title: "Gastric Protection Recommended",
      description: "Patient has history of Peptic Ulcer / Acidity. Strong NSAIDs prescribed without concurrent PPI/Antacid.",
      safeAlternative: "Add Pan-D (Pantoprazole 40mg + Domperidone) 1-0-0 on empty stomach.",
      sourceCategory: "Gastric Protection",
    });
  }

  return alerts;
}
