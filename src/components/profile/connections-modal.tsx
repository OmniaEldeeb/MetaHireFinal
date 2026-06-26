"use client";

/**
 * ConnectionsModal
 * Calls GET /api/users/{userId}/connections — confirmed endpoint.
 * Response: { data: { connections: { data: [{ id, created_at, user: NetworkUser }] } } }
 * Shows the PROFILE OWNER's connections, not the viewer's.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Loader2, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { imgUrl } from "@/lib/utils";
import { networkApi, type NetworkUser } from "@/lib/api/endpoints/network";
import Link from "next/link";

interface ConnectionItem {
  id: number;
  created_at?: string;
  user: NetworkUser;
  connection_status?: string;
}

export function ConnectionsModal({
  userId,
  onClose,
}: {
  userId: number;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["user-connections", userId, page],
    queryFn: () => networkApi.userConnections(userId, page),
    staleTime: 60_000,
  });

  // Unwrap: data.connections.data
  const raw = (data as Record<string, unknown> | null);
  const paginator = raw?.connections as {
    data?: ConnectionItem[];
    current_page?: number;
    last_page?: number;
    total?: number;
  } | undefined;
  const items: ConnectionItem[] = paginator?.data ?? [];
  const currentPage = paginator?.current_page ?? 1;
  const lastPage = paginator?.last_page ?? 1;
  const total = paginator?.total ?? 0;

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
            <Users className="h-5 w-5 text-brand" />
            Connections
            {total > 0 && (
              <span className="ml-1 rounded-full bg-elevated px-2 py-0.5 text-xs font-normal text-muted">
                {total}
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-faint hover:text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="grid place-items-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-brand" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No connections yet.</p>
          ) : (
            items.map((conn) => {
              const u = conn.user;
              const href = u.role === "company"
                ? `/companies/${u.id}`
                : `/users/${u.id}`;
              const img = u.display_image ?? u.profile_image_url ?? u.logo_url ?? null;
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
                      : (u.name ?? u.display_name ?? "?").charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {u.name ?? u.display_name}
                    </p>
                    {u.headline && (
                      <p className="text-xs text-muted truncate">{u.headline}</p>
                    )}
                    <p className="text-xs text-faint capitalize">{u.role}</p>
                  </div>
                  {/* connection_status relative to viewer — shown when authenticated */}
                  {conn.connection_status && conn.connection_status !== "none" && (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${
                      conn.connection_status === "connected"
                        ? "bg-green/10 text-green"
                        : conn.connection_status === "pending_sent"
                          ? "bg-amber/10 text-amber"
                          : "bg-elevated text-muted"
                    }`}>
                      {conn.connection_status === "connected" ? "Connected"
                        : conn.connection_status === "pending_sent" ? "Pending"
                        : conn.connection_status === "following" ? "Following"
                        : conn.connection_status}
                    </span>
                  )}
                </Link>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="border-t border-line px-6 py-3 shrink-0 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:border-brand"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <span className="text-xs text-muted">
              Page {currentPage} of {lastPage}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={currentPage >= lastPage}
              className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:border-brand"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}