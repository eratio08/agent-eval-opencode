"use client";

import { Badge } from "@/components/ui/badge";
import { useLiveUpdates } from "@/hooks/use-live-updates";

interface LiveIndicatorProps {
  onUpdate?: () => void;
}

export function LiveIndicator({ onUpdate }: LiveIndicatorProps) {
  const { connected, lastEvent } = useLiveUpdates(
    onUpdate ? () => onUpdate() : undefined
  );

  if (!connected) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </div>
      <Badge variant="outline" className="text-xs">
        Live
      </Badge>
      {lastEvent?.experiment && (
        <span className="text-xs text-muted-foreground">
          Updated: {lastEvent.experiment}
        </span>
      )}
    </div>
  );
}
