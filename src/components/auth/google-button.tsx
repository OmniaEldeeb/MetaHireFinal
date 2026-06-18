"use client";

import { useEffect, useId, useRef, useState } from "react";
import { authApi } from "@/lib/api/endpoints/auth";
import { deviceName } from "@/lib/api/auth-helpers";
import { useAuthSuccess } from "@/lib/hooks/use-auth";

interface GoogleCredential {
  credential: string;
}
interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (res: GoogleCredential) => void;
      }) => void;
      renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
    };
  };
}
declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

const SRC = "https://accounts.google.com/gsi/client";

export function GoogleSignInButton() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const onSuccess = useAuthSuccess();
  const targetRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId || !targetRef.current) return;

    const render = () => {
      if (!window.google || !targetRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (res) => {
          try {
            const payload = await authApi.googleSignIn({
              id_token: res.credential,
              device_name: deviceName(),
            });
            onSuccess(payload);
          } catch {
            setError("Google sign-in failed. Try another method.");
          }
        },
      });
      window.google.accounts.id.renderButton(targetRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
        shape: "rectangular",
      });
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SRC}"]`,
    );
    if (existing && window.google) {
      render();
    } else if (existing) {
      existing.addEventListener("load", render, { once: true });
    } else {
      const script = document.createElement("script");
      script.src = SRC;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", render, { once: true });
      document.head.appendChild(script);
    }
  }, [clientId, onSuccess, id]);

  if (!clientId) return null;

  return (
    <div>
      <div ref={targetRef} className="flex justify-center" />
      {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
