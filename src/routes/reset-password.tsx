import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({ meta: [{ title: "Reset password — EconAStar" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [linkInvalid, setLinkInvalid] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; form?: string }>({});

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    // If the link is malformed/expired, no event fires — show fallback after a short wait.
    const t = setTimeout(() => {
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) setLinkInvalid(true);
      });
    }, 2500);
    return () => { sub.subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  const onSubmit = async () => {
    const next: { password?: string; confirm?: string } = {};
    if (!password) next.password = "Password is required";
    else if (password.length < 8) next.password = "Password must be at least 8 characters";
    if (!confirm) next.confirm = "Please confirm your password";
    else if (password !== confirm) next.confirm = "Passwords do not match";
    if (next.password || next.confirm) { setErrors(next); return; }
    setErrors({});
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      const m = error.message.toLowerCase();
      const form = m.includes("same") || m.includes("different")
        ? "New password must be different from your previous password."
        : m.includes("session") || m.includes("expired") || m.includes("token")
          ? "This reset link has expired. Please request a new one."
          : error.message;
      setErrors({ form });
      toast.error(form);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Link to="/"><Logo variant="light" /></Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold font-heading">Set a new password</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Choose a strong password you haven't used before.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
          noValidate
          aria-busy={loading}
          className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only">
            {errors.form || errors.password || errors.confirm || (linkInvalid ? "This reset link is invalid or has expired." : "")}
          </div>
          {!ready ? (
            linkInvalid ? (
              <div className="space-y-3 text-center">
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  This reset link is invalid or has expired.
                </div>
                <Link to="/forgot-password" className="text-sm font-semibold text-foreground hover:underline">
                  Request a new link
                </Link>
              </div>
            ) : (
              <p role="status" aria-live="polite" className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Verifying reset link…
              </p>
            )
          ) : (
            <>
              {errors.form && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errors.form}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password || errors.form) setErrors((p) => ({ ...p, password: undefined, form: undefined })); }}
                  autoComplete="new-password"
                  disabled={loading}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : "password-hint"}
                  className={`min-h-11 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.password ? (
                  <p id="password-error" className="text-xs text-destructive">{errors.password}</p>
                ) : (
                  <p id="password-hint" className="text-xs text-muted-foreground">At least 8 characters.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); if (errors.confirm || errors.form) setErrors((p) => ({ ...p, confirm: undefined, form: undefined })); }}
                  autoComplete="new-password"
                  disabled={loading}
                  aria-invalid={!!errors.confirm}
                  aria-describedby={errors.confirm ? "confirm-error" : undefined}
                  className={`min-h-11 ${errors.confirm ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {errors.confirm && (
                  <p id="confirm-error" className="text-xs text-destructive">{errors.confirm}</p>
                )}
              </div>
              <Button
                type="submit"
                disabled={loading || !password || !confirm}
                aria-disabled={loading || !password || !confirm}
                className="w-full min-h-11 bg-emerald hover:bg-emerald-hover text-white font-semibold"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /><span>Updating…</span></>
                ) : "Update password"}
              </Button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
