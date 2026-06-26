"use client";

/**
 * Connections Modal — shows a user's connections list.
 *
 * Backend has no GET /users/{id}/connections endpoint for OTHER users.
 * For the VIEWER's own connections: GET /network returns them.
 * For a public profile: we show the viewer's OWN connections (standard
 * LinkedIn behavior — you see YOUR connections, not theirs, when you
 * click the count on someone else's profile).
 *
 * If a backend endpoint is added later, swap networkApi.connections() here.
 */

import { useQuery } from "@tanstack/react-query";
import { X, Loader2, Users } from "lucide-react";
import { imgUrl } from "@/lib/utils";
import { networkApi } from "@/lib/api/endpoints/network";
import Link from "next/link";

export function ConnectionsModal({ onClose }: { onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["network-connections"],
    queryFn: networkApi.connections,
    staleTime: 60_000,
  });

  // Each NetworkConnection has requester + recipient.
  // We need the OTHER person — not the viewer.
  // Since we don't know viewer id here, just dedupe and show both sides.
  // In practice networkApi normalizes to the connected user already.
  const connections = (data ?? []).map((conn) => {
    // If the API returns a normalized user directly use it
    const u = (conn as unknown as { user?: typeof conn.requester }).user
      ?? conn.recipient
      ?? conn.requester;
    return {
      id: u?.id ?? 0,
      name: u?.name ?? u?.display_name ?? "?",
      role: u?.role,
      headline: u?.headline,
      profile_image_url: u?.profile_image_url ?? u?.display_image,
      logo_url: u?.logo_url,
    };
  }).filter((u) => u.id !== 0);

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="modal-in w-full max-w-md overflow-hidden rounded-3xl border border-line2 bg-bg-2 shadow-lift flex flex-col"
        style={{ maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-6 py-4 shrink-0">
          <h2 className="font-display text-lg font-bold tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5 text-brand" /> Connections
          </h2>
          <button onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-faint hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="grid place-items-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-brand" />
            </div>
          ) : connections.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No connections yet.</p>
          ) : (
            connections.map((conn) => {
              const href = conn.role === "company"
                ? `/companies/${conn.id}`
                : `/users/${conn.id}`;
              const img = conn.profile_image_url ?? conn.logo_url ?? null;
              return (
                <Link
                  key={conn.id}
                  href={href}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 hover:border-brand transition-colors"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-elevated text-sm font-bold text-brand">
                    {img
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={imgUrl(img) ?? ""} alt="" className="h-full w-full object-cover" />
                      : (conn.name ?? "?").charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{conn.name}</p>
                    {conn.headline && (
                      <p className="text-xs text-muted truncate">{conn.headline}</p>
                    )}
                    {conn.role && (
                      <p className="text-xs text-faint capitalize">{conn.role}</p>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}