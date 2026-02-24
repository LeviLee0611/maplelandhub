"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function AdminLink() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (active) setIsLoggedIn(false);
        return;
      }
      if (active) setIsLoggedIn(true);
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

  if (!isLoggedIn) return null;

  return (
    <Link href="/admin/feedback" className="hover:opacity-80">
      관리자
    </Link>
  );
}
