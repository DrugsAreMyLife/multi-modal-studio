'use client';

import { Bell, Check, Trash2, X } from 'lucide-react';
import { useNotificationStore } from '@/lib/store/notification-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, removeNotification } =
    useNotificationStore();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="border-background ring-background absolute top-1 right-2 h-2 w-2 animate-pulse rounded-full border bg-red-500 ring-2" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-border bg-muted/40 flex items-center justify-between border-b px-4 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              title="Mark all as read"
              onClick={markAllAsRead}
            >
              <Check size={12} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:text-destructive h-6 w-6"
              title="Clear all"
              onClick={clearAll}
            >
              <Trash2 size={12} />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center py-8">
              <Bell size={24} className="mb-2 opacity-20" />
              <span className="text-xs">No notifications</span>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'border-border hover:bg-muted/50 group relative border-b px-4 py-3 transition-colors last:border-0',
                    !n.read && 'bg-primary/5',
                  )}
                  onClick={() => markAsRead(n.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                      <p
                        className={cn(
                          'text-xs leading-none font-medium',
                          !n.read && 'text-primary',
                        )}
                      >
                        {n.title}
                      </p>
                      {n.description && (
                        <p className="text-muted-foreground line-clamp-2 text-[10px]">
                          {n.description}
                        </p>
                      )}
                      <p className="text-muted-foreground text-[10px] opacity-50">
                        {formatDistanceToNow(n.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-5 w-5 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(n.id);
                      }}
                    >
                      <X size={12} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
