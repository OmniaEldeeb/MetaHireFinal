import { api } from "../client";

export type DevicePlatform = "android" | "ios" | "web";

export const devicesApi = {
  register: (body: { token: string; platform: DevicePlatform }) =>
    api.post<unknown>("/devices/register", body),

  unregister: (body: { token: string }) =>
    api.delete<unknown>("/devices/unregister", { data: body }),

  list: () => api.get<unknown>("/devices"),
};

/**
 * Web push token. Real FCM web tokens require Firebase Messaging setup, which
 * lands later. For now this returns null so login/logout never block on it.
 */
export async function getWebPushToken(): Promise<string | null> {
  return null;
}
