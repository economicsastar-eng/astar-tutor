import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

const VALID_PLANS = new Set([
  "monthly_subscription",
  "until_2027_onetime",
  "until_2028_onetime",
]);

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — EconAStar" }] }),
  validateSearch: (search: Record<string, unknown>): { plan?: string } => ({
    plan: typeof search.plan === "string" && VALID_PLANS.has(search.plan) ? search.plan : undefined,
  }),
  component: SignupPage,
});

const EXAM_BOARDS = ["AQA", "Edexcel (A)", "Edexcel (B)", "OCR", "WJEC/Eduqas"];
const YEAR_GROUPS = ["Year 12", "Year 13", "Retaking", "Other"];

function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  // Accept "07..." (UK) or "447..." or "+447..."
  if (digits.startsWith("44")) return `+${digits}`;
  if (digits.startsWith("0")) return `+44${digits.slice(1)}`;
  return `+44${digits}`;
}

function SignupPage() {
  const navigate = useNavigate();
  const { plan } = Route.useSearch();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [examBoard, setExamBoard] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const onSubmit = async () => {
    if (!name.trim() || !email.trim() || !password || !examBoard || !yearGroup || !phone.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    const phoneNorm = normalisePhone(phone);
    if (!phoneNorm || phoneNorm.length < 12) {
      toast.error("Please enter a valid UK mobile number");
      return;
    }
    setLoading(true);

    // Check phone uniqueness
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("phone_number", phoneNorm)
      .maybeSingle();
    if (existing) {
      setLoading(false);
      toast.error("An account with this phone number already exists. Please log in instead.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          name: name.trim(),
          exam_board: examBoard,
          year_group: yearGroup,
          phone_number: phoneNorm,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created!");
    setVerifyOpen(true);
  };

  const onCodeChange = (i: number, v: string) => {
    const ch = v.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[i] = ch;
    setCode(next);
    if (ch && i < 5) inputs.current[i + 1]?.focus();
  };

  const onVerify = async () => {
    // MVP: skip real SMS verification, just mark phone as verified and move on
    const { data: u } = await supabase.auth.getUser();
    if (u.user) {
      await supabase.from("profiles").update({ phone_verified: true }).eq("id", u.user.id);
    }
    // If they came in with a plan intent, jump straight into checkout.
    if (plan) {
      navigate({ to: "/checkout/start", search: { plan } as never });
      return;
    }
    navigate({ to: "/onboarding" });
  };

  if (verifyOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <Link to="/" className="inline-block"><Logo variant="light" /></Link>
          <h1 className="text-2xl font-bold font-display">Verify your phone</h1>
          <p className="text-sm text-muted-foreground">
            We've sent a 6-digit code to {phone}. Enter it below to continue.
          </p>
          <div className="flex justify-center gap-2">
            {code.map((c, i) => (
              <Input
                key={i}
                ref={(el) => { inputs.current[i] = el; }}
                value={c}
                onChange={(e) => onCodeChange(i, e.target.value)}
                inputMode="numeric"
                maxLength={1}
                className="w-12 h-14 text-center text-xl font-semibold"
              />
            ))}
          </div>
          <Button
            onClick={onVerify}
            className="w-full bg-emerald hover:bg-emerald-hover text-white font-semibold"
          >
            Verify & Continue
          </Button>
          <p className="text-xs text-muted-foreground">
            For now, any 6 digits work — real SMS verification ships next.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Link to="/"><Logo variant="light" /></Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold font-display">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-1">Start your A-Level Economics journey.</p>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Smith" autoComplete="name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.com" autoComplete="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exam-board">Exam board</Label>
            <Select value={examBoard} onValueChange={setExamBoard}>
              <SelectTrigger id="exam-board"><SelectValue placeholder="Choose your exam board" /></SelectTrigger>
              <SelectContent>
                {EXAM_BOARDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="year-group">What year are you in?</Label>
            <Select value={yearGroup} onValueChange={setYearGroup}>
              <SelectTrigger id="year-group"><SelectValue placeholder="Choose your year" /></SelectTrigger>
              <SelectContent>
                {YEAR_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <div className="flex items-stretch rounded-md border border-input bg-background overflow-hidden focus-within:ring-1 focus-within:ring-ring">
              <span className="inline-flex items-center px-3 text-sm bg-muted text-muted-foreground border-r border-input">+44</span>
              <input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="7700 900123"
                inputMode="tel"
                autoComplete="tel"
                className="flex-1 px-3 text-sm bg-transparent outline-none"
              />
            </div>
          </div>
          <Button onClick={onSubmit} disabled={loading} className="w-full bg-emerald hover:bg-emerald-hover text-white font-semibold">
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-foreground hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
