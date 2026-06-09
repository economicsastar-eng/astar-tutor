import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — EconAStar" }] }),
  component: SignupPage,
});

const EXAM_BOARDS = ["AQA", "Edexcel (A)", "Edexcel (B)", "OCR", "WJEC/Eduqas"];

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [examBoard, setExamBoard] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!name.trim() || !email.trim() || !password || !examBoard) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { name: name.trim(), exam_board: examBoard },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created!");
    navigate({ to: "/onboarding" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Link to="/"><Logo variant="light" /></Link>
          <div className="text-center">
            <h1 className="text-2xl font-bold font-heading">Create your account</h1>
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
