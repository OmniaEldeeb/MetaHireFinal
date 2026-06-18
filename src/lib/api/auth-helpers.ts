import type { Path, UseFormSetError, FieldValues } from "react-hook-form";
import { ApiException } from "@/lib/api/types";

/** A friendly device label for the `device_name` field the API requires. */
export function deviceName(): string {
  if (typeof navigator === "undefined") return "Web";
  const ua = navigator.userAgent;
  let browser = "Browser";
  if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("OPR") || ua.includes("Opera")) browser = "Opera";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari")) browser = "Safari";
  return `Web · ${browser}`;
}

/**
 * Pushes a 422 `meta.errors` map onto the matching form fields and returns a
 * general message for anything that isn't field-specific.
 */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
): string {
  if (error instanceof ApiException) {
    if (error.fieldErrors) {
      for (const [field, messages] of Object.entries(error.fieldErrors)) {
        if (messages?.[0]) {
          setError(field as Path<T>, { type: "server", message: messages[0] });
        }
      }
    }
    if (error.retryAfter) {
      return `Too many attempts. Try again in ${error.retryAfter}s.`;
    }
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
