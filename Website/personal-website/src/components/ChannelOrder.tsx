import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { CurrentUserId } from "@/helperFunctions/cookieManagement";
import { ApiError, fetchWithRetry } from "@/helperFunctions/fetchWithRetry";
import { VideoBox } from "./VideoBox";
import { ManageShowTag } from "./buttons/ManageChannelTags";
import { Button, EmptyState, Skeleton } from "@/components/ui/primitives";

const fetchChannels = async (currentUserGoogleId: string) => {
  const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_URL}/channels`, {
    method: "GET",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      "x-google-id": currentUserGoogleId,
    },
  });
  if (!response.ok) throw new ApiError(response.status, "Network response was not ok");
  return response.json();
};

function ChannelSkeleton() {
  return (
    <div className="border-b border-line-subtle py-8">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-pill" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 lg:grid-cols-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="flex flex-col gap-2.5">
            <Skeleton className="aspect-video w-full rounded-surface" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The feed, grouped by channel.
 *
 * One channel is one section: an identity header, then a grid of that
 * channel's uploads. The grid means the whole page reads top to bottom with no
 * sideways scrolling anywhere, and each section is a vertical scroll-snap
 * target so a flick lands on a channel rather than between two.
 *
 * Channels are paged in as the reader approaches the end of the list, which
 * keeps the first paint cheap on accounts with a hundred subscriptions.
 */
export default function OrderByChannel(props: {
  channelsToInclude: string[];
  responseVideoData: Array<any>;
  isLoadingVideos: boolean;
  pageSize?: number;
}) {
  const currentUserGoogleId = CurrentUserId();
  const pageSize = props.pageSize ?? 4;

  const { data: responseChannelData, isLoading: isLoadingChannels } = useQuery({
    queryKey: ["channels", currentUserGoogleId],
    queryFn: () => fetchChannels(currentUserGoogleId.toString()),
    enabled: Boolean(currentUserGoogleId),
  });

  // Channel rows and video groups are parallel arrays from the API, so they are
  // filtered together by index to stay aligned.
  const { channels, videos } = useMemo<{ channels: any[]; videos: any[][] }>(() => {
    const emptyResult = { channels: [] as any[], videos: [] as any[][] };
    if (!responseChannelData || !props.responseVideoData) return emptyResult;

    const showAll = props.channelsToInclude[0] === "None";
    if (showAll) {
      return {
        channels: responseChannelData as any[],
        videos: props.responseVideoData as any[][],
      };
    }

    const allowed = new Set(props.channelsToInclude);
    const channelsOut: any[] = [];
    const videosOut: any[][] = [];
    for (let i = 0; i < responseChannelData.length; i++) {
      if (allowed.has(responseChannelData[i]?.["channelNames"])) {
        channelsOut.push(responseChannelData[i]);
        videosOut.push(props.responseVideoData[i] ?? []);
      }
    }
    return { channels: channelsOut, videos: videosOut };
  }, [responseChannelData, props.responseVideoData, props.channelsToInclude]);

  const [visibleChannels, setVisibleChannels] = useState(pageSize);
  useEffect(() => {
    setVisibleChannels(Math.min(pageSize, Math.max(channels.length, pageSize)));
  }, [pageSize, channels.length]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleChannels((prev) => Math.min(prev + pageSize, channels.length));
        }
      },
      { rootMargin: "600px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [channels.length, pageSize]);

  if (props.channelsToInclude.length === 0) {
    return (
      <EmptyState
        title="No channels carry that tag"
        body="Pick another tag, or open a channel's tag editor to add this one to it."
      />
    );
  }

  if (isLoadingChannels || props.isLoadingVideos) {
    return (
      <div>
        <ChannelSkeleton />
        <ChannelSkeleton />
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <EmptyState
        title="Nothing imported yet"
        body="Add your YouTube Data API key and channel ID on the dashboard, and your subscriptions arrive on the next update run."
      />
    );
  }

  const shown = channels.slice(0, visibleChannels);
  const hasMore = visibleChannels < channels.length;

  return (
    <>
      {shown.map((channel, index) => {
        const channelName: string = channel["channelNames"];
        const channelVideos: any[] = videos[index] ?? [];

        return (
          <section
            key={channelName}
            className="snap-row border-b border-line-subtle py-8 first:pt-2"
          >
            <header className="flex flex-wrap items-center gap-x-4 gap-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={channel["channelImages"]}
                alt=""
                width={44}
                height={44}
                loading="lazy"
                className="h-11 w-11 shrink-0 rounded-pill border border-line-subtle object-cover"
              />
              <div className="min-w-0">
                <h2 className="truncate font-display text-lg font-semibold text-ink">
                  {channelName}
                </h2>
                <p className="font-mono text-[11px] text-ink-muted">
                  {channelVideos.length} {channelVideos.length === 1 ? "video" : "videos"}
                </p>
              </div>
              <div className="ml-auto">
                <ManageShowTag channelName={channelName} />
              </div>
            </header>

            {channelVideos.length === 0 ? (
              <p className="mt-5 text-sm text-ink-muted">
                Nothing new since the last update.
              </p>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-x-5 lg:grid-cols-3 xl:grid-cols-4">
                {channelVideos.map((video) => (
                  <VideoBox
                    key={video["videoId"]}
                    includeDate={false}
                    fullVideoDetails={video}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {hasMore ? (
        <>
          <div className="flex justify-center py-8">
            <Button
              variant="secondary"
              onClick={() =>
                setVisibleChannels((value) => Math.min(value + pageSize, channels.length))
              }
            >
              Show more channels
            </Button>
          </div>
          <div ref={sentinelRef} className="h-px" aria-hidden="true" />
        </>
      ) : (
        <p className="py-10 text-center text-[13px] text-ink-muted">
          That is every channel.
        </p>
      )}
    </>
  );
}
