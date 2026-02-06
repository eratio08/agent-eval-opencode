"use client";

import { useState } from "react";
import Link from "next/link";

const DEFAULT_LIMIT = 50;

interface ShowMoreProps {
  children: React.ReactNode[];
  limit?: number;
  /** Total count of items (when server limits the fetch). Shows a Link instead of client-side toggle. */
  total?: number;
  /** URL to navigate to when showing all items (server-driven mode). */
  showAllHref?: string;
  className?: string;
}

export function ShowMore({
  children,
  limit = DEFAULT_LIMIT,
  total,
  showAllHref,
  className,
}: ShowMoreProps) {
  const [visibleCount, setVisibleCount] = useState(limit);

  // Server-driven: fewer children than total, link to load all from server
  const serverLimited = total !== undefined && total > children.length;

  // Client-driven: all children passed, show in increments
  const clientLimited = !serverLimited && children.length > visibleCount;

  const visible = clientLimited ? children.slice(0, visibleCount) : children;

  const totalCount = total ?? children.length;
  const shownCount = visible.length;
  const remainingCount = totalCount - shownCount;

  return (
    <div className={className}>
      {visible}
      {serverLimited && showAllHref && (
        <Link
          href={showAllHref}
          className="block w-full py-2 text-center text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          Show more ({remainingCount} remaining)
        </Link>
      )}
      {clientLimited && (
        <button
          onClick={() => setVisibleCount((c) => c + limit)}
          className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          Show more ({remainingCount} remaining)
        </button>
      )}
    </div>
  );
}
