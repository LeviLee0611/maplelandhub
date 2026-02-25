"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AnnouncementWriteButton() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (active) setIsAdmin(false);
        return;
      }

      const { data: adminRow, error } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !adminRow) {
        if (active) setIsAdmin(false);
        return;
      }

      if (active) setIsAdmin(true);
    }

    load();

    const supabase = getSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!isAdmin) return null;

  return (
    <Link
      href="/admin/announcements"
      className="rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-[11px] font-semibold text-cyan-100 hover:border-cyan-200/70"
    >
      글쓰기
    </Link>
  );
}
