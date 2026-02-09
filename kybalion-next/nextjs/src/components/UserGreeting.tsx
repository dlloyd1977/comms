"use client";

import { useEffect, useState } from "react";
import { createSPASassClient } from "@/lib/supabase/client";

type UserGreetingProps = {
  className?: string;
};

type MemberProfile = {
  nickname?: string | null;
  first_name?: string | null;
};

function pickDisplayName(nickname?: string | null, firstName?: string | null, email?: string | null) {
  const nick = (nickname || "").trim();
  const first = (firstName || "").trim();
  const mail = (email || "").trim();
  return nick || first || mail || "";
}

export default function UserGreeting({ className }: UserGreetingProps) {
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const supabase = await createSPASassClient();
        const {
          data: { user },
        } = await supabase.getSupabaseClient().auth.getUser();
        if (!user) return;

        const email = user.email || "";
        let nickname: string | null = user.user_metadata?.nickname ?? null;
        let firstName: string | null = user.user_metadata?.first_name ?? null;
        let name = pickDisplayName(nickname, firstName, email);

        try {
          const { data: profile } = await supabase
            .getSupabaseClient()
            .from("active_members")
            .select("nickname, first_name")
            .eq("email", email)
            .maybeSingle<MemberProfile>();
          if (profile?.nickname) nickname = profile.nickname;
          if (profile?.first_name) firstName = profile.first_name;
          name = pickDisplayName(nickname, firstName, email);
        } catch {
          // Non-critical profile lookup error
        }

        if (isMounted) {
          setDisplayName(name || null);
        }
      } catch {
        // No auth client or user
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!displayName) return null;

  return (
    <span className={className || "text-sm font-semibold text-slate-700"}>
      Hi {displayName}
    </span>
  );
}
