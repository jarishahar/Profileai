"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Lock, CheckCircle } from "lucide-react";

export default function ResetPasswordPage({ token = "" }: { token?: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // success/closing
  const [done, setDone] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!token) toast.error("Invalid or missing reset link.");
  }, [token]);

  useEffect(() => {
    if (!done) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }

    if (countdown === 0) {
      const timer = setTimeout(() => {
        try {
          window.close();
        } catch {
          window.location.href = "/login";
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [done, countdown]);

  const onSubmit = async () => {
    if (!token) {
      toast.error("Invalid or missing reset link.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });

      if (res.ok) {
        toast.success("Password updated.");
        setDone(true);
        setCountdown(5); // keep 5s countdown, no redirect
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.message || "Reset link is invalid or expired.");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm border rounded-lg p-6 bg-background text-center">
          <div className="flex flex-col items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <h1 className="text-xl font-semibold">Password updated</h1>
            <p className="text-sm text-muted-foreground">
              This tab will close in{" "}
              <span className="font-medium">{countdown}</span>…
            </p>
            <div className="mt-3">
              <Button onClick={() => window.close()}>Close now</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm border rounded-lg p-6 bg-background">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-full border">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold">Set a new password</h1>
        </div>

        {!token && (
          <p className="text-sm text-destructive mb-4">
            This reset link is invalid. Ask an admin to resend it.
          </p>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-sm block mb-1">New password</label>
            <div className="relative">
              <Input
                type={showPw ? "text" : "password"}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
                aria-label={showPw ? "Hide password" : "Show password"}
                disabled={submitting}
              >
                {showPw ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm block mb-1">Confirm password</label>
            <div className="relative">
              <Input
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground"
                aria-label={showConfirm ? "Hide password" : "Show password"}
                disabled={submitting}
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            className="w-full"
            disabled={submitting || !token}
            onClick={onSubmit}
          >
            {submitting ? "Saving…" : "Set Password"}
          </Button>

          <p className="text-xs text-muted-foreground mt-2">
            This link may expire. If it’s expired, request a new reset link from
            your admin.
          </p>
        </div>
      </div>
    </div>
  );
}
