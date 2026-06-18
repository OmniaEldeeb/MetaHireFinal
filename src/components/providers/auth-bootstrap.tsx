"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { authApi } from "@/lib/api/endpoints/auth";
import { getToken } from "@/lib/api/session";

/** Runs once on mount. If a token is present, fetches the current user. */
export function AuthBootstrap() {
  const setUser = useAuthStore((s) => s.setUser);
  const setStatus = useAuthStore((s) => s.setStatus);
  const signOut = useAuthStore((s) => s.signOut);

  useEffect(() => {
    if (!getToken()) {
      setStatus("guest");
      return;
    }
    setStatus("loading");
    authApi
      .me()
      .then((res) => setUser(res.user, res.role))
      .catch(() => signOut());
  }, [setUser, setStatus, signOut]);

  return null;
}
