import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { PlusIcon, TrashIcon } from "@heroicons/react/20/solid";

import { CurrentUserId } from "@/helperFunctions/cookieManagement";
import {
  Button,
  EmptyState,
  INPUT_CLASS,
  PageHeader,
  Skeleton,
  cx,
} from "@/components/ui/primitives";

interface TrackedVideoInfo {
  id: string;
  category: string;
  videoID: string;
  videoTitle: string;
  videoThumbnail: string;
}

/** Pulls the id out of a normal watch URL. Returns "" when it is not one. */
const extractedVideoId = (full_url: string): string => {
  const split_url = full_url.split("=");
  const default_yt_url = split_url.at(0);
  const video_id = split_url.at(1);

  if (default_yt_url?.includes("https://www.youtube.com/watch?v") === false || video_id === undefined) {
    return "";
  }
  return video_id;
};

function TrackedCard({
  video,
  onRemove,
}: {
  video: TrackedVideoInfo;
  onRemove: (videoID: string) => void;
}) {
  return (
    <article className="group flex flex-col">
      <Link
        href={`/custom-youtube/${video.videoID}`}
        className="relative block aspect-video overflow-hidden rounded-surface bg-inset"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.videoThumbnail}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-pm group-hover:scale-[1.03]"
        />
      </Link>

      <div className="mt-2.5 flex flex-1 items-start gap-1">
        <Link href={`/custom-youtube/${video.videoID}`} className="min-w-0 flex-1">
          {/* Fixed to two lines so every card in the grid is the same height,
              however long the title runs. */}
          <h2 className="line-clamp-2 min-h-[2.6em] text-[14px] font-medium leading-[1.3] text-ink">
            {video.videoTitle}
          </h2>
        </Link>
        <button
          onClick={() => onRemove(video.videoID)}
          aria-label={`Remove ${video.videoTitle}`}
          title="Remove from the tracker"
          className={cx(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-ink-muted",
            "opacity-0 transition-all duration-200 ease-pm focus-visible:opacity-100 group-hover:opacity-100",
            "hover:bg-hovered hover:text-danger"
          )}
        >
          <TrashIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

export default function TrackerPage() {
  const currentUserGoogleID = CurrentUserId();

  const [videos, setVideos] = useState<TrackedVideoInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const fetchVideoInfo = useCallback(async () => {
    if (!currentUserGoogleID) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tracker`, {
        method: "GET",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "x-google-id": currentUserGoogleID,
        },
      });
      const data = await response.json();
      setVideos(Array.isArray(data) ? data : Object.values(data ?? {}));
    } catch (error) {
      console.error("Could not load the tracker", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserGoogleID]);

  useEffect(() => {
    fetchVideoInfo();
  }, [fetchVideoInfo]);

  const addVideoByURL = async () => {
    const videoId = extractedVideoId(url.trim());
    if (!videoId) {
      setUrlError("That is not a YouTube watch URL. It should look like https://www.youtube.com/watch?v=...");
      return;
    }

    setAdding(true);
    setUrlError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tracker/${videoId}`, {
        method: "PUT",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "x-google-id": currentUserGoogleID,
        },
        body: JSON.stringify({ data: "Filler" }),
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      if (data === "None") {
        setUrlError("That video is already in your tracker.");
        return;
      }
      setVideos((previous) => [...previous, data]);
      setUrl("");
    } catch (err) {
      console.error("Could not track the video", err);
      setUrlError("The video could not be added. Try again.");
    } finally {
      setAdding(false);
    }
  };

  const removeTrackedVideo = async (videoID: string) => {
    const snapshot = videos;
    setVideos((previous) => previous.filter((video) => video.videoID !== videoID));
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tracker/${videoID}`, {
        method: "DELETE",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "x-google-id": currentUserGoogleID,
        },
        body: JSON.stringify({ data: "Filler" }),
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    } catch (err) {
      console.error("Could not remove the tracked video", err);
      setVideos(snapshot);
    }
  };

  return (
    <>
      <Head>
        <title>Tracker</title>
      </Head>

      <PageHeader
        title="Tracker"
        description="Videos you saved by pasting a link. They stay here until you remove them, whatever happens to your subscriptions."
      />

      {/* The add form sits above the grid, because on an empty tracker it is
          the only thing to do, and on a full one it is still the entry point. */}
      <form
        className="mb-8 max-w-xl"
        onSubmit={(event) => {
          event.preventDefault();
          addVideoByURL();
        }}
      >
        <label htmlFor="tracker-url" className="text-[13px] font-medium text-ink">
          Add a video
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            id="tracker-url"
            className={INPUT_CLASS}
            value={url}
            placeholder="https://www.youtube.com/watch?v=..."
            onChange={(event) => {
              setUrl(event.target.value);
              setUrlError(null);
            }}
          />
          <Button
            type="submit"
            variant="primary"
            disabled={adding || url.trim().length === 0}
          >
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            {adding ? "Adding..." : "Add"}
          </Button>
        </div>
        {urlError ? (
          <p className="mt-1.5 text-[12px] text-danger">{urlError}</p>
        ) : (
          <p className="mt-1.5 text-[12px] text-ink-muted">
            Paste the link straight from the address bar.
          </p>
        )}
      </form>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2.5">
              <Skeleton className="aspect-video w-full rounded-surface" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-2/3" />
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <EmptyState
          title="Nothing tracked yet"
          body="Paste a YouTube link above and it will be waiting here next time you open the page."
        />
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-5">
          {videos.map((video) => (
            <TrackedCard
              key={video.videoID}
              video={video}
              onRemove={removeTrackedVideo}
            />
          ))}
        </div>
      )}
    </>
  );
}
