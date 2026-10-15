"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Extra protection for the signed-in screens (Dashboard, History, Scan,
 * Settings). The server proxy already redirects logged-out visitors on every
 * page load; this covers the cases it can't see:
 *
 * - Logging out in another tab (Supabase tells every open tab).
 * - Pressing the browser's Back button after logging out, which can show a
 *   page straight from the browser's memory without asking the server.
 *
 * In both cases the user is sent to the login page. Renders nothing.
 */
export function AuthGuard() {
  useEffect(() => {
    const supabase = createClient();

    function goToLogin() {
      window.location.replace("/auth/login");
    }

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") goToLogin();
    });

    async function onPageShow(event: PageTransitionEvent) {
      // `persisted` = the page came from the browser's back/forward memory.
      if (!event.persisted) return;
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) goToLogin();
    }
    window.addEventListener("pageshow", onPageShow);

    return () => {
      data.subscription.unsubscribe();
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return null;
}
