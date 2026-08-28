import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDaysIcon,
  QueueListIcon,
  Squares2X2Icon,
  XMarkIcon,
} from "@heroicons/react/20/solid";

import OrderByChannel from "@/components/ChannelOrder";
import OrderByTime from "@/components/UploadOrder";
import VideoQueue from "@/components/VideoQueue";
import { AgentPrompt } from "@/components/youtube/AgentPrompt";
import { TagFilter } from "@/components/youtube/TagFilter";
import { useQueue } from "@/components/queue/QueueProvider";
import { CurrentUserId } from "@/helperFunctions/cookieManagement";
import { ApiError, fetchWithRetry } from "@/helperFunctions/fetchWithRetry";
import {
  Button,
  IconButton,
  SegmentedControl,
  cx,
  type Segment,
} from "@/components/ui/primitives";

type OrderMethod = "byChannel" | "byTime";

const ORDER_SEGMENTS: ReadonlyArray<Segment<OrderMethod>> = [
  {
    value: "byChannel",
    label: "By channel",
    icon: <Squares2X2Icon className="h-4 w-4" aria-hidden="true" />,
  },
  {
    value: "byTime",
    label: "By date",
    icon: <CalendarDaysIcon className="h-4 w-4" aria-hidden="true" />,
  },
];

const fetchVideos = async (currentUserGoogleId: string) => {
  const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_URL}/videos`, {
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

const fetchChannelsOfTag = async (currentUserGoogleId: string, tagName: string) => {
  const response = await fetchWithRetry(
    `${process.env.NEXT_PUBLIC_API_URL}/channels/channelsOfTag/${encodeURIComponent(tagName)}`,
    {
      method: "GET",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        "x-google-id": currentUserGoogleId,
      },
    }
  );
  if (!response.ok) throw new ApiError(response.status, "Network response was not ok");
  return response.json();
};

/** The queue rail, shared by the docked column and the small-screen sheet. */
function QueuePanel({
  videos,
  isLoading,
  onClose,
}: {
  videos: Array<Array<any>>;
  isLoading: boolean;
  onClose: () => void;
}) {
  const queue = useQueue();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-surface border border-line-subtle bg-surface">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-line-subtle px-3 py-2.5">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <QueueListIcon className="h-4 w-4 text-ink-muted" aria-hidden="true" />
          Queue
          {queue.ids.length > 0 ? (
            <span className="rounded-pill bg-inset px-1.5 py-0.5 font-mono text-[11px] text-ink-muted">
              {queue.ids.length}
            </span>
          ) : null}
        </h2>
        <IconButton label="Hide the queue" size="sm" onClick={onClose}>
          <XMarkIcon className="h-4 w-4" aria-hidden="true" />
        </IconButton>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pm-scroll">
        <VideoQueue fullVideoDetails={videos} isLoading={isLoading} />
      </div>

      <div className="shrink-0">
        <AgentPrompt />
      </div>
    </div>
  );
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const currentUserGoogleId = CurrentUserId();
  const queue = useQueue();

  const [orderMethod, setOrderMethod] = useState<OrderMethod>("byChannel");
  const [selectedTag, setSelectedTag] = useState("None");

  // The order lives in the URL so a view can be linked to and survives a reload.
  useEffect(() => {
    const fromQuery = router.query.order;
    setOrderMethod(fromQuery === "byTime" ? "byTime" : "byChannel");
  }, [router.query.order]);

  const changeOrder = (next: OrderMethod) => {
    setOrderMethod(next);
    router.replace({ query: { ...router.query, order: next } }, undefined, {
      shallow: true,
    });
  };

  const { data: videos, isLoading: isLoadingVideos } = useQuery({
    queryKey: ["videos", currentUserGoogleId],
    queryFn: () => fetchVideos(currentUserGoogleId.toString()),
    enabled: Boolean(currentUserGoogleId),
  });

  const { data: channelsForTag } = useQuery({
    queryKey: ["channelsOfTag", currentUserGoogleId, selectedTag],
    queryFn: () => fetchChannelsOfTag(currentUserGoogleId.toString(), selectedTag),
    enabled: Boolean(currentUserGoogleId) && selectedTag !== "None",
  });

  return (
    <>
      <Head>
        <title>Subscriptions</title>
      </Head>

      <div className="flex min-h-0 flex-1 flex-col">
        {/* Toolbar. Order is a toggle rather than a menu so both views are
            visible at once; the tag filter stays a menu because the list of
            tags is open-ended. */}
        <div className="flex shrink-0 flex-wrap items-center gap-2 py-4">
          <SegmentedControl
            label="Order videos"
            segments={ORDER_SEGMENTS}
            value={orderMethod}
            onChange={changeOrder}
          />

          {orderMethod === "byChannel" ? (
            <TagFilter
              googleId={currentUserGoogleId.toString()}
              selected={selectedTag}
              onSelect={setSelectedTag}
            />
          ) : null}

          {/* The queue rail only has room from lg up, so the control that
              brings it back is hidden below that rather than left inert. */}
          <div className="ml-auto hidden lg:block">
            {queue.panelOpen ? null : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => queue.setPanelOpen(true)}
              >
                <QueueListIcon className="h-4 w-4" aria-hidden="true" />
                Queue
                {queue.ids.length > 0 ? (
                  <span className="font-mono text-[11px] text-ink-muted">
                    {queue.ids.length}
                  </span>
                ) : null}
              </Button>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 gap-5">
          {/* The feed owns its own vertical scroll so the queue beside it stays
              put. Scroll-snap is on the container, targets are the channel
              sections inside ChannelOrder. */}
          <div
            className={cx(
              "min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden pm-scroll pr-1",
              orderMethod === "byChannel" && "snap-feed"
            )}
          >
            {orderMethod === "byChannel" ? (
              <OrderByChannel
                channelsToInclude={
                  selectedTag === "None" ? ["None"] : channelsForTag ?? []
                }
                responseVideoData={videos}
                isLoadingVideos={isLoadingVideos}
                pageSize={4}
              />
            ) : (
              <OrderByTime
                responseVideoData={videos}
                isLoading={isLoadingVideos}
                pageSize={16}
              />
            )}
          </div>

          {queue.panelOpen ? (
            <aside className="hidden min-h-0 w-[304px] shrink-0 pb-4 lg:block">
              <QueuePanel
                videos={videos ?? []}
                isLoading={isLoadingVideos}
                onClose={() => queue.setPanelOpen(false)}
              />
            </aside>
          ) : null}
        </div>
      </div>
    </>
  );
}
