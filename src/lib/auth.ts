import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export async function upsertProfileFromUser() {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const nickname =
    user.user_metadata?.preferred_username ||
    user.user_metadata?.user_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Mapler";

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      nickname,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    console.warn("Profile upsert failed", error.message);
  }
}
