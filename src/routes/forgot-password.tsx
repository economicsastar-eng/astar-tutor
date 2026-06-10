import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — EconAStar" }] }),
  component: ForgotPasswordPage,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; form?: string }>({});

  const onSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setErrors({ email: "Email is required" });
      return;
    }
    if (!EMAIL_RE.test(trimmed)) {
      setErrors({ email: "Enter a valid email address" });
      return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      const m = error.message.toLowerCase();
      const form = m.includes("rate") || m.includes("too many")
        ? "Too many attempts. Please wait a few minutes and try again."
        : m.includes("network") || m.includes("fetch")
          ? "Network error. Check your connection and try again."
          : error.message;
      setErrors({ form });
      toast.error(form);
      return;
    }
    setSent(true);
    toast.success("Check your inbox for the reset link");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Link to="/"><Logo variant="light" /></Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold font-heading">Forgot your password?</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your email and we'll send you a reset link.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
          noValidate
          aria-busy={loading}
          className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
            {sent ? `Reset link sent to ${email}` : ""}
          </div>
          <div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only">
            {errors.form || errors.email || ""}
          </div>
          {sent ? (
            <div className="space-y-2 text-center">
              <p className="text-sm">
                If an account exists for <span className="font-semibold">{email}</span>, a reset link is on its way.
              </p>
              <p className="text-xs text-muted-foreground">Check your spam folder if you don't see it.</p>
            </div>
          ) : (
            <>
              {errors.form && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errors.form}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (errors.email || errors.form) setErrors({}); }}
                  placeholder="you@school.com"
                  autoComplete="email"
                  disabled={loading}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={`min-h-11 ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.email && (
                  <p id="email-error" className="text-xs text-destructive">{errors.email}</p>
                )}
              </div>
              <Button
                type="submit"
                disabled={loading || !email.trim()}
                aria-disabled={loading || !email.trim()}
                className="w-full min-h-11 bg-emerald hover:bg-emerald-hover text-white font-semibold"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /><span>Sending…</span></>
                ) : "Send reset link"}
              </Button>
            </>
          )}
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link to="/login" className="font-semibold text-foreground hover:underline">Back to log in</Link>
        </p>
      </div>
    </div>
  );
}
