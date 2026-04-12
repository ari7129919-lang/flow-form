import { getServerEnv } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function getAdminReceiverEmail() {
  const env = getServerEnv();
  if (env.USE_MOCK_DATA) {
    return env.ADMIN_RECEIVER_EMAIL ?? "";
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("ff_settings")
    .select("value")
    .eq("key", "admin_receiver_email")
    .maybeSingle();
  if (error) throw error;
  return data?.value ?? "";
}

export async function setAdminReceiverEmail(email: string) {
  const env = getServerEnv();
  if (env.USE_MOCK_DATA) {
    return;
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("ff_settings").upsert({
    key: "admin_receiver_email",
    value: email,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
