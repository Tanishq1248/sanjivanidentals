"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, CheckCircle2, AlertCircle, Building2 } from "lucide-react";
import { queryKeys, CACHE_POLICIES } from "../../../../lib/query/queryKeys";
import {
  getClinicInfo,
  createOrUpdateClinicInfo,
  validateClinicInfo,
} from "../../../../lib/services/settingsService";
import type { ClinicBasicInfo } from "../../../../lib/types";

export default function ClinicInfoSection() {
  const queryClient = useQueryClient();
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { data: clinicData, isLoading } = useQuery({
    queryKey: queryKeys.settings.clinicInfo,
    queryFn: getClinicInfo,
    ...CACHE_POLICIES.STATIC_METADATA,
  });

  const [formData, setFormData] = useState<ClinicBasicInfo>({
    clinicName: "",
    clinicLogoUrl: "",
    doctorName: "",
    qualification: "",
    registrationNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    whatsappNumber: "",
    email: "",
    website: "",
    invoiceFooterText: "",
    prescriptionFooterText: "",
    currencySymbol: "₹",
    gstNumber: "",
  });

  useEffect(() => {
    if (clinicData) {
      setFormData({
        clinicName: clinicData.clinicName || "",
        clinicLogoUrl: clinicData.clinicLogoUrl || "",
        doctorName: clinicData.doctorName || "",
        qualification: clinicData.qualification || "",
        registrationNumber: clinicData.registrationNumber || "",
        addressLine1: clinicData.addressLine1 || "",
        addressLine2: clinicData.addressLine2 || "",
        city: clinicData.city || "",
        state: clinicData.state || "",
        pincode: clinicData.pincode || "",
        phone: clinicData.phone || "",
        whatsappNumber: clinicData.whatsappNumber || "",
        email: clinicData.email || "",
        website: clinicData.website || "",
        invoiceFooterText: clinicData.invoiceFooterText || "",
        prescriptionFooterText: clinicData.prescriptionFooterText || "",
        currencySymbol: clinicData.currencySymbol || "₹",
        gstNumber: clinicData.gstNumber || "",
      });
    }
  }, [clinicData]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<ClinicBasicInfo>) => createOrUpdateClinicInfo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.clinicInfo });
      setSavedSuccess(true);
      setValidationErrors({});
      setTimeout(() => setSavedSuccess(false), 4000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateClinicInfo(formData);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }
    setValidationErrors({});
    updateMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary">
              Clinic Identity &amp; Branding
            </span>
          </div>
          <h2 className="text-xl font-bold text-on-surface flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Clinic Basic Information
          </h2>
          <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
            Single source of truth for clinic identity details, lead doctor credentials, address, and letterhead/invoice footers.
          </p>
        </div>
      </div>

      {Object.keys(validationErrors).length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Please resolve the following errors:</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5">
            {Object.values(validationErrors).map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-outline-variant/20 shadow-sm space-y-6">
        {/* Section 1: Identity & Credentials */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-outline-variant/10 pb-2">
            1. Clinic Identity &amp; Doctor Credentials
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">Clinic Name *</label>
              <input
                type="text"
                required
                value={formData.clinicName}
                onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
                placeholder="e.g. Sanjivani Dental Clinic"
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all ${
                  validationErrors.clinicName ? "border-rose-400 bg-rose-50/20" : "border-outline-variant/30"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">Lead Doctor / Owner Name *</label>
              <input
                type="text"
                required
                value={formData.doctorName}
                onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                placeholder="e.g. Dr. Rajesh Sharma"
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all ${
                  validationErrors.doctorName ? "border-rose-400 bg-rose-50/20" : "border-outline-variant/30"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">Doctor Qualifications</label>
              <input
                type="text"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                placeholder="e.g. BDS, MDS (Oral & Maxillofacial Surgery)"
                className="w-full px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">Dental Council Registration No.</label>
              <input
                type="text"
                value={formData.registrationNumber}
                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                placeholder="e.g. MH-D-18492"
                className="w-full px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact Information */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-outline-variant/10 pb-2">
            2. Contact &amp; Communication Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">Primary Contact Phone *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all ${
                  validationErrors.phone ? "border-rose-400 bg-rose-50/20" : "border-outline-variant/30"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">WhatsApp Helpline Number</label>
              <input
                type="tel"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">Clinic Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@sanjivanidentals.com"
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all ${
                  validationErrors.email ? "border-rose-400 bg-rose-50/20" : "border-outline-variant/30"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">Website URL</label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="www.sanjivanidentals.com"
                className="w-full px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Physical Address */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-outline-variant/10 pb-2">
            3. Clinic Location &amp; Address (Used in Invoices &amp; Print Header)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">Address Line 1 *</label>
              <input
                type="text"
                required
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                placeholder="e.g. Suite 402, Medical Enclave"
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all ${
                  validationErrors.addressLine1 ? "border-rose-400 bg-rose-50/20" : "border-outline-variant/30"
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">Address Line 2 (Optional)</label>
              <input
                type="text"
                value={formData.addressLine2}
                onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                placeholder="e.g. M.G. Road"
                className="w-full px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">City *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Pune"
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all ${
                  validationErrors.city ? "border-rose-400 bg-rose-50/20" : "border-outline-variant/30"
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">State *</label>
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g. Maharashtra"
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all ${
                    validationErrors.state ? "border-rose-400 bg-rose-50/20" : "border-outline-variant/30"
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">Pincode *</label>
                <input
                  type="text"
                  required
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="e.g. 411001"
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all ${
                    validationErrors.pincode ? "border-rose-400 bg-rose-50/20" : "border-outline-variant/30"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Document Footers & Taxes */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-primary border-b border-outline-variant/10 pb-2">
            4. Document Footers &amp; Tax Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">GSTIN / Tax Number (Optional)</label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                placeholder="27AAAAA0000A1Z5"
                className="w-full px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">Currency Symbol</label>
              <input
                type="text"
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                placeholder="₹"
                className="w-full px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">Invoice Footer Note</label>
              <textarea
                rows={2}
                value={formData.invoiceFooterText}
                onChange={(e) => setFormData({ ...formData, invoiceFooterText: e.target.value })}
                placeholder="e.g. Thank you for choosing Sanjivani Dentals..."
                className="w-full px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">Prescription Footer Note</label>
              <textarea
                rows={2}
                value={formData.prescriptionFooterText}
                onChange={(e) => setFormData({ ...formData, prescriptionFooterText: e.target.value })}
                placeholder="e.g. Take medicines strictly as prescribed..."
                className="w-full px-3.5 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-xs font-medium text-on-surface focus:outline-none focus:border-primary transition-all resize-none"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-outline-variant/15 flex items-center justify-between">
          {savedSuccess ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Clinic information updated successfully!
            </span>
          ) : <span />}

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Clinic Information
          </button>
        </div>
      </form>
    </div>
  );
}
