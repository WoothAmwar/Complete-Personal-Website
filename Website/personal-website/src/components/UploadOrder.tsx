import { useEffect, useMemo, useRef, useState } from "react";

import { VideoBox } from "./VideoBox";
import { Button, EmptyState, Skeleton } from "@/components/ui/primitives";

/**
 * The feed, ordered by upload date across every channel.
 *
 * One flat grid, newest first, paged in as the reader nears the bottom. Cards
 * are a fixed shape so rows stay level however long the titles run.
 */
export default function OrderByTime(props: {
  pageSize?: number;
  responseVideoData: Array<any>;
  isLoading: boolean;
}) {
  const pageSize = props.pageSize ?? 16;

  const sortedVideos = useMemo(() => {
    if (!props.responseVideoData) return [] as any[];
    const flat: any[] = [];
    for (const group of props.responseVideoData) {
      if (Array.isArray(group)) flat.push(...group);
    }
    flat.sort(
      (a, b) => new Date(b["uploadDate"]).getTime() - new Date(a["uploadDate"]).getTime()
    );
    return flat;
  }, [props.responseVideoData]);

  const [visibleCount, setVisibleCount] = useState(pageSize);
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [pageSize, sortedVideos.length]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + pageSize, sortedVideos.length));
        }
      },
      { rootMargin: "600px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [sortedVideos.length, pageSize]);

  if (props.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 pt-2 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-2.5">
            <Skeleton className="aspect-video w-full rounded-surface" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (sortedVideos.length === 0) {
    return (
      <EmptyState
        title="No videos yet"
        body="Once your subscriptions are imported, every upload lands here newest first."
      />
    );
  }

  const hasMore = visibleCount < sortedVideos.length;

  return (
    <>
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 pt-2 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4">
        {sortedVideos.slice(0, visibleCount).map((details: any) => (
          <VideoBox
            key={details["videoId"]}
            includeDate={true}
            fullVideoDetails={details}
          />
        ))}
      </div>

      {hasMore ? (
        <>
          <div className="flex justify-center py-8">
            <Button
              variant="secondary"
              onClick={() =>
                setVisibleCount((value) => Math.min(value + pageSize, sortedVideos.length))
              }
            >
              Show more videos
            </Button>
          </div>
          <div ref={sentinelRef} className="h-px" aria-hidden="true" />
        </>
      ) : (
        <p className="py-10 text-center text-[13px] text-ink-muted">
          You have reached the oldest upload.
        </p>
      )}
    </>
  );
}
