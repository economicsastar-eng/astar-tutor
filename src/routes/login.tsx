import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { setRememberMe } from "@/lib/auth-persistence";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — EconAStar" }] }),
  component: LoginPage,
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mapAuthError(message: string): { form?: string } {
  const m = message.toLowerCase();
  // Never differentiate "wrong password", "unknown email", or "email not confirmed"
  // — all three would let an attacker enumerate registered accounts.
  if (
    m.includes("invalid login") ||
    m.includes("invalid credentials") ||
    m.includes("email not confirmed") ||
    m.includes("user not found")
  ) {
    return { form: "Incorrect email or password. Please try again." };
  }
  if (m.includes("rate") || m.includes("too many")) {
    return { form: "Too many attempts. Please wait a moment and try again." };
  }
  if (m.includes("network") || m.includes("fetch")) {
    return { form: "Network error. Check your connection and try again." };
  }
  // Fallback: generic message — do not surface raw provider strings that may hint at account state.
  return { form: "Couldn't log you in. Please check your details and try again." };
}

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = "Email is required";
    else if (!EMAIL_RE.test(email.trim())) next.email = "Enter a valid email address";
    if (!password) next.password = "Password is required";
    else if (password.length < 6) next.password = "Password must be at least 6 characters";
    return next;
  };

  const onSubmit = async () => {
    const v = validate();
    if (v.email || v.password) {
      setErrors(v);
      return;
    }
    setErrors({});

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      const mapped = mapAuthError(error.message);
      setErrors(mapped);
      if (mapped.form) toast.error(mapped.form);
      return;
    }
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Link to="/"><Logo variant="light" /></Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold font-heading">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">Log in to keep progressing.</p>
          </div>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
          noValidate
          aria-busy={loading}
          className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only">
            {errors.form || errors.email || errors.password || ""}
          </div>
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
              onChange={(e) => { setEmail(e.target.value); if (errors.email || errors.form) setErrors((p) => ({ ...p, email: undefined, form: undefined })); }}
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (errors.password || errors.form) setErrors((p) => ({ ...p, password: undefined, form: undefined })); }}
              autoComplete="current-password"
              disabled={loading}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              className={`min-h-11 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
            {errors.password && (
              <p id="password-error" className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          <label className="flex items-center gap-3 cursor-pointer group min-h-11">
            <div className="relative">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
                className="peer sr-only"
              />
              <div className="w-5 h-5 rounded border border-border bg-input transition-colors peer-checked:bg-[#10b981] peer-checked:border-[#10b981] flex items-center justify-center">
                <svg
                  className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors select-none">
              Remember me
            </span>
          </label>

          <Button
            type="submit"
            disabled={loading || !email.trim() || !password}
            aria-disabled={loading || !email.trim() || !password}
            className="w-full min-h-11 bg-emerald hover:bg-emerald-hover text-white font-semibold"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /><span>Logging in…</span></>
            ) : "Log in"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          New to EconAStar?{" "}
          <Link to="/signup" className="font-semibold text-foreground hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
