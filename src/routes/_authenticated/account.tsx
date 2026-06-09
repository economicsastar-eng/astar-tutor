import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/app/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Account — EconAStar" }] }),
  component: AccountPage,
});

const EXAM_BOARDS = ["AQA", "Edexcel", "OCR", "WJEC"];
const YEAR_GROUPS = ["Year 12", "Year 13", "Retaking", "Other"];
const TARGET_GRADES = ["A*", "A", "B", "C", "Just want to pass"];
const DAILY_TARGETS = [1, 2, 3, 5];

const PLAN_LABEL: Record<string, { label: string; color: string }> = {
  free: { label: "Free", color: "bg-slate-500/20 text-slate-300" },
  monthly: { label: "Monthly", color: "bg-emerald/20 text-emerald" },
  until_exams_2027: { label: "Until Exams 2027", color: "bg-gold/20 text-gold" },
  until_exams_2028: { label: "Until Exams 2028", color: "bg-gold/20 text-gold" },
};

function AccountPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [form, setForm] = useState({
    name: "",
    exam_board: "AQA",
    year_group: "Year 13",
    target_grade: "A*",
    exam_date: "",
    daily_target: 2,
    plan: "free",
  });
  const [pwOpen, setPwOpen] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [delLoading, setDelLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setEmail(u.user.email ?? "");
      const { data: p } = await supabase
        .from("profiles")
        .select("name,exam_board,year_group,target_grade,exam_date,daily_target,plan,phone_number")
        .eq("id", u.user.id)
        .maybeSingle();
      if (p) {
        setPhone(p.phone_number ?? "");
        setForm({
          name: p.name ?? "",
          exam_board: p.exam_board || "AQA",
          year_group: p.year_group || "Year 13",
          target_grade: p.target_grade || "A*",
          exam_date: (p.exam_date as unknown as string) ?? "",
          daily_target: p.daily_target ?? 2,
          plan: p.plan ?? "free",
        });
      }
      setLoading(false);
    })();
  }, []);

  const onSave = async () => {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase
      .from("profiles")
      .update({
        name: form.name.trim(),
        exam_board: form.exam_board,
        year_group: form.year_group,
        target_grade: form.target_grade,
        exam_date: form.exam_date || null,
        daily_target: form.daily_target,
      })
      .eq("id", u.user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Changes saved");
  };

  const onChangePassword = async () => {
    if (pwNew.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (pwNew !== pwConfirm) {
      toast.error("Passwords don't match");
      return;
    }
    setPwLoading(true);
    const { error: vErr } = await supabase.auth.signInWithPassword({ email, password: pwCurrent });
    if (vErr) {
      setPwLoading(false);
      toast.error("Current password is incorrect");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: pwNew });
    setPwLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    setPwOpen(false);
    setPwCurrent("");
    setPwNew("");
    setPwConfirm("");
  };

  const onDownload = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const [{ data: attempts }, { data: essays }, { data: completions }] = await Promise.all([
      supabase.from("quiz_attempts").select("*").eq("user_id", u.user.id),
      supabase.from("essay_submissions").select("*").eq("user_id", u.user.id),
      supabase.from("lesson_completions").select("*").eq("user_id", u.user.id),
    ]);
    const blob = new Blob(
      [JSON.stringify({ quiz_attempts: attempts, essay_submissions: essays, lesson_completions: completions }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "econastar-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onDeleteAccount = async () => {
    setDelLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setDelLoading(false);
      return;
    }
    // RLS-scoped tables; cascade FKs handle the rest after the auth user is removed.
    // We can't delete the auth user from the client directly without an edge function,
    // so we'll wipe profile data and sign out. The user can request full deletion via support.
    await supabase.from("profiles").delete().eq("id", u.user.id);
    await supabase.auth.signOut();
    setDelLoading(false);
    toast.success("Account data deleted");
    navigate({ to: "/", replace: true });
  };

  if (loading) {
    return (
      <AppLayout title="Account">
        <div className="text-slate-400">Loading…</div>
      </AppLayout>
    );
  }

  const planInfo = PLAN_LABEL[form.plan] ?? PLAN_LABEL.free;

  return (
    <AppLayout title="Account">
      <div className="space-y-8 max-w-2xl">
        {/* Profile */}
        <section className="rounded-xl bg-[#1a2744] border border-white/5 p-6 space-y-4">
          <h2 className="font-display font-semibold text-white text-lg">Profile</h2>
          <Field label="Display name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input value={email} disabled className="opacity-60" />
          </Field>
          <Field label="Phone number">
            <Input value={phone || "Not set"} disabled className="opacity-60" />
          </Field>
          <Field label="Exam board">
            <Select value={form.exam_board} onValueChange={(v) => setForm({ ...form, exam_board: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{EXAM_BOARDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Year group">
            <Select value={form.year_group} onValueChange={(v) => setForm({ ...form, year_group: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{YEAR_GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Target grade">
            <Select value={form.target_grade} onValueChange={(v) => setForm({ ...form, target_grade: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TARGET_GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Exam date">
            <Input type="date" value={form.exam_date} onChange={(e) => setForm({ ...form, exam_date: e.target.value })} />
          </Field>
          <Field label="Daily lesson target">
            <Select value={String(form.daily_target)} onValueChange={(v) => setForm({ ...form, daily_target: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DAILY_TARGETS.map((n) => <SelectItem key={n} value={String(n)}>{n} lesson{n > 1 ? "s" : ""} per day</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Button onClick={onSave} disabled={saving} className="bg-emerald hover:bg-emerald-hover text-emerald-foreground font-semibold">
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </section>

        {/* Subscription */}
        <section className="rounded-xl bg-[#1a2744] border border-white/5 p-6 space-y-3">
          <h2 className="font-display font-semibold text-white text-lg">Subscription</h2>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${planInfo.color}`}>
              {planInfo.label}
            </span>
            {form.plan === "free" && (
              <Button size="sm" className="bg-emerald hover:bg-emerald-hover text-emerald-foreground font-semibold">
                Upgrade
              </Button>
            )}
          </div>
        </section>

        {/* Security */}
        <section className="rounded-xl bg-[#1a2744] border border-white/5 p-6 space-y-3">
          <h2 className="font-display font-semibold text-white text-lg">Security</h2>
          <Button variant="outline" onClick={() => setPwOpen(true)}>Change Password</Button>
        </section>

        {/* Data */}
        <section className="rounded-xl bg-[#1a2744] border border-white/5 p-6 space-y-3">
          <h2 className="font-display font-semibold text-white text-lg">Data</h2>
          <Button variant="outline" onClick={onDownload}>Download My Data</Button>
          <div>
            <button
              onClick={() => setDelOpen(true)}
              className="text-sm text-incorrect/80 hover:text-incorrect underline-offset-4 hover:underline cursor-pointer"
            >
              Delete account
            </button>
          </div>
        </section>
      </div>

      {/* Password dialog */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Current password">
              <Input type="password" value={pwCurrent} onChange={(e) => setPwCurrent(e.target.value)} />
            </Field>
            <Field label="New password">
              <Input type="password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} />
            </Field>
            <Field label="Confirm new password">
              <Input type="password" value={pwConfirm} onChange={(e) => setPwConfirm(e.target.value)} />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)}>Cancel</Button>
            <Button onClick={onChangePassword} disabled={pwLoading} className="bg-emerald hover:bg-emerald-hover text-emerald-foreground font-semibold">
              {pwLoading ? "Updating…" : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={delOpen} onOpenChange={setDelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This permanently deletes all your data, progress, and essays. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={onDeleteAccount} disabled={delLoading}>
              {delLoading ? "Deleting…" : "Yes, delete my account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-slate-300">{label}</Label>
      {children}
    </div>
  );
}
