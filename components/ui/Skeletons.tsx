import React, { useState, useEffect } from "react";

/**
 * Custom hook to prevent visual skeleton flashing on very fast fetches.
 * Delays setting the visible loading state by delayMs (default 300ms).
 */
export function useDelayLoading(loading: boolean, delayMs = 300): boolean {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => {
        setShouldShow(true);
      }, delayMs);
    } else {
      setShouldShow(false);
    }
    return () => clearTimeout(timer);
  }, [loading, delayMs]);

  return shouldShow;
}

/**
 * Basic pulsing placeholder wrapper.
 */
export const SkeletonPulse: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = "",
  ...props
}) => {
  return (
    <div
      className={`animate-pulse bg-on-surface-variant/10 rounded ${className}`}
      {...props}
    />
  );
};

/**
 * Skeleton loader for dashboard statistics cards.
 */
export const StatsCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-outline-variant/10 shadow-sm p-4 md:p-6 flex items-center justify-between">
      <div className="space-y-2 flex-1">
        <SkeletonPulse className="h-4 w-24" />
        <SkeletonPulse className="h-8 w-16" />
        <SkeletonPulse className="h-3 w-32" />
      </div>
      <SkeletonPulse className="w-10 h-10 md:w-14 md:h-14 rounded-xl shrink-0" />
    </div>
  );
};

/**
 * Skeleton loader for a single table row (representing an appointment or patient record).
 */
export const TableRowSkeleton: React.FC<{ columns: number }> = ({ columns }) => {
  return (
    <tr className="border-b border-outline-variant/10">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          {i === 0 ? (
            <div className="flex items-center gap-3">
              <SkeletonPulse className="w-9 h-9 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <SkeletonPulse className="h-4 w-28" />
                <SkeletonPulse className="h-3 w-16" />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <SkeletonPulse className="h-3.5 w-24" />
              {i === 1 && <SkeletonPulse className="h-3 w-32" />}
            </div>
          )}
        </td>
      ))}
    </tr>
  );
};

/**
 * Skeleton loader for a complete Table layout.
 */
export const TableSkeleton: React.FC<{ rows?: number; columns: number }> = ({
  rows = 5,
  columns,
}) => {
  return (
    <div className="w-full overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-outline-variant/10 bg-surface-container-low/50">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-5 py-3">
                <SkeletonPulse className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Skeleton loader for mobile card lists (dashboard & patients).
 */
export const CardListSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="divide-y divide-outline-variant/10">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="px-4 py-4 flex items-start gap-3">
          <SkeletonPulse className="w-9 h-9 rounded-full shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <SkeletonPulse className="h-4 w-28" />
                <SkeletonPulse className="h-3 w-20" />
              </div>
              <SkeletonPulse className="h-5 w-16 rounded-full" />
            </div>
            <SkeletonPulse className="h-3 w-36" />
            <div className="flex gap-2 pt-1">
              <SkeletonPulse className="h-8 w-20 rounded-lg" />
              <SkeletonPulse className="h-8 w-16 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton loader for the Patient Details modal (appointment history tab).
 */
export const PatientDetailsModalSkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="p-3.5 border border-outline-variant/10 rounded-xl flex items-center justify-between gap-3"
        >
          <div className="space-y-1.5 flex-1">
            <SkeletonPulse className="h-4 w-32" />
            <SkeletonPulse className="h-3 w-48" />
          </div>
          <SkeletonPulse className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton loader for the Prescription Form editor.
 */
export const PrescriptionFormSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f2f5f8] pb-12">
      <div className="bg-white border-b border-outline-variant/20 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <SkeletonPulse className="w-8 h-8 rounded-lg" />
          <div className="space-y-1">
            <SkeletonPulse className="h-5 w-36" />
            <SkeletonPulse className="h-3.5 w-48" />
          </div>
        </div>
        <SkeletonPulse className="w-24 h-10 rounded-lg" />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Header Summary Card */}
        <div className="bg-white rounded-2xl border border-outline-variant/10 p-6 flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-3">
            <SkeletonPulse className="h-6 w-48" />
            <div className="grid grid-cols-2 gap-4">
              <SkeletonPulse className="h-4 w-32" />
              <SkeletonPulse className="h-4 w-32" />
            </div>
          </div>
        </div>

        {/* Diagnosis & Medications Section */}
        <div className="bg-white rounded-2xl border border-outline-variant/10 p-6 space-y-6">
          <div className="space-y-2">
            <SkeletonPulse className="h-4 w-24" />
            <SkeletonPulse className="h-10 w-full" />
          </div>

          <div className="space-y-3">
            <SkeletonPulse className="h-4 w-36" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4">
                <SkeletonPulse className="h-10 w-full" />
                <SkeletonPulse className="h-10 w-full" />
                <SkeletonPulse className="h-10 w-full" />
                <SkeletonPulse className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton loader for the Public Prescription paper view.
 */
export const PublicPrescriptionSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-12 space-y-8 animate-pulse">
        {/* Letterhead */}
        <div className="flex justify-between items-start border-b pb-6">
          <div className="space-y-2">
            <SkeletonPulse className="h-7 w-48" />
            <SkeletonPulse className="h-4 w-36" />
            <SkeletonPulse className="h-4 w-56" />
          </div>
          <SkeletonPulse className="w-16 h-16 rounded-full" />
        </div>

        {/* Patient & Date Meta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 rounded-xl p-6">
          <div className="space-y-3">
            <SkeletonPulse className="h-4 w-40" />
            <SkeletonPulse className="h-4 w-32" />
          </div>
          <div className="space-y-3 md:text-right">
            <SkeletonPulse className="h-4 w-36 ml-auto" />
            <SkeletonPulse className="h-4 w-28 ml-auto" />
          </div>
        </div>

        {/* Rx Section */}
        <div className="space-y-4">
          <SkeletonPulse className="h-6 w-8 rounded" />
          <div className="border rounded-xl overflow-hidden divide-y">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 grid grid-cols-3 gap-4">
                <SkeletonPulse className="h-4 w-28" />
                <SkeletonPulse className="h-4 w-20" />
                <SkeletonPulse className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Signature Placeholder */}
        <div className="pt-12 border-t flex justify-end">
          <div className="text-center space-y-2">
            <SkeletonPulse className="h-10 w-36 mx-auto" />
            <SkeletonPulse className="h-4 w-32 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};
