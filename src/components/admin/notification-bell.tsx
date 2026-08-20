"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationRow,
} from "@/server/actions/notification-actions";
import { cn } from "@/lib/utils";

const POLL_MS = 30_000;

export function NotificationBell() {
  const [items, setItems] = React.useState<NotificationRow[]>([]);
  const [unread, setUnread] = React.useState(0);

  const refresh = React.useCallback(() => {
    listNotifications()
      .then((r) => {
        setItems(r.items);
        setUnread(r.unread);
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  function handleOpenChange(next: boolean) {
    if (next) refresh();
  }

  function handleItemClick(n: NotificationRow) {
    if (n.readAt) return;
    setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, readAt: new Date() } : i)));
    setUnread((prev) => Math.max(0, prev - 1));
    markNotificationRead(n.id).catch(() => {});
  }

  function handleMarkAll() {
    setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt ?? new Date() })));
    setUnread(0);
    markAllNotificationsRead().catch(() => {});
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Уведомления"
          className="relative inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
        >
          <Bell className="size-4.5" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-signal text-[10px] font-semibold text-steel-950">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2">
          <DropdownMenuLabel className="p-0">Уведомления</DropdownMenuLabel>
          {unread > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              className="text-xs font-medium text-signal-700 hover:underline"
            >
              Отметить всё
            </button>
          )}
        </div>
        <DropdownMenuSeparator className="my-0" />
        {items.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">Пока пусто</p>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {items.map((n) => (
              <Link
                key={n.id}
                href={n.link || "/admin"}
                onClick={() => handleItemClick(n)}
                className={cn(
                  "block border-b border-border px-3 py-2.5 last:border-0 hover:bg-secondary",
                  !n.readAt && "bg-secondary/50"
                )}
              >
                <p className="text-sm font-medium text-primary">{n.title}</p>
                {n.body && <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>}
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {new Date(n.createdAt).toLocaleString("ru-RU")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
