"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Stethoscope, Mail, Lock, AlertCircle, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { useAuth } from "../../../lib/context/AuthContext";

function AdminLoginForm() {
  const { login, user, loading, sessionExpired } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReasonInactivity = searchParams.get("reason") === "inactivity" || sessionExpired;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect to admin dashboard
  React.useEffect(() => {
    if (!loading && user) {
      router.replace("/admin");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      router.replace("/admin");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Login failed. Please try again.";
      if (
        message.includes("invalid-credential") ||
        message.includes("wrong-password") ||
        message.includes("user-not-found")
      ) {
        setError("Invalid email or password.");
      } else if (message.includes("too-many-requests")) {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f5f8]">
        <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center animate-pulse">
          <Stethoscope className="w-6 h-6 text-primary" />
        </div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f2f5f8] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">
            Admin Login
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Sanjivani Dentals — Clinic Management
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-lg p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Inactivity Auto-Logout Banner */}
            {isReasonInactivity && !error && (
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium p-3.5 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-amber-950">Session Expired for Security</strong>
                  You were logged out due to inactivity. Please sign in to resume your clinical session.
                </div>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-lg">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-on-surface-variant mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@clinic.com"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-on-surface-variant mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 rounded-lg border border-outline-variant/40 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/60 text-white font-semibold py-3 rounded-lg transition-colors text-sm cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-on-surface-variant mt-6">
          © 2024 Sanjivani Dentals. Admin access only.
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f2f5f8]">
          <div className="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center animate-pulse">
            <Stethoscope className="w-6 h-6 text-primary" />
          </div>
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
