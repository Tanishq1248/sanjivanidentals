/**
 * Dental Prescription Templates — Clinical 1-Click Regimens
 *
 * Pre-configured clinical treatment regimens for common dental conditions
 * allowing dentists to generate a complete prescription in < 1 second.
 */

import type { Medication } from "../types";

export interface PrescriptionTemplate {
  id: string;
  name: string;
  category: "Endodontics" | "Oral Surgery" | "Periodontics" | "General" | "Pediatric" | "Preventive";
  badgeColor: string;
  defaultDiagnosis: string;
  defaultChiefComplaint: string;
  medications: Medication[];
  advice: string;
  dietInstructions: string;
  oralHygieneInstructions: string;
  additionalInstructions: string;
  suggestedFollowUpDays: number;
  followUpReason: string;
}

export const DENTAL_PRESCRIPTION_TEMPLATES: PrescriptionTemplate[] = [
  // ── 1. POST-ROOT CANAL TREATMENT (RCT) ──
  {
    id: "tpl-post-rct",
    name: "Post-Root Canal Treatment",
    category: "Endodontics",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
    defaultDiagnosis: "Post-Endodontic Therapy / Root Canal Treatment",
    defaultChiefComplaint: "Pain / tenderness following root canal procedure",
    medications: [
      {
        medicine: "Augmentin 625 (Amoxicillin + Clavulanic Acid 625mg)",
        dosage: "1 Tablet",
        frequency: "1-0-1 (Twice Daily)",
        duration: "5 Days",
        timing: "After Food",
        notes: "Complete the full 5-day antibiotic course without skipping",
      },
      {
        medicine: "Zerodol-SP (Aceclofenac 100mg + Paracetamol 325mg + Serratiopeptidase 15mg)",
        dosage: "1 Tablet",
        frequency: "1-0-1 (Twice Daily)",
        duration: "3 Days",
        timing: "After Food",
        notes: "For pain and periapical inflammation",
      },
      {
        medicine: "Pan-D (Pantoprazole 40mg + Domperidone 30mg)",
        dosage: "1 Capsule",
        frequency: "1-0-0 (Once Daily - Morning)",
        duration: "5 Days",
        timing: "Empty Stomach (30 mins before breakfast)",
        notes: "Gastric protection",
      },
    ],
    advice: "Mild tenderness on chewing is normal for 48–72 hours as the ligament heals. Do not bite hard food on the treated tooth until permanent crown placement.",
    dietInstructions: "Soft diet for 2 days. Chew on the opposite side.",
    oralHygieneInstructions: "Continue normal gentle brushing. Warm saline rinses 3 times daily starting tomorrow.",
    additionalInstructions: "Crown preparation / permanent restoration scheduled for next visit.",
    suggestedFollowUpDays: 7,
    followUpReason: "Permanent Crown Fitting / Core Review",
  },

  // ── 2. SIMPLE EXTRACTION ──
  {
    id: "tpl-simple-extraction",
    name: "Simple Tooth Extraction",
    category: "Oral Surgery",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    defaultDiagnosis: "Post-Extraction / Exodontia (Uncomplicated)",
    defaultChiefComplaint: "Post-extraction soreness & wound healing",
    medications: [
      {
        medicine: "Zerodol-P (Aceclofenac 100mg + Paracetamol 325mg)",
        dosage: "1 Tablet",
        frequency: "1-0-1 (Twice Daily)",
        duration: "3 Days",
        timing: "After Food",
        notes: "Take first dose before local anesthesia wears off",
      },
      {
        medicine: "Pan-D (Pantoprazole 40mg + Domperidone 30mg)",
        dosage: "1 Capsule",
        frequency: "1-0-0 (Once Daily - Morning)",
        duration: "3 Days",
        timing: "Empty Stomach",
        notes: "Antacid",
      },
      {
        medicine: "Hexidine Mouthwash (Chlorhexidine Gluconate 0.2%)",
        dosage: "10 ml undiluted",
        frequency: "1-0-1 (Twice Daily)",
        duration: "5 Days",
        timing: "After Food",
        notes: "Start ONLY after 24 hours. Do NOT rinse vigorously.",
      },
    ],
    advice: "Keep sterile gauze firmly pressed in place for 45 minutes. Do NOT spit, suck through straw, or smoke for 24 hours to preserve blood clot.",
    dietInstructions: "Cold and soft foods (ice cream, curd, porridge, smoothie). Avoid hot beverages for 24 hours.",
    oralHygieneInstructions: "Do not rinse mouth today. From tomorrow, start warm salt water rinses 3-4 times a day.",
    additionalInstructions: "If excessive bleeding occurs, place a clean damp tea bag over socket and bite firmly for 30 minutes.",
    suggestedFollowUpDays: 5,
    followUpReason: "Socket Healing & Review",
  },

  // ── 3. SURGICAL EXTRACTION / 3RD MOLAR IMPACTION ──
  {
    id: "tpl-surgical-extraction",
    name: "Surgical Extraction / Impaction",
    category: "Oral Surgery",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    defaultDiagnosis: "Post-Surgical Disimpaction / 3rd Molar Surgery",
    defaultChiefComplaint: "Surgical wound, mild facial swelling & discomfort",
    medications: [
      {
        medicine: "Augmentin 625 (Amoxicillin 500mg + Clavulanic Acid 125mg)",
        dosage: "1 Tablet",
        frequency: "1-0-1 (Twice Daily)",
        duration: "5 Days",
        timing: "After Food",
        notes: "Antibiotic prophylaxis",
      },
      {
        medicine: "Flagyl 400 (Metronidazole 400mg)",
        dosage: "1 Tablet",
        frequency: "1-0-1 (Twice Daily)",
        duration: "5 Days",
        timing: "After Food",
        notes: "Anti-anaerobic coverage (Do not consume alcohol)",
      },
      {
        medicine: "Zerodol-SP (Aceclofenac + Paracetamol + Serratiopeptidase)",
        dosage: "1 Tablet",
        frequency: "1-0-1 (Twice Daily)",
        duration: "4 Days",
        timing: "After Food",
        notes: "Reduces post-surgical facial edema and trismus",
      },
      {
        medicine: "Pan-D (Pantoprazole 40mg + Domperidone 30mg)",
        dosage: "1 Capsule",
        frequency: "1-0-0 (Once Daily - Morning)",
        duration: "5 Days",
        timing: "Empty Stomach",
        notes: "Gastric mucosa protection",
      },
      {
        medicine: "Hexidine Mouthwash (Chlorhexidine 0.2%)",
        dosage: "10 ml",
        frequency: "1-0-1 (Twice Daily)",
        duration: "7 Days",
        timing: "After Food",
        notes: "Start after 24 hrs. Gentle mouth baths.",
      },
    ],
    advice: "Apply ice pack to outer cheek for 15 mins on / 15 mins off for the first 24 hours. Swelling usually peaks on Day 2 and subsides by Day 4.",
    dietInstructions: "Cool liquids and very soft diet (dal khichdi, cold milk, yogurt) for 3–5 days.",
    oralHygieneInstructions: "Warm salt water rinses starting 24h post-op. Avoid brushing directly on surgical suture site.",
    additionalInstructions: "Suture removal required on 7th day post-op.",
    suggestedFollowUpDays: 7,
    followUpReason: "Suture Removal & Wound Inspection",
  },

  // ── 4. ACUTE PERIAPICAL ABSCESS / CELLULITIS ──
  {
    id: "tpl-periapical-abscess",
    name: "Acute Periapical Abscess",
    category: "Endodontics",
    badgeColor: "bg-red-50 text-red-700 border-red-200",
    defaultDiagnosis: "Acute Periapical Abscess with Dentoalveolar Swelling",
    defaultChiefComplaint: "Severe throbbing pain, localized swelling & tooth elevation",
    medications: [
      {
        medicine: "Augmentin 625 (Amoxicillin + Clavulanic Acid 625mg)",
        dosage: "1 Tablet",
        frequency: "1-0-1 (Twice Daily)",
        duration: "5 Days",
        timing: "After Food",
        notes: "Complete full antibiotic course",
      },
      {
        medicine: "Flagyl 400 (Metronidazole 400mg)",
        dosage: "1 Tablet",
        frequency: "1-0-1 (Twice Daily)",
        duration: "5 Days",
        timing: "After Food",
        notes: "For mixed anaerobic periapical infection",
      },
      {
        medicine: "Zerodol-SP (Aceclofenac + Paracetamol + Serratiopeptidase)",
        dosage: "1 Tablet",
        frequency: "1-0-1 (Twice Daily)",
        duration: "3 Days",
        timing: "After Food",
        notes: "Anti-inflammatory & pain management",
      },
      {
        medicine: "Pan-D (Pantoprazole + Domperidone)",
        dosage: "1 Capsule",
        frequency: "1-0-0 (Once Daily - Morning)",
        duration: "5 Days",
        timing: "Empty Stomach",
        notes: "Acid suppression",
      },
    ],
    advice: "Medications control acute infection. Definitive treatment (Pulp extirpation / RCT or Drainage) is mandatory to prevent recurrence.",
    dietInstructions: "Soft, lukewarm diet. Drink plenty of water.",
    oralHygieneInstructions: "Warm saline rinses 4-5 times daily to encourage localized blood supply and natural drainage.",
    additionalInstructions: "Seek immediate emergency attention if difficulty in swallowing or breathing develops.",
    suggestedFollowUpDays: 3,
    followUpReason: "Abscess Resolution Review & RCT Biomechanical Prep",
  },

  // ── 5. ACUTE GINGIVITIS & PERIODONTITIS ──
  {
    id: "tpl-gingivitis-perio",
    name: "Gingivitis & Periodontitis",
    category: "Periodontics",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    defaultDiagnosis: "Generalized Chronic Gingivitis with Bleeding on Probing",
    defaultChiefComplaint: "Bleeding gums during brushing, bad breath (halitosis)",
    medications: [
      {
        medicine: "Hexidine Mouthwash (Chlorhexidine Gluconate 0.2%)",
        dosage: "10 ml undiluted",
        frequency: "1-0-1 (Twice Daily)",
        duration: "10 Days",
        timing: "After Food",
        notes: "Rinse mouth thoroughly for 60 seconds twice daily",
      },
      {
        medicine: "Flagyl 400 (Metronidazole 400mg)",
        dosage: "1 Tablet",
        frequency: "1-0-1 (Twice Daily)",
        duration: "5 Days",
        timing: "After Food",
        notes: "Controls subgingival anaerobic bacterial colonies",
      },
      {
        medicine: "Limcee 500 (Vitamin C 500mg Chewable)",
        dosage: "1 Tablet",
        frequency: "1-0-0 (Once Daily)",
        duration: "15 Days",
        timing: "After Food",
        notes: "Chew tablet daily for gingival collagen repair",
      },
    ],
    advice: "Full mouth ultrasonic scaling and root planing completed. Bleeding will significantly reduce within 3–5 days with regular plaque control.",
    dietInstructions: "Incorporate crunchy fibrous vegetables and vitamin-rich fruits.",
    oralHygieneInstructions: "Use modified Bass brushing technique with ultra-soft toothbrush. Floss daily between all teeth.",
    additionalInstructions: "Do not use chlorhexidine for more than 14 consecutive days to avoid temporary extrinsic tooth staining.",
    suggestedFollowUpDays: 14,
    followUpReason: "Periodontal Re-evaluation & Gingival Index Review",
  },

  // ── 6. APHTHOUS ULCER / ORAL STOMATITIS ──
  {
    id: "tpl-mouth-ulcer",
    name: "Aphthous Ulcer / Stomatitis",
    category: "General",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
    defaultDiagnosis: "Recurrent Aphthous Stomatitis (Oral Mucosal Ulceration)",
    defaultChiefComplaint: "Burning pain while eating spicy food, localized mucosal lesion",
    medications: [
      {
        medicine: "Dologel-CT (Choline Salicylate 8.7% + Lidocaine 2%)",
        dosage: "Small pea-sized dab",
        frequency: "Apply 3-4 times daily",
        duration: "5 Days",
        timing: "15 minutes before meals",
        notes: "Apply with clean finger for immediate numbing relief before eating",
      },
      {
        medicine: "Kenacort 0.1% Oral Paste (Triamcinolone Acetonide)",
        dosage: "Small dab",
        frequency: "0-0-1 (At Bedtime)",
        duration: "4 Days",
        timing: "At Bedtime",
        notes: "Apply thin layer at night. Accelerates healing.",
      },
      {
        medicine: "Becosules Z (B-Complex + Vitamin C + Zinc)",
        dosage: "1 Capsule",
        frequency: "1-0-0 (Once Daily)",
        duration: "10 Days",
        timing: "After Breakfast",
        notes: "Mucosal epithelial restoration",
      },
    ],
    advice: "Avoid sharp, crispy, acidic, or heavily spiced foods which irritate ulcerated tissues. Stay well hydrated.",
    dietInstructions: "Bland, cool diet (curd, buttermilk, bananas, coconut water).",
    oralHygieneInstructions: "Use non-foaming SLS-free toothpaste. Avoid vigorous toothbrush contact on ulcer site.",
    additionalInstructions: "If ulcer persists beyond 14 days, a clinical biopsy / blood profile is indicated.",
    suggestedFollowUpDays: 7,
    followUpReason: "Mucosal Healing Verification",
  },

  // ── 7. PEDIATRIC TOOTHACHE & SWELLING ──
  {
    id: "tpl-pediatric-pain",
    name: "Pediatric Toothache & Fever",
    category: "Pediatric",
    badgeColor: "bg-pink-50 text-pink-700 border-pink-200",
    defaultDiagnosis: "Primary Dentition Caries / Pulpitis (Pediatric)",
    defaultChiefComplaint: "Child complaining of pain while eating, nocturnal discomfort",
    medications: [
      {
        medicine: "Calpol 250 Syrup (Paracetamol 250mg/5ml)",
        dosage: "5 ml (as per child body weight)",
        frequency: "1-1-1 (Three Times Daily / SOS)",
        duration: "3 Days",
        timing: "After Food",
        notes: "Give with measuring cup strictly as directed",
      },
      {
        medicine: "Augmentin Duo Oral Suspension (Amoxicillin 200mg + Clav 28.5mg/5ml)",
        dosage: "5 ml",
        frequency: "1-0-1 (Twice Daily)",
        duration: "5 Days",
        timing: "After Food",
        notes: "Keep reconstituted suspension refrigerated. Shake well.",
      },
    ],
    advice: "Do not let child sleep with milk bottles in mouth. Schedule pulpectomy or stainless steel crown restoration.",
    dietInstructions: "Soft, non-sticky food. Avoid chocolates, sticky sweets, and acidic fruit juices.",
    oralHygieneInstructions: "Parent-assisted brushing twice daily with pea-sized fluoridated pediatric toothpaste.",
    additionalInstructions: "Encourage water intake after all meals and snacks.",
    suggestedFollowUpDays: 4,
    followUpReason: "Pediatric Pulpectomy / Restoration Session",
  },

  // ── 8. DRY SOCKET (ALVEOLAR OSTEITIS) ──
  {
    id: "tpl-dry-socket",
    name: "Dry Socket (Alveolar Osteitis)",
    category: "Oral Surgery",
    badgeColor: "bg-orange-50 text-orange-700 border-orange-200",
    defaultDiagnosis: "Alveolar Osteitis (Dry Socket) Post-Extraction",
    defaultChiefComplaint: "Severe radiating dull throbbing pain 3 days post-extraction",
    medications: [
      {
        medicine: "Ketorol-DT (Ketorolac Tromethamine 10mg Dispersible)",
        dosage: "1 Tablet",
        frequency: "1-0-1 (Twice Daily / SOS)",
        duration: "2 Days",
        timing: "After Food (Dissolve in water)",
        notes: "Potent analgesic for severe bone ache",
      },
      {
        medicine: "Pan-D (Pantoprazole + Domperidone)",
        dosage: "1 Capsule",
        frequency: "1-0-0 (Once Daily)",
        duration: "3 Days",
        timing: "Empty Stomach",
        notes: "Antacid",
      },
      {
        medicine: "Hexidine Mouthwash (0.2% Chlorhexidine)",
        dosage: "10 ml",
        frequency: "1-0-1 (Twice Daily)",
        duration: "7 Days",
        timing: "After Food",
        notes: "Gentle warm rinses. Do not spit forcefully.",
      },
    ],
    advice: "Socket irrigated with warm saline and soothing eugenol-based sedative dressing placed in clinic.",
    dietInstructions: "Lukewarm and soft liquids. Do not smoke or chew tobacco under any circumstances.",
    oralHygieneInstructions: "Gentle warm saline mouth baths 4-5 times a day after meals.",
    additionalInstructions: "Dressing change scheduled if pain persists.",
    suggestedFollowUpDays: 2,
    followUpReason: "Socket Dressing Review & Irrigation",
  },

  // ── 9. DENTAL HYPERSENSITIVITY ──
  {
    id: "tpl-hypersensitivity",
    name: "Dental Hypersensitivity",
    category: "Preventive",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    defaultDiagnosis: "Cervical Dentin Hypersensitivity / Enamel Abrasion",
    defaultChiefComplaint: "Sharp short pain upon drinking cold water or eating citrus items",
    medications: [
      {
        medicine: "Sensodyne Rapid Relief (Potassium Nitrate 5% + Sodium Fluoride)",
        dosage: "Pea-sized amount",
        frequency: "1-0-1 (Twice Daily)",
        duration: "4 Weeks",
        timing: "Morning & Night",
        notes: "Brush gently for 2 minutes. Can massage directly on sensitive tooth with fingertip.",
      },
      {
        medicine: "Hexidine Mouthwash (Chlorhexidine 0.2%)",
        dosage: "10 ml",
        frequency: "1-0-1 (Twice Daily)",
        duration: "7 Days",
        timing: "After Food",
        notes: "Reduces gingival inflammation",
      },
    ],
    advice: "Sensitivity is caused by exposed dentinal tubules. Desensitizing toothpaste builds protective barrier over 2–3 weeks of regular use.",
    dietInstructions: "Limit consumption of carbonated beverages, lemon juice, and extremely cold drinks.",
    oralHygieneInstructions: "Use only ultra-soft toothbrush. Avoid aggressive horizontal scrubbing strokes.",
    additionalInstructions: "If sensitivity persists, clinic in-office fluoride varnish / bonding agent can be applied.",
    suggestedFollowUpDays: 21,
    followUpReason: "Desensitization Outcome Review",
  },
];
