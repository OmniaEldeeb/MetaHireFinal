"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2, UserPlus, UserCheck, UserX,
  Users, Clock, Send,
} from "lucide-react";
import { Container } from "@/components/ui/section";
import { Tabs } from "@/components/ui/tabs";
import {
  networkApi,
  type NetworkConnection,
  type NetworkRequest,
  type NetworkSuggestion,
  type NetworkUser,
} from "@/lib/api/endpoints/network";
import { useToastStore } from "@/stores/toast.store";
import { useAuthStore } from "@/stores/auth.store";
import { imgUrl } from "@/lib/utils";

const TABS = [
  { key: "connections", label: "Connections" },
  { key: "pending",     label: "Pending" },
  { key: "sent",        label: "Sent" },
  { key: "suggestions", label: "Suggestions" },
];

// Extract the "other" user from a connection depending on the tab context.
// connections → could be requester or recipient (pick the one that isn't us)
// pending     → requester (who sent us the request)
// sent        → recipient (who we sent to)
// suggestions → the item IS the user (flat NetworkUser)
function resolveUser(
  item: NetworkConnection | NetworkRequest | NetworkSuggestion,
  tab: string,
  myId?: number,
): NetworkUser | null {
  if (tab === "suggestions") {
    return item as NetworkUser;
  }
  if (tab === "pending") {
    return (item as NetworkRequest).requester ?? null;
  }
  if (tab === "sent") {
    return (item as NetworkRequest).recipient ?? null;
  }
  // connections: pick whichever side is not the current user
  const conn = item as NetworkConnection;
  if (myId && conn.requester?.id === myId) return conn.recipient ?? null;
  return conn.requester ?? null;
}

function UserCard({
  user,
  itemId,
  tab,
  onAccept,
  onDisconnect,
  onConnect,
}: {
  user: NetworkUser;
  itemId: number;
  tab: string;
  onAccept?: () => void;
  onDisconnect?: () => void;
  onConnect?: () => void;
}) {
  // AuthorResource / formatUser() returns display_image and name directly
  const img = user.display_image;
  const name = user.display_name ?? user.name ?? "User";
  const initial = name.charAt(0);

  // Build profile href based on role
  const profileHref = user.role === "company"
    ? `/companies/${user.id}`
    : user.id ? `/users/${user.id}` : null;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
      {profileHref ? (
        <a href={profileHref} className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-elevated text-sm font-bold text-brand">
          {img
            ? <img src={imgUrl(img) ?? ""} alt="" className="h-full w-full object-cover" />
            : initial}
        </a>
      ) : (
        <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-elevated text-sm font-bold text-brand">
          {img
            ? <img src={imgUrl(img) ?? ""} alt="" className="h-full w-full object-cover" />
            : initial}
        </div>
      )}
      <div className="min-w-0 flex-1">
        {profileHref ? (
          <a href={profileHref} className="truncate text-sm font-semibold hover:underline block">{name}</a>
        ) : (
          <p className="truncate text-sm font-semibold">{name}</p>
        )}
        {user.headline && (
          <p className="truncate text-xs text-muted">{user.headline}</p>
        )}
        {user.role && (
          <p className="readout text-[0.65rem] uppercase text-faint">{user.role}</p>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        {tab === "pending" && (
          <button
            onClick={onAccept}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-brand px-3 text-sm font-medium text-white hover:bg-brand-strong"
          >
            <UserCheck className="h-4 w-4" /> Accept
          </button>
        )}
        {tab === "suggestions" && (
          <button
            onClick={onConnect}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-line2 bg-surface px-3 text-sm font-medium hover:border-brand hover:text-brand"
          >
            <UserPlus className="h-4 w-4" /> Connect
          </button>
        )}
        {tab === "connections" && (
          <button
            onClick={onDisconnect}
            className="grid h-9 w-9 place-items-center rounded-xl border border-line text-faint hover:border-coral hover:text-coral"
          >
            <UserX className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return (
    <div className="grid place-items-center gap-3 py-16 text-center">
      <Icon className="h-8 w-8 text-faint" />
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}

export function NetworkPage() {
  const qc = useQueryClient();
  const toast = useToastStore((s) => s.push);
  const myId = useAuthStore((s) => s.user?.id);
  const [tab, setTab] = useState("connections");

  const connections = useQuery({ queryKey: ["connections"], queryFn: networkApi.connections, enabled: tab === "connections" });
  const pending     = useQuery({ queryKey: ["pending"],     queryFn: networkApi.pending,     enabled: tab === "pending" });
  const sent        = useQuery({ queryKey: ["sent"],        queryFn: networkApi.sent,        enabled: tab === "sent" });
  const suggestions = useQuery({ queryKey: ["suggestions"], queryFn: networkApi.suggestions, enabled: tab === "suggestions" });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["connections"] });
    qc.invalidateQueries({ queryKey: ["pending"] });
    qc.invalidateQueries({ queryKey: ["sent"] });
    qc.invalidateQueries({ queryKey: ["suggestions"] });
  };

  const accept = async (id: number) => {
    try { await networkApi.accept(id); refresh(); toast({ kind: "success", title: "Connection accepted" }); }
    catch { toast({ kind: "error", title: "Accept failed" }); }
  };

  const disconnect = async (id: number) => {
    try { await networkApi.disconnect(id); refresh(); toast({ kind: "success", title: "Disconnected" }); }
    catch { toast({ kind: "error", title: "Failed" }); }
  };

  const connect = async (userId: number) => {
    try {
      const res = await networkApi.connect(userId);
      const data = (res as { data?: { status: string } }).data ?? res;
      refresh();
      toast({ kind: "success", title: (data as { status?: string }).status === "accepted" ? "Followed!" : "Request sent" });
    } catch (e: unknown) {
      const status = (e as { status?: number }).status;
      if (status === 409) toast({ kind: "info", title: "Already connected" });
      else toast({ kind: "error", title: "Connect failed" });
    }
  };

  const rawItems: Array<NetworkConnection | NetworkRequest | NetworkSuggestion> = (
    tab === "connections" ? connections.data :
    tab === "pending"     ? pending.data :
    tab === "sent"        ? sent.data :
    suggestions.data
  ) ?? [];

  const loading = (
    tab === "connections" ? connections.isLoading :
    tab === "pending"     ? pending.isLoading :
    tab === "sent"        ? sent.isLoading :
    suggestions.isLoading
  );

  return (
    <Container className="py-8">
      <h1 className="mb-6 font-display text-2xl font-extrabold tracking-tight">Network</h1>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <div className="mt-5">
        {loading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-brand" />
          </div>
        ) : rawItems.length === 0 ? (
          <EmptyState
            icon={tab === "pending" ? Clock : tab === "sent" ? Send : Users}
            text={
              tab === "connections" ? "No connections yet." :
              tab === "pending"     ? "No pending requests." :
              tab === "sent"        ? "No sent requests." :
              "No suggestions right now."
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {rawItems.map((item) => {
              const user = resolveUser(item, tab, myId);
              if (!user) return null;
              return (
                <UserCard
                  key={item.id}
                  user={user}
                  itemId={item.id}
                  tab={tab}
                  onAccept={() => accept(item.id)}
                  onDisconnect={() => disconnect(item.id)}
                  onConnect={() => connect(user.id!)}
                />
              );
            })}
          </div>
        )}
      </div>
    </Container>
  );
}
