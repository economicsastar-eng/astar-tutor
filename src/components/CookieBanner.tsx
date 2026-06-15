import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("cookie-consent");
    if (!accepted) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="mx-auto max-w-4xl bg-navy text-white rounded-xl shadow-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-4 px-5 py-4">
        <p className="text-sm text-white/80 flex-1 leading-relaxed">
          We use essential cookies to keep you logged in. No advertising or tracking cookies.{" "}
          <Link to="/privacy" className="underline text-white hover:text-emerald transition-colors">
            Privacy Policy
          </Link>
        </p>
        <button
          onClick={accept}
          className="shrink-0 bg-emerald hover:bg-emerald-hover text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
