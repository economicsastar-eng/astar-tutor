import { Check, X, Minus } from "lucide-react";

type Cell = "yes" | "no" | "warn" | "partial" | string;

const rows: { feature: string; cells: [Cell, Cell, Cell, Cell] }[] = [
  { feature: "Full spec-mapped course", cells: ["yes", "yes", "Partial", "no"] },
  { feature: "AI essay marking (that works)", cells: ["yes", "warn", "no", "no"] },
  { feature: "Handles graph/diagram questions", cells: ["yes", "no", "no", "no"] },
  { feature: "AI tutor (economics-trained)", cells: ["yes", "warn", "no", "no"] },
  { feature: "Adaptive spaced repetition", cells: ["yes", "yes", "Basic", "no"] },
  { feature: "Test Out for topics you know", cells: ["yes", "no", "no", "no"] },
  { feature: "Economics-only depth", cells: ["yes", "Multi-subject", "Multi-subject", "Varies"] },
  { feature: "Tutor-verified content", cells: ["yes", "yes", "Varies", "Varies"] },
  { feature: "Monthly price", cells: ["£19.99", "£74.99", "Free", "Free"] },
  { feature: "Until exams (2027)", cells: ["£49.99", "£354.99", "—", "—"] },
];

function CellIcon({ value, isOur }: { value: Cell; isOur?: boolean }) {
  if (value === "yes") return <Check className={`h-5 w-5 mx-auto ${isOur ? "text-emerald" : "text-muted-foreground"}`} strokeWidth={3} />;
  if (value === "no") return <X className="h-5 w-5 mx-auto text-muted-foreground/40" />;
  if (value === "warn") return <span className="text-amber-500 text-sm">⚠️ Poor</span>;
  if (value === "partial") return <Minus className="h-5 w-5 mx-auto text-muted-foreground" />;
  return <span className={`text-sm ${isOur ? "font-bold text-foreground" : "text-muted-foreground"}`}>{value}</span>;
}

export function Comparison() {
  return (
    <section id="compare" className="py-20 md:py-28 bg-background">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">How we stack up</h2>
          <p className="mt-4 text-lg text-muted-foreground">An honest, side-by-side comparison.</p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 font-semibold text-muted-foreground">Feature</th>
                <th className="p-4 font-display font-bold text-emerald bg-emerald/5">EconAStar</th>
                <th className="p-4 font-semibold text-muted-foreground">UpLearn</th>
                <th className="p-4 font-semibold text-muted-foreground">Seneca</th>
                <th className="p-4 font-semibold text-muted-foreground">PMT / YouTube</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.feature} className="border-b border-border last:border-0">
                  <td className="p-4 font-medium">{row.feature}</td>
                  <td className="p-4 text-center bg-emerald/5"><CellIcon value={row.cells[0]} isOur /></td>
                  <td className="p-4 text-center"><CellIcon value={row.cells[1]} /></td>
                  <td className="p-4 text-center"><CellIcon value={row.cells[2]} /></td>
                  <td className="p-4 text-center"><CellIcon value={row.cells[3]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
