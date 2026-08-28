import { Fragment, useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { Menu, Transition } from "@headlessui/react";
import {
  BookmarkIcon,
  BookmarkSlashIcon,
  EllipsisVerticalIcon,
  MinusCircleIcon,
  PlusCircleIcon,
  StarIcon,
} from "@heroicons/react/20/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";

import { CurrentUserId } from "@/helperFunctions/cookieManagement";
import { fetchWithRetry } from "@/helperFunctions/fetchWithRetry";
import { useQueue } from "@/components/queue/QueueProvider";
import { cx } from "@/components/ui/primitives";

export function guidGenerator() {
  const S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  return `${S4()}${S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`;
}

/* ==========================================================================
   Favorites and watch later. Request shapes are unchanged.
   ========================================================================== */

export const getFavoriteVideos = async (currentUserGoogleID: string, getIdInfo: boolean) => {
  try {
    const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_URL}/videos/favorites`, {
      method: "GET",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        "x-google-id": currentUserGoogleID.toString(),
      },
    });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const raw_data = (await response.json())["data"];
    if (!getIdInfo) return raw_data;
    return raw_data.map((entry: any) => entry["videoId"]) as string[];
  } catch (err) {
    console.error("Could not read favorites", err);
    return null;
  }
};

const writeFavorite = async (
  method: "PUT" | "DELETE",
  currentUserGoogleID: string,
  fullVideoDetails: any
) => {
  try {
    const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_URL}/videos/favorites`, {
      method,
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        "x-google-id": currentUserGoogleID,
      },
      body: JSON.stringify({ data: fullVideoDetails }),
    });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return response.json();
  } catch (err) {
    console.error("Could not update favorites", err);
    return null;
  }
};

export const getWatchlaterVideos = async (currentUserGoogleID: string, getIdInfo: boolean) => {
  try {
    const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_URL}/videos/watchlater`, {
      method: "GET",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        "x-google-id": currentUserGoogleID.toString(),
      },
    });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    const raw_data = (await response.json())["data"];
    if (!getIdInfo) return raw_data;
    return raw_data.map((entry: any) => entry["videoId"]) as string[];
  } catch (err) {
    console.error("Could not read watch later", err);
    return null;
  }
};

const writeWatchlater = async (
  method: "PUT" | "DELETE",
  currentUserGoogleID: string,
  fullVideoDetails: any
) => {
  try {
    const response = await fetchWithRetry(`${process.env.NEXT_PUBLIC_API_URL}/videos/watchlater`, {
      method,
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        "x-google-id": currentUserGoogleID,
      },
      body: JSON.stringify({ data: fullVideoDetails }),
    });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return response.json();
  } catch (err) {
    console.error("Could not update watch later", err);
    return null;
  }
};

/* ==========================================================================
   Overflow menu
   ========================================================================== */

const ITEM_CLASS =
  "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-ink transition-colors";

function VideoActionItems({
  videoID,
  fullVideoDetails,
}: {
  videoID: string;
  fullVideoDetails: any;
}) {
  const currentUserGoogleID = CurrentUserId();
  const queue = useQueue();

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [watchlaterIds, setWatchlaterIds] = useState<string[]>([]);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!currentUserGoogleID) return;
    let cancelled = false;

    (async () => {
      const [favorites, watchlater] = await Promise.all([
        getFavoriteVideos(currentUserGoogleID.toString(), true),
        getWatchlaterVideos(currentUserGoogleID.toString(), true),
      ]);
      if (cancelled) return;
      setFavoriteIds(Array.isArray(favorites) ? favorites : []);
      setWatchlaterIds(Array.isArray(watchlater) ? watchlater : []);
    })();

    return () => {
      cancelled = true;
    };
  }, [revision, currentUserGoogleID]);

  const isFavorite = favoriteIds.includes(videoID);
  const isWatchlater = watchlaterIds.includes(videoID);
  const isQueued = queue.has(videoID);
  const queuePending = queue.pending.has(videoID);

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        aria-label="Video actions"
        className={cx(
          "flex h-8 w-8 items-center justify-center rounded-control text-ink-muted",
          "transition-colors duration-200 ease-pm hover:bg-hovered hover:text-ink"
        )}
      >
        <EllipsisVerticalIcon className="h-4 w-4" aria-hidden="true" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-30 mt-1.5 w-56 origin-top-right overflow-hidden rounded-surface border border-line-subtle bg-elevated py-1 shadow-lg focus:outline-none">
          {/* Queue first: it is the action this page exists for. */}
          <Menu.Item>
            {({ active }) => (
              <button
                disabled={queuePending}
                onClick={() => (isQueued ? queue.remove(videoID) : queue.add(videoID))}
                className={cx(ITEM_CLASS, active && "bg-hovered", queuePending && "opacity-50")}
              >
                {isQueued ? (
                  <MinusCircleIcon className="h-4 w-4 text-ink-muted" aria-hidden="true" />
                ) : (
                  <PlusCircleIcon className="h-4 w-4 text-accent" aria-hidden="true" />
                )}
                {isQueued ? "Remove from queue" : "Add to queue"}
              </button>
            )}
          </Menu.Item>

          <div className="my-1 border-t border-line-subtle" />

          <Menu.Item>
            {({ active }) => (
              <button
                onClick={async () => {
                  await writeFavorite(
                    isFavorite ? "DELETE" : "PUT",
                    currentUserGoogleID.toString(),
                    fullVideoDetails
                  );
                  setRevision((value) => value + 1);
                }}
                className={cx(ITEM_CLASS, active && "bg-hovered")}
              >
                {isFavorite ? (
                  <StarIcon className="h-4 w-4 text-amber-400" aria-hidden="true" />
                ) : (
                  <StarOutlineIcon className="h-4 w-4 text-ink-muted" aria-hidden="true" />
                )}
                {isFavorite ? "Remove from favorites" : "Add to favorites"}
              </button>
            )}
          </Menu.Item>

          <Menu.Item>
            {({ active }) => (
              <button
                onClick={async () => {
                  await writeWatchlater(
                    isWatchlater ? "DELETE" : "PUT",
                    currentUserGoogleID.toString(),
                    fullVideoDetails
                  );
                  setRevision((value) => value + 1);
                }}
                className={cx(ITEM_CLASS, active && "bg-hovered")}
              >
                {isWatchlater ? (
                  <BookmarkSlashIcon className="h-4 w-4 text-ink-muted" aria-hidden="true" />
                ) : (
                  <BookmarkIcon className="h-4 w-4 text-ink-muted" aria-hidden="true" />
                )}
                {isWatchlater ? "Remove from watch later" : "Save to watch later"}
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}

/* ==========================================================================
   Video card
   ========================================================================== */

export function VideoBox(props: {
  includeDate: boolean;
  fullVideoDetails: any;
  width?: number;
  height?: number;
  includeInfo?: boolean;
  /** Compact rows are used in the queue rail, where space is tight. */
  layout?: "card" | "row";
  onRemove?: () => void;
  removeLabel?: string;
}) {
  const embedLink = "/custom-youtube/";
  const videoId: string = props.fullVideoDetails?.["videoId"];
  const thumb: string = props.fullVideoDetails?.["videoThumbnail"];
  const title: string = props.fullVideoDetails?.["videoTitle"];
  const queue = useQueue();

  const showInfo = props.includeInfo !== false;
  const cardStyle: CSSProperties | undefined =
    props.width !== undefined ? { width: props.width } : undefined;

  if (props.layout === "row") {
    return (
      <div className="group flex items-start gap-2.5">
        <Link
          href={embedLink.concat(videoId)}
          className="relative aspect-video w-[104px] shrink-0 overflow-hidden rounded-control bg-inset"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumb}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </Link>
        <Link href={embedLink.concat(videoId)} className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[13px] font-medium leading-snug text-ink">
            {title}
          </p>
        </Link>
        {props.onRemove ? (
          <button
            onClick={props.onRemove}
            aria-label={props.removeLabel ?? "Remove from queue"}
            title={props.removeLabel ?? "Remove from queue"}
            disabled={queue.pending.has(videoId)}
            className={cx(
              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-control text-ink-muted",
              "opacity-0 transition-all duration-200 ease-pm focus-visible:opacity-100 group-hover:opacity-100",
              "hover:bg-hovered hover:text-ink disabled:opacity-40"
            )}
          >
            <MinusCircleIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <article className="group flex flex-col" style={cardStyle}>
      <Link
        href={embedLink.concat(videoId)}
        className="relative block aspect-video overflow-hidden rounded-surface bg-inset"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-pm group-hover:scale-[1.03]"
        />
      </Link>

      {showInfo ? (
        <div className="mt-2.5 flex items-start gap-1">
          <Link href={embedLink.concat(videoId)} className="min-w-0 flex-1">
            {/* Two lines and then an ellipsis, so every card in a grid is the
                same height whatever the title length. */}
            <h3 className="line-clamp-2 min-h-[2.6em] text-[14px] font-medium leading-[1.3] text-ink">
              {title}
            </h3>
            {props.includeDate && props.fullVideoDetails?.["uploadDate"] ? (
              <p className="mt-1 font-mono text-[11px] text-ink-muted">
                {String(props.fullVideoDetails["uploadDate"]).slice(0, 10)}
              </p>
            ) : null}
          </Link>
          <div className="shrink-0">
            <VideoActionItems videoID={videoId} fullVideoDetails={props.fullVideoDetails} />
          </div>
        </div>
      ) : null}
    </article>
  );
}
