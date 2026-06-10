import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Fully removes the user from auth.users. Profile data + FK-cascaded
// tables (essays, attempts, completions, progress, conversations) are
// removed via ON DELETE CASCADE on profiles.id → auth.users.
export const deleteOwnAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ ok: true } | { error: string }> => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      console.error("deleteOwnAccount error:", error);
      return { error: error.message };
    }
    return { ok: true };
  });
