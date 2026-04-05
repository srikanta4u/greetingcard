import { adminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireAdmin(redirectTo = "/admin/orders") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  const { data: row, error } = await adminClient
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || row?.role !== "admin") {
    redirect("/dashboard");
  }

  return { user, role: row.role as string };
}
